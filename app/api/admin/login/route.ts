import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: 'Mot de passe requis' }, { status: 400 });
    }

    const adminPassword = process.env.ADMIN_SECRET_PASSWORD;

    if (!adminPassword) {
      console.error('CRITICAL: ADMIN_SECRET_PASSWORD is not set in environment variables');
      return NextResponse.json({ error: 'Configuration serveur invalide' }, { status: 500 });
    }

    if (password === adminPassword) {
      // Setup the secure cookie
      const cookieStore = await cookies();
      cookieStore.set('3wm_admin_session', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
