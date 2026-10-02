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
        { error: "Aucune action trouvée." },
        { status: 404 }
      );
    }

    if (!action.encryptedPrivKey) {
      return NextResponse.json(
        { error: "Ce portefeuille est géré par l'utilisateur (BYOW). Aucune clé stockée." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      encryptedPrivKey: action.encryptedPrivKey,
    });
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error("[REVEAL ERROR]", err);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
