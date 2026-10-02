import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ethers, JsonRpcProvider, Wallet, Contract, parseUnits, type Signer } from "ethers";
import {
  BSC_RPC,
  TOKEN_CONTRACT_ADDRESS,
  TOKEN_DECIMALS,
  ERC20_ABI,
} from "@/lib/constants";

// ── Slug generation ──
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

// ── Shared: Resolve user wallet (BYOW or Custodial) ──
function resolveUserWallet(existingWalletAddress: string | null): {
  walletAddress: string;
  privateKey: string | undefined;
} {
  if (existingWalletAddress) {
    return { walletAddress: existingWalletAddress, privateKey: undefined };
  }
  const newWallet = ethers.Wallet.createRandom();
  return { walletAddress: newWallet.address, privateKey: newWallet.privateKey };
}

// ── Shared: Generate unique slug ──
async function generateUniqueSlug(fullName: string): Promise<string> {
  let slug = generateSlug(fullName);
  const existing = await prisma.ecoAction.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }
  return slug;
}

// ── Shared: Update database after confirmed transfer ──
async function updateDatabaseAfterApproval(
  id: string,
  walletAddress: string,
  privateKey: string | undefined,
  rewardAmount: number,
  slug: string
) {
  await prisma.ecoAction.update({
    where: { id },
    data: {
      status: "APPROVED",
      walletAddress,
      encryptedPrivKey: privateKey,
      rewardAmount,
      slug,
    },
  });
}

// ── Shared: Validate & fetch pending action ──
async function fetchPendingAction(id: string) {
  const action = await prisma.ecoAction.findUnique({ where: { id } });
  if (!action) {
    return { error: "Soumission introuvable.", status: 404, action: null };
  }
  if (action.status !== "PENDING") {
    return { error: "Cette soumission a déjà été traitée.", status: 400, action: null };
  }
  return { error: null, status: 200, action };
}

