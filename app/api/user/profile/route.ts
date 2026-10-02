import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { privy } from "@/lib/privy";

/**
 * GET /api/user/profile
 *
 * Secured endpoint — requires a valid Privy access token (Bearer).
 * Verifies the token, resolves the user's phone/wallet from Privy,
 * then returns profile & wallet data from our local database.
 */
export async function GET(request: NextRequest) {
  try {
    // ── 1. Extract the Bearer token ──
    const authToken = request.headers
      .get("authorization")
      ?.replace("Bearer ", "");

    if (!authToken) {
      return NextResponse.json(
        { error: "Token d'authentification manquant." },
        { status: 401 }
      );
    }

    // ── 2. Verify with Privy ──
    let verifiedClaims;
    try {
      verifiedClaims = await privy.utils().auth().verifyAuthToken(authToken);
    } catch {
      return NextResponse.json(
        { error: "Token invalide ou expiré. Veuillez vous reconnecter." },
        { status: 401 }
      );
    }

    const privyUserId = verifiedClaims.user_id;

    // ── 3. Look up the user's linked accounts in Privy ──
    const privyUser = await privy.users()._get(privyUserId);

    // Extract phone number and wallet address from linked accounts
    const phoneAccount = privyUser.linked_accounts?.find(
      (a) => a.type === "phone"
    );
    const walletAccount = privyUser.linked_accounts?.find(
      (a) => a.type === "wallet" && "chain_type" in a && a.chain_type === "ethereum"
    );

    const phone = phoneAccount && "phoneNumber" in phoneAccount
      ? phoneAccount.phoneNumber
      : undefined;
    const linkedWallet = walletAccount && "address" in walletAccount
      ? walletAccount.address
      : undefined;

    if (!phone && !linkedWallet) {
      return NextResponse.json(
        {
          error:
            "Aucun numéro de téléphone ni portefeuille lié à votre compte Privy.",
        },
        { status: 404 }
      );
    }

    // ── 4. Find the EcoAction record in our database ──
    let action = null;

    if (phone) {
      action = await prisma.ecoAction.findUnique({
        where: { phoneNumber: phone },
      });
    }

    // Fallback: try to match by wallet address if phone didn't match
    if (!action && linkedWallet) {
      action = await prisma.ecoAction.findFirst({
        where: { walletAddress: linkedWallet },
      });
    }

    if (!action) {
      return NextResponse.json(
        {
          error:
            "Aucune action écologique trouvée pour votre compte. Avez-vous déjà participé ?",
        },
        { status: 404 }
      );
    }

    // ── 5. Return profile data (NEVER expose encryptedPrivKey here) ──
    return NextResponse.json({
      success: true,
      privyUserId,
      fullName: action.fullName,
      age: action.age,
      photoUrl: action.photoUrl,
      status: action.status,
      walletAddress: action.walletAddress,
      rewardAmount: action.rewardAmount,
      slug: action.slug,
    });
  } catch (error) {
    console.error(
      "[USER/PROFILE ERROR]",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      { error: "Erreur serveur interne." },
      { status: 500 }
    );
  }
}
