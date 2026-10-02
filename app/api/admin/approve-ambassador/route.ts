export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Ambassador ID is required' }, { status: 400 });
    }

    const updatedAmbassador = await prisma.ambassador.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    return NextResponse.json(updatedAmbassador);
  } catch (error) {
    console.error('Approve ambassador error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