// ── Execute on-chain transfer with any Signer ──
async function executeTokenTransfer(
  signer: Signer,
  recipientAddress: string,
  rewardAmount: number
): Promise<void> {
  const contract = new Contract(TOKEN_CONTRACT_ADDRESS, ERC20_ABI, signer);
  const parsedAmount = parseUnits(rewardAmount.toString(), TOKEN_DECIMALS);
  const tx = await contract.transfer(recipientAddress, parsedAmount);
  const receipt = await tx.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error("Transaction échouée sur la blockchain.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, method, amount } = body;

    // ── Base validation ──
    if (!id || !method || !amount) {
      return NextResponse.json(
        { error: "ID, méthode et montant requis." },
        { status: 400 }
      );
    }

    const rewardAmount = Number(amount);
    if (isNaN(rewardAmount) || rewardAmount <= 0) {
      return NextResponse.json(
        { error: "Montant invalide." },
        { status: 400 }
      );
    }

    // ── Fetch and validate pending action ──
    const { error: actionError, status: actionStatus, action } = await fetchPendingAction(id);
    if (actionError || !action) {
      return NextResponse.json({ error: actionError }, { status: actionStatus });
    }

    // ── Resolve user wallet ──
    const { walletAddress, privateKey } = resolveUserWallet(action.walletAddress);
    const slug = await generateUniqueSlug(action.fullName);

    // ═══════════════════════════════════════════════════════════════
    // METHOD 1: WalletConnect (Frontend already signed & sent tx)
    // ═══════════════════════════════════════════════════════════════
    if (method === "walletconnect") {
      const { txHash } = body;
      if (!txHash) {
        return NextResponse.json(
          { error: "Hash de transaction requis pour la méthode WalletConnect." },
          { status: 400 }
        );
      }

      // Verify the transaction on-chain
      try {
        const provider = new JsonRpcProvider(BSC_RPC);
        const receipt = await provider.getTransactionReceipt(txHash);

        if (!receipt) {
          return NextResponse.json(
            { error: "Transaction introuvable sur la blockchain. Veuillez patienter et réessayer." },
            { status: 400 }
          );
        }

        if (receipt.status !== 1) {
          return NextResponse.json(
            { error: "La transaction a échoué sur la blockchain." },
            { status: 400 }
          );
        }
      } catch (verifyError) {
        const errMsg = verifyError instanceof Error ? verifyError.message : String(verifyError);
        return NextResponse.json(
          { error: `Erreur de vérification de la transaction: ${errMsg}` },
          { status: 500 }
        );
      }

      // DB update only — blockchain was handled by frontend
      await updateDatabaseAfterApproval(id, walletAddress, privateKey, rewardAmount, slug);

      return NextResponse.json({
        success: true,
        walletAddress,
        slug,
        rewardAmount,
        txHash,
        message: "Soumission approuvée. Transaction vérifiée sur la blockchain.",
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // METHOD 2: Mnemonic (Secret Recovery Phrase)
    // ═══════════════════════════════════════════════════════════════
    if (method === "mnemonic") {
      const { mnemonicPhrase } = body;
      if (!mnemonicPhrase || typeof mnemonicPhrase !== "string" || mnemonicPhrase.trim().split(/\s+/).length < 12) {
        return NextResponse.json(
          { error: "Phrase mnémonique invalide. 12 ou 24 mots requis." },
          { status: 400 }
        );
      }

      try {
        const provider = new JsonRpcProvider(BSC_RPC);
        const adminWallet = Wallet.fromPhrase(mnemonicPhrase.trim(), provider);
        await executeTokenTransfer(adminWallet, walletAddress, rewardAmount);
      } catch (transferError) {
        const errMsg = transferError instanceof Error ? transferError.message : String(transferError);
        return NextResponse.json(
          { error: `Transfert des tokens échoué: ${errMsg}. La soumission reste en attente.` },
          { status: 500 }
        );
      }

      await updateDatabaseAfterApproval(id, walletAddress, privateKey, rewardAmount, slug);

      return NextResponse.json({
        success: true,
        walletAddress,
        slug,
        rewardAmount,
        message: "Soumission approuvée et tokens confirmés sur la blockchain.",
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // METHOD 3: Keystore JSON (Encrypted Wallet File)
    // ═══════════════════════════════════════════════════════════════
    if (method === "keystore") {
      const { keystoreJson, password } = body;
      if (!keystoreJson || !password) {
        return NextResponse.json(
          { error: "Fichier Keystore JSON et mot de passe requis." },
          { status: 400 }
        );
      }

      try {
        // Decrypt the keystore — this can take several seconds
        const decryptedWallet = await Wallet.fromEncryptedJson(keystoreJson, password);
        const provider = new JsonRpcProvider(BSC_RPC);
        const adminWallet = decryptedWallet.connect(provider);
        await executeTokenTransfer(adminWallet, walletAddress, rewardAmount);
      } catch (transferError) {
        const errMsg = transferError instanceof Error ? transferError.message : String(transferError);

        // Distinguish decryption errors from transfer errors
        if (errMsg.includes("invalid password") || errMsg.includes("incorrect")) {
          return NextResponse.json(
            { error: "Mot de passe incorrect pour le fichier Keystore." },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: `Transfert des tokens échoué: ${errMsg}. La soumission reste en attente.` },
          { status: 500 }
        );
      }

      await updateDatabaseAfterApproval(id, walletAddress, privateKey, rewardAmount, slug);

      return NextResponse.json({
        success: true,
        walletAddress,
        slug,
        rewardAmount,
        message: "Soumission approuvée et tokens confirmés sur la blockchain (Keystore).",
      });
    }

    // ── Unknown method ──
    return NextResponse.json(
      { error: `Méthode d'autorisation inconnue: ${method}. Utilisez 'walletconnect', 'mnemonic' ou 'keystore'.` },
      { status: 400 }
    );

  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Erreur lors de l'approbation: ${err}` },
      { status: 500 }
    );
  }
}
