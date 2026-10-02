export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const ambassadors = await prisma.ambassador.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ ambassadors });
  } catch (error) {
    console.error('Fetch ambassadors error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
