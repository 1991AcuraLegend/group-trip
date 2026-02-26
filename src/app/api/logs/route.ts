import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { LogEntry } from '@/lib/logger';
import { ensureLogsDir, rotateLogIfNeeded, maintainLogs, isCleanupTime } from '@/lib/log-manager';

// Ensure logs directory exists on module load
ensureLogsDir().catch((e) => console.error('Failed to initialize logs dir:', e));

// Logs directory
const logsDir = path.join(process.cwd(), '.logs');

export async function POST(request: NextRequest) {
  try {
    const entry: LogEntry = await request.json();

    // Ensure logs directory exists
    await ensureLogsDir();

    // Append to log file (one file per day)
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(logsDir, `${today}.log`);

    const logLine = JSON.stringify(entry) + '\n';
    await fs.appendFile(logFile, logLine);

    // Check if rotation is needed (non-blocking)
    rotateLogIfNeeded().catch((e) => console.error('Log rotation error:', e));

    // Run maintenance at 2am (non-blocking)
    if (isCleanupTime()) {
      maintainLogs().catch((e) => console.error('Log maintenance error:', e));
    }

    // Also log to console for real-time visibility
    const level = entry.level.toUpperCase();
    const timestamp = entry.timestamp;
    const message = `[${timestamp}] [${level}] ${entry.source}: ${entry.message}`;
    
    if (entry.level === 'error') {
      console.error(message, entry.data || '');
    } else if (entry.level === 'warn') {
      console.warn(message, entry.data || '');
    } else {
      console.log(message, entry.data || '');
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to write log:', error);
    return NextResponse.json(
      { error: 'Failed to write log' },
      { status: 500 }
    );
  }
}
