/**
 * Logging utility that creates structured logs for debugging.
 * Each log entry includes timestamp, level, and context.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Client-side logger - writes to console and sends to server
 */
export const logger = {
  async log(
    level: LogLevel,
    source: string,
    message: string,
    data?: Record<string, unknown>
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      data,
    };

    // Log to console
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[consoleMethod as 'log' | 'warn' | 'error'](
      `[${entry.timestamp}] [${level.toUpperCase()}] ${source}: ${message}`,
      data || ''
    );

    // Send to server for persistent logging
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }).catch(() => {
        // Silently fail if logging endpoint is unavailable
      });
    } catch {
      // Silently fail
    }
  },

  debug(source: string, message: string, data?: Record<string, unknown>) {
    return this.log('debug', source, message, data);
  },

  info(source: string, message: string, data?: Record<string, unknown>) {
    return this.log('info', source, message, data);
  },

  warn(source: string, message: string, data?: Record<string, unknown>) {
    return this.log('warn', source, message, data);
  },

  error(source: string, message: string, data?: Record<string, unknown>) {
    return this.log('error', source, message, data);
  },
};
