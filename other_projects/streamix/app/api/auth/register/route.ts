import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password)
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });

    // Validate password strength
    if (password.length < 6)
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });

    // Check for duplicate email
    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing)
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });

    // Hash password with bcrypt (12 salt rounds for security)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user account with default 'free' plan
    const users = await query<{ id: number; name: string; email: string; plan: string }>(
      'INSERT INTO users (name, email, password, plan) VALUES ($1, $2, $3, $4) RETURNING id, name, email, plan',
      [name.trim(), email.toLowerCase(), hashedPassword, 'free']
    );
    const user = users[0];

    // Generate auth token
    const token = await signToken({ userId: user.id, email: user.email, name: user.name });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
    });

    // Set secure httpOnly cookie
    response.cookies.set('streamix-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'An error occurred. Please try again.' }, { status: 500 });
  }
}
