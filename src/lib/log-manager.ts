/**
 * Log management service: rotation, cleanup, and compression
 */

import { promises as fs } from 'fs';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';

const logsDir = path.join(process.cwd(), '.logs');

interface LogConfig {
  maxSizeMb: number;
  retentionDays: number;
  compressionAgeDays: number;
}

const defaultConfig: LogConfig = {
  maxSizeMb: parseInt(process.env.LOG_MAX_SIZE_MB || '50'),
  retentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '7'),
  compressionAgeDays: parseInt(process.env.LOG_COMPRESSION_AGE_DAYS || '3'),
};

/**
 * Ensures logs directory exists
 */
export async function ensureLogsDir() {
  try {
    await fs.mkdir(logsDir, { recursive: true });
  } catch (error) {
    console.error('Failed to create logs directory:', error);
  }
}

/**
 * Gets the current day's log file path
 */
export function getTodayLogFile() {
  const today = new Date().toISOString().split('T')[0];
  return path.join(logsDir, `${today}.log`);
}

/**
 * Gets the next rotated log file path (e.g., 2026-02-25.1.log)
 */
function getRotatedFilePath(baseFile: string, rotationNumber: number) {
  const ext = path.extname(baseFile);
  const base = baseFile.slice(0, -ext.length);
  return `${base}.${rotationNumber}${ext}`;
}

/**
 * Rotates a log file if it exceeds max size
 * Creates a new numbered file (e.g., 2026-02-25.1.log) when size limit hit
 */
export async function rotateLogIfNeeded(config: LogConfig = defaultConfig) {
  try {
    const todayFile = getTodayLogFile();
    const maxSizeBytes = config.maxSizeMb * 1024 * 1024;

    // Check if file exists and get size
    try {
      const stats = await fs.stat(todayFile);
      if (stats.size < maxSizeBytes) {
        return; // No rotation needed
      }
    } catch {
      return; // File doesn't exist yet
    }

    // Find next available rotation number
    let rotationNum = 1;
    let rotatedPath = getRotatedFilePath(todayFile, rotationNum);
    while (true) {
      try {
        await fs.access(rotatedPath);
        rotationNum++;
        rotatedPath = getRotatedFilePath(todayFile, rotationNum);
      } catch {
        break; // File doesn't exist, use this number
      }
    }

    // Rename current file to rotated name
    await fs.rename(todayFile, rotatedPath);
    console.log(`[${new Date().toISOString()}] Rotated log file to ${path.basename(rotatedPath)}`);
  } catch (error) {
    console.error('Failed to rotate log file:', error);
  }
}

/**
 * Compresses logs older than specified age to .gz format
 */
export async function compressOldLogs(config: LogConfig = defaultConfig) {
  try {
    const now = Date.now();
    const cutoffTime = now - config.compressionAgeDays * 24 * 60 * 60 * 1000;

    const files = await fs.readdir(logsDir);

    for (const file of files) {
      if (file.endsWith('.gz')) continue; // Skip already compressed
      if (!file.endsWith('.log')) continue; // Only .log files

      const filePath = path.join(logsDir, file);
      const stats = await fs.stat(filePath);

      if (stats.mtimeMs < cutoffTime) {
        try {
          const gzipPath = `${filePath}.gz`;
          await pipeline(
            createReadStream(filePath),
            createGzip(),
            createWriteStream(gzipPath)
          );
          await fs.unlink(filePath);
          console.log(
            `[${new Date().toISOString()}] Compressed ${file} → ${path.basename(gzipPath)}`
          );
        } catch (error) {
          console.error(`Failed to compress ${file}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Failed to compress old logs:', error);
  }
}

/**
 * Deletes logs older than retention period (both .log and .log.gz)
 */
export async function cleanupOldLogs(config: LogConfig = defaultConfig) {
  try {
    const now = Date.now();
    const cutoffTime = now - config.retentionDays * 24 * 60 * 60 * 1000;

    const files = await fs.readdir(logsDir);
    let deletedCount = 0;

    for (const file of files) {
      if (!file.endsWith('.log') && !file.endsWith('.log.gz')) continue;

      const filePath = path.join(logsDir, file);
      const stats = await fs.stat(filePath);

      if (stats.mtimeMs < cutoffTime) {
        try {
          await fs.unlink(filePath);
          deletedCount++;
          console.log(
            `[${new Date().toISOString()}] Deleted old log file: ${file}`
          );
        } catch (error) {
          console.error(`Failed to delete ${file}:`, error);
        }
      }
    }

    if (deletedCount > 0) {
      console.log(
        `[${new Date().toISOString()}] Cleanup complete: deleted ${deletedCount} log file(s)`
      );
    }
  } catch (error) {
    console.error('Failed to cleanup old logs:', error);
  }
}

/**
 * Runs full maintenance: compress old logs, then cleanup, then rotate
 */
export async function maintainLogs(config: LogConfig = defaultConfig) {
  await compressOldLogs(config);
  await cleanupOldLogs(config);
  await rotateLogIfNeeded(config);
}

/**
 * Determines if it's time to run 2am cleanup (within a 1-hour window)
 */
export function isCleanupTime(): boolean {
  const now = new Date();
  const hour = now.getHours();
  return hour === 2; // Will run any time during 2am hour
}

/**
 * Gets log directory info for monitoring
 */
export async function getLogStats() {
  try {
    const files = await fs.readdir(logsDir);
    let totalSize = 0;
    const fileStats: Array<{ name: string; sizeKb: number; mtime: string }> = [];

    for (const file of files) {
      const filePath = path.join(logsDir, file);
      const stats = await fs.stat(filePath);
      totalSize += stats.size;
      fileStats.push({
        name: file,
        sizeKb: Math.round(stats.size / 1024),
        mtime: new Date(stats.mtimeMs).toISOString(),
      });
    }

    return {
      totalFilesCount: files.length,
      totalSizeMb: Math.round(totalSize / (1024 * 1024)),
      files: fileStats.sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime()),
    };
  } catch (error) {
    console.error('Failed to get log stats:', error);
    return { totalFilesCount: 0, totalSizeMb: 0, files: [] };
  }
}
