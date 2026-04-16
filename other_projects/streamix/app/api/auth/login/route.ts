import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryOne } from '@/lib/db';
import { signToken } from '@/lib/auth';

interface DBUser {
  id: number;
  name: string;
  email: string;
  password: string;
  avatar: string | null;
  plan: string;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password)
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });

    // Query user with email - case insensitive
    const user = await queryOne<DBUser>(
      'SELECT id, name, email, password, avatar, plan FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!user)
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    // Verify password hash
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    // Create JWT token valid for 7 days
    const token = await signToken({ userId: user.id, email: user.email, name: user.name });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, plan: user.plan },
    });

    // Set httpOnly cookie to prevent XSS attacks
    response.cookies.set('streamix-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An error occurred. Please try again.' }, { status: 500 });
  }
}
