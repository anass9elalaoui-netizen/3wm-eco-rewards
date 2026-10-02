import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber || typeof phoneNumber !== "string") {
      return NextResponse.json(
        { error: "Numéro de téléphone requis." },
        { status: 400 }
      );
    }

    const action = await prisma.ecoAction.findUnique({
      where: { phoneNumber: phoneNumber.trim() },
    });

    if (!action) {
      return NextResponse.json(
        { error: "Aucune action trouvée pour ce numéro." },
        { status: 404 }
      );
    }

    // CRITICAL: Never return encryptedPrivKey to the frontend via status
    return NextResponse.json({
      success: true,
      fullName: action.fullName,
      age: action.age,
      photoUrl: action.photoUrl,
      status: action.status,
      walletAddress: action.walletAddress,
      rewardAmount: action.rewardAmount,
      slug: action.slug,
    });
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
