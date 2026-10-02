import { NextRequest, NextResponse } from "next/server";
import { JsonRpcProvider, Wallet, Contract, formatUnits, isAddress } from "ethers";
import {
  BSC_RPC,
  TOKEN_CONTRACT_ADDRESS,
  TOKEN_DECIMALS,
  ERC20_ABI,
} from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminPrivateKey, walletAddress } = body;

    // Determine the address to query — either from a private key or a plain address
    let targetAddress: string;

    if (walletAddress && isAddress(walletAddress)) {
      // WalletConnect mode: address provided directly (no key needed)
      targetAddress = walletAddress;
    } else if (adminPrivateKey) {
      // Legacy/Mnemonic/Keystore mode: derive address from private key
      const provider = new JsonRpcProvider(BSC_RPC);
      const adminWallet = new Wallet(adminPrivateKey, provider);
      targetAddress = adminWallet.address;
    } else {
      return NextResponse.json(
        { error: "Adresse wallet ou clé privée requise." },
        { status: 400 }
      );
    }

    // Query BSC on the server side (no CORS issues)
    const provider = new JsonRpcProvider(BSC_RPC);
    const contract = new Contract(
      TOKEN_CONTRACT_ADDRESS,
      ERC20_ABI,
      provider
    );

    const rawBalance = await contract.balanceOf(targetAddress);
    const balance = formatUnits(rawBalance, TOKEN_DECIMALS);

    const bnbBalance = await provider.getBalance(targetAddress);
    const bnbFormatted = formatUnits(bnbBalance, 18);

    return NextResponse.json({
      success: true,
      walletAddress: targetAddress,
      tokenBalance: balance,
      bnbBalance: bnbFormatted,
    });
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Erreur: ${err}` },
      { status: 500 }
    );
  }
}
