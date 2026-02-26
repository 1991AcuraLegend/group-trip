import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getLogStats, maintainLogs } from '@/lib/log-manager';

const logsDir = path.join(process.cwd(), '.logs');

export async function GET(request: NextRequest) {
  try {
    // Get query params for filtering
    const searchParams = request.nextUrl.searchParams;
    const lines = searchParams.get('lines') ? parseInt(searchParams.get('lines')!) : 100;
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const logFile = path.join(logsDir, `${date}.log`);

    // Check if file exists
    try {
      await fs.access(logFile);
    } catch {
      return NextResponse.json(
        { error: `No logs found for date ${date}`, logs: [] },
        { status: 404 }
      );
    }

    // Read file
    const content = await fs.readFile(logFile, 'utf-8');
    const logLines = content.trim().split('\n').filter(Boolean);

    // Get last N lines
    const recent = logLines.slice(-lines).map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { raw: line };
      }
    });

    return NextResponse.json({
      date,
      totalLines: logLines.length,
      recentLines: recent.length,
      logs: recent,
    });
  } catch (error) {
    console.error('Failed to read logs:', error);
    return NextResponse.json(
      { error: 'Failed to read logs' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const logFile = path.join(logsDir, `${date}.log`);
    await fs.unlink(logFile);

    return NextResponse.json({ ok: true, message: `Deleted logs for ${date}` });
  } catch (error) {
    console.error('Failed to delete logs:', error);
    return NextResponse.json(
      { error: 'Failed to delete logs' },
      { status: 500 }
    );
  }
}
