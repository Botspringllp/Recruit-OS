import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth/session';

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Logout failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  await clearSession();
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
}
