/**
 * Scheduled maintenance tasks for the application
 * Initializes background jobs that run periodically
 */

import { maintainLogs } from '@/lib/log-manager';

let maintenanceScheduleInitialized = false;

/**
 * Initializes the 2am log maintenance schedule
 * Runs once per hour and checks if it's 2am
 */
export function initializeLogMaintenance() {
  if (maintenanceScheduleInitialized) {
    return;
  }

  maintenanceScheduleInitialized = true;

  // Check every hour if it's 2am
  const checkInterval = 60 * 60 * 1000; // 1 hour
  
  // Run check immediately on startup
  checkAtScheduledTime();

  // Then run check every hour
  const intervalId = setInterval(() => {
    checkAtScheduledTime();
  }, checkInterval);

  // Ensure interval clears on process exit
  process.on('exit', () => clearInterval(intervalId));

  console.log(
    `[${new Date().toISOString()}] [INFO] Log maintenance schedule initialized (runs daily at 2am)`
  );
}

/**
 * Checks if current time is 2am and runs maintenance if so
 */
async function checkAtScheduledTime() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  // Run during 2am hour (2:00 - 2:59)
  if (hour === 2 && minute < 5) {
    try {
      console.log(`[${now.toISOString()}] [INFO] Running scheduled log maintenance at 2am`);
      await maintainLogs();
      console.log(`[${now.toISOString()}] [INFO] Scheduled log maintenance completed`);
    } catch (error) {
      console.error(
        `[${now.toISOString()}] [ERROR] Scheduled log maintenance failed:`,
        error
      );
    }
  }
}

/**
 * Trigger maintenance immediately (for testing or manual runs)
 */
export async function triggerMaintenance() {
  try {
    console.log(
      `[${new Date().toISOString()}] [INFO] Manual log maintenance triggered`
    );
    await maintainLogs();
    console.log(
      `[${new Date().toISOString()}] [INFO] Manual log maintenance completed`
    );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] [ERROR] Manual log maintenance failed:`,
      error
    );
    throw error;
  }
}
