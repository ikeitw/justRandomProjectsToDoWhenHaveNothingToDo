import { NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';

// Get current logged-in user profile from session
export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) return NextResponse.json({ user: null }, { status: 401 });
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
