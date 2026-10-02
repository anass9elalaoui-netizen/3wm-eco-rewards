import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  JsonRpcProvider,
  Wallet,
  Contract,
  parseUnits,
  parseEther,
} from "ethers";
import {
  BSC_RPC,
  TOKEN_CONTRACT_ADDRESS,
  TOKEN_DECIMALS,
  ERC20_ABI,
} from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, amount, merchantAddress } = body;

    if (!phoneNumber || !amount || !merchantAddress) {
      return NextResponse.json(
        { error: "Numéro, montant et adresse marchand requis." },
        { status: 400 }
      );
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(merchantAddress)) {
      return NextResponse.json(
        { error: "Adresse marchand invalide." },
        { status: 400 }
      );
    }

    const action = await prisma.ecoAction.findUnique({
      where: { phoneNumber },
    });

    if (!action) {
      return NextResponse.json(
        { error: "Client introuvable." },
        { status: 404 }
      );
    }

    if (action.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Ce client n'est pas encore approuvé." },
        { status: 400 }
      );
    }

    if (!action.walletAddress) {
      return NextResponse.json(
        { error: "Ce client n'a pas de wallet associé." },
        { status: 400 }
      );
    }

    if (!action.encryptedPrivKey) {
      return NextResponse.json(
        {
          error:
            "Ce client gère son propre portefeuille (BYOW). Opération non disponible.",
        },
        { status: 400 }
      );
    }

    // ── GAS_TANK_PRIVATE_KEY: Dedicated gas wallet, NOT the admin master key ──
    const gasTankKey = process.env.GAS_TANK_PRIVATE_KEY;
    if (!gasTankKey) {
      return NextResponse.json(
        { error: "Configuration serveur incomplète (GAS_TANK manquant)." },
        { status: 500 }
      );
    }

    const provider = new JsonRpcProvider(BSC_RPC);

    // ── Transaction 1: JIT Gas — Send micro BNB for user gas fees ──
    let gasTxHash: string;
    try {
      const gasTankWallet = new Wallet(gasTankKey, provider);
      const gasTx = await gasTankWallet.sendTransaction({
        to: action.walletAddress,
        value: parseEther("0.0005"),
      });
      const gasReceipt = await gasTx.wait();
      if (!gasReceipt || gasReceipt.status !== 1) {
        throw new Error("Gas transaction échouée.");
      }
      gasTxHash = gasTx.hash;
    } catch (gasError) {
      const errMsg =
        gasError instanceof Error ? gasError.message : String(gasError);
      return NextResponse.json(
        {
          error: `Échec du financement gas (JIT): ${errMsg}`,
        },
        { status: 500 }
      );
    }

    // ── Transaction 2: User's custodial wallet sends 3WM to merchant ──
    let spendTxHash: string;
    try {
      const userWallet = new Wallet(action.encryptedPrivKey, provider);
      const contract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        ERC20_ABI,
        userWallet
      );

      const parsedAmount = parseUnits(amount.toString(), TOKEN_DECIMALS);
      const spendTx = await contract.transfer(merchantAddress, parsedAmount);
      const spendReceipt = await spendTx.wait();

      if (!spendReceipt || spendReceipt.status !== 1) {
        throw new Error("Token transfer échoué.");
      }
      spendTxHash = spendTx.hash;
    } catch (spendError) {
      const errMsg =
        spendError instanceof Error ? spendError.message : String(spendError);
      return NextResponse.json(
        {
          error: `Échec du transfert des tokens: ${errMsg}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Paiement effectué avec succès.",
      gasTxHash,
      spendTxHash,
      from: action.walletAddress,
      to: merchantAddress,
      amount: amount.toString(),
    });
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Erreur serveur: ${err}` },
      { status: 500 }
    );
  }
}
