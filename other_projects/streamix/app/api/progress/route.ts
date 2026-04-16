import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ progress: null });

    const movieId = req.nextUrl.searchParams.get('movieId');
    if (!movieId) return NextResponse.json({ progress: null });

    // Retrieve saved playback position and video duration
    const row = await queryOne<{ progress: number; duration: number }>(
        'SELECT progress, duration FROM watch_progress WHERE user_id = $1 AND movie_id = $2',
        [session.userId, movieId]
    );
    return NextResponse.json({ progress: row?.progress ?? null, duration: row?.duration ?? null });
}

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ ok: false });

    const { movieId, progress, duration } = await req.json();
    if (!movieId || progress == null) return NextResponse.json({ ok: false });

    // Upsert playback progress - insert if new, update if exists
    await query(
        `INSERT INTO watch_progress (user_id, movie_id, progress, duration, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id, movie_id)
     DO UPDATE SET progress = $3, duration = $4, updated_at = NOW()`,
        [session.userId, movieId, progress, duration ?? null]
    );
    return NextResponse.json({ ok: true });
}