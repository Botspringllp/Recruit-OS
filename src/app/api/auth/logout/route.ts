import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();

    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Logout failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const supabase = createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
}
