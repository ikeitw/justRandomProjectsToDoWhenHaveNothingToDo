import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { currentPassword, newPassword } = await request.json() as {
      currentPassword: string;
      newPassword: string;
    };

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both passwords required' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }

    const row = await queryOne<{ password: string }>(
      'SELECT password FROM users WHERE id = $1',
      [session.userId]
    );
    if (!row) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, row.password);
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password = $1 WHERE id = $2', [hashed, session.userId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
