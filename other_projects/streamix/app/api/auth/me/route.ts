import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession, getSession } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { cookies } from 'next/headers';

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

// Update display name and/or plan
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, plan } = body as { name?: string; plan?: string };

    const VALID_PLANS = ['reader', 'cinema', 'premiere'];
    if (plan && !VALID_PLANS.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    if (name !== undefined && (name.trim().length < 1 || name.trim().length > 100)) {
      return NextResponse.json({ error: 'Name must be 1–100 characters' }, { status: 400 });
    }

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (name !== undefined) { setClauses.push(`name = $${idx++}`); values.push(name.trim()); }
    if (plan !== undefined) { setClauses.push(`plan = $${idx++}`); values.push(plan); }

    if (!setClauses.length) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    values.push(session.userId);
    const user = await queryOne(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING id, name, email, avatar, plan, created_at`,
      values
    );

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

// Permanently delete the authenticated user's account
export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await query('DELETE FROM users WHERE id = $1', [session.userId]);

    const cookieStore = cookies();
    cookieStore.delete('streamix-token');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
