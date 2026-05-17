import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { queryOne } from '@/lib/db';

// Aggregate counts for the settings dashboard — single round-trip
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [history, watchlist, progress] = await Promise.all([
      queryOne<{ count: string }>(
        'SELECT COUNT(*) AS count FROM watch_history WHERE user_id = $1',
        [session.userId]
      ),
      queryOne<{ count: string }>(
        'SELECT COUNT(*) AS count FROM watchlist WHERE user_id = $1',
        [session.userId]
      ),
      queryOne<{ count: string }>(
        'SELECT COUNT(*) AS count FROM watch_progress WHERE user_id = $1',
        [session.userId]
      ),
    ]);

    return NextResponse.json({
      historyCount:   parseInt(history?.count  ?? '0', 10),
      watchlistCount: parseInt(watchlist?.count ?? '0', 10),
      progressCount:  parseInt(progress?.count  ?? '0', 10),
    });
  } catch (error) {
    console.error('Stats GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
