/**
 * Server-side initialization component
 * Initializes background tasks and services
 */

import { initializeLogMaintenance } from '@/lib/scheduled-tasks';

// Initialize on server startup
initializeLogMaintenance();

export function ServerInit() {
  return null;
}
