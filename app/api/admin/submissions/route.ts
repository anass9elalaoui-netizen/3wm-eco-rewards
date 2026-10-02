import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ALL";

    const where =
      status !== "ALL" ? { status } : undefined;

    const actions = await prisma.ecoAction.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ actions });
  } catch (error) {
    console.error("Admin submissions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions." },
      { status: 500 }
    );
  }
}
