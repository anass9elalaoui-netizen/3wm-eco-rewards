import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID de soumission manquant." },
        { status: 400 }
      );
    }

    const action = await prisma.ecoAction.findUnique({
      where: { id },
    });

    if (!action) {
      return NextResponse.json(
        { error: "Soumission introuvable." },
        { status: 404 }
      );
    }

    if (action.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cette soumission a déjà été traitée." },
        { status: 400 }
      );
    }

    await prisma.ecoAction.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reject error:", error);
    return NextResponse.json(
      { error: "Erreur lors du rejet." },
      { status: 500 }
    );
  }
}
