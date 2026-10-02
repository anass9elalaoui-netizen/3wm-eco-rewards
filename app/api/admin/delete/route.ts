import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID manquant." },
        { status: 400 }
      );
    }

    await prisma.ecoAction.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Enregistrement supprimé.",
    });
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error("[DELETE ERROR]", err);
    return NextResponse.json(
      { error: `Erreur lors de la suppression: ${err}` },
      { status: 500 }
    );
  }
}
