import { NextRequest, NextResponse } from 'next/server';
import { maintainLogs, getLogStats } from '@/lib/log-manager';

/**
 * POST /api/logs/maintain - Manually trigger log maintenance (rotation, compression, cleanup)
 * This is called at 2am by a scheduled task
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: basic auth check if running in production (via header)
    const secret = request.headers.get('x-log-maintenance-secret');
    if (process.env.LOG_MAINTENANCE_SECRET && secret !== process.env.LOG_MAINTENANCE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[${new Date().toISOString()}] [INFO] Log maintenance started (via API)`);
    await maintainLogs();
    const stats = await getLogStats();

    console.log(`[${new Date().toISOString()}] [INFO] Log maintenance completed`);
    return NextResponse.json({
      ok: true,
      message: 'Log maintenance completed',
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to run log maintenance:', error);
    return NextResponse.json(
      { error: 'Failed to run log maintenance', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/logs/maintain - Get current log statistics
 */
export async function GET() {
  try {
    const stats = await getLogStats();
    return NextResponse.json({
      ...stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get log stats:', error);
    return NextResponse.json(
      { error: 'Failed to get log stats' },
      { status: 500 }
    );
  }
}
