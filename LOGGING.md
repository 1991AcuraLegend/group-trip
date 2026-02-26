# Logging Setup

Added comprehensive logging throughout the application to help with debugging. Logs are written to files in `.logs/` directory (gitignored) and also output to the server console.

## Log Output

Logs are captured in two places:

### 1. **Server-Side File Logs** (`.logs/YYYY-MM-DD.log`)
   - All logs from the app are persisted to daily log files
   - JSON format for easy parsing
   - Accessible via API endpoints

### 2. **Console Output**
   - All logs appear in the terminal running the development server
   - Both structured (JSON) and console-friendly formats

## Accessing Logs

### Programmatically (for debugging):
```bash
# Get last 50 logs from today
curl 'http://localhost:3000/api/logs/view?lines=50'

# Get last 100 logs from a specific date
curl 'http://localhost:3000/api/logs/view?lines=100&date=2026-02-25'
```

### Via Terminal:
```bash
# View today's logs
tail .logs/2026-02-25.log

# Follow real-time logs
tail -f .logs/2026-02-25.log

# Search for errors
grep ERROR .logs/2026-02-25.log

# View all compressed logs from 3 days ago
zcat .logs/2026-02-22.log.gz | grep ERROR
```

### Log Statistics:
```bash
# Get current log directory stats
curl 'http://localhost:3000/api/logs/maintain'
```

Returns:
```json
{
  "totalFilesCount": 7,
  "totalSizeMb": 24,
  "files": [
    { "name": "2026-02-25.log", "sizeKb": 256, "mtime": "2026-02-25T14:30:00.000Z" },
    { "name": "2026-02-24.log.gz", "sizeKb": 18, "mtime": "2026-02-24T02:30:00.000Z" }
  ],
  "timestamp": "2026-02-25T14:35:00.000Z"
}
```

## Log Maintenance Strategy

### Automatic Management (Runs Daily at 2am)

1. **Compression**: Logs older than 3 days are compressed to `.gz` format
   - Reduces disk usage by ~90%
   - Compressed logs can still be read: `zcat .logs/2026-02-22.log.gz | grep ERROR`

2. **Cleanup**: Logs older than 7 days are deleted
   - Prevents unbounded disk growth
   - Keeps last week of logs for debugging

3. **Rotation**: If a daily log exceeds 50MB, it rotates
   - Original file renamed to `YYYY-MM-DD.1.log`
   - New `YYYY-MM-DD.log` continues receiving logs
   - Can have multiple rotations: `.1.log`, `.2.log`, etc.

### Manual Maintenance

Trigger cleanup/compression immediately:
```bash
# Manual maintenance
curl -X POST 'http://localhost:3000/api/logs/maintain'
```

Delete specific date's logs:
```bash
curl -X DELETE 'http://localhost:3000/api/logs/view?date=2026-02-20'
```

### Configuration

See [.env.example](.env.example) for available environment variables:
- `LOG_MAX_SIZE_MB` - Max file size before rotation (default: 50)
- `LOG_RETENTION_DAYS` - Days to keep logs (default: 7)
- `LOG_COMPRESSION_AGE_DAYS` - Days before compression (default: 3)
- `LOG_MAINTENANCE_SECRET` - Optional secret for maintenance API

## What's Being Logged

### Form Submissions (ActivityForm, LodgingForm, RestaurantForm, CarRentalForm):
- Form submission started (with action type: create/edit)
- Payload being sent
- Success/failure of entry creation/update
- Promotion of ideas to plans

### API Network Layer (useCreateEntry, useUpdateEntry, usePromoteToPlan):
- Request initiated
- Response status
- Errors from server
- Cache invalidation

### API Routes (/api/trips/[tripId]/entries):
- Entry creation requests
- Validation success/failure
- Entry IDs of newly created entries
- User IDs making requests

## Log Levels

- **debug**: Low-level details for tracing execution flow
- **info**: Important business events (entity created, updated, promoted)
- **warn**: Potentially problematic situations
- **error**: Errors that prevented an operation

## Example Usage for Debugging

When a button does nothing (like before), you can now:

1. Click the button
2. Check logs: `curl 'http://localhost:3000/api/logs/view'`
3. Look for error messages or missing log entries
4. Identify where the flow broke (form validation? network request? API error?)

## Performance

- Log writes are **non-blocking** - rotation and maintenance run in background
- Maintenance checks happen at 2am each day
- Logs use **streaming writes** to minimize memory impact
- Compressed logs reduce disk usage from ~350MB/week to ~35MB/week

## Future Enhancements

Consider adding logging to:
- Authentication flows
- Share code generation/validation
- Geocoding requests
- Timeline calculations
- Entry deletion
- Trip creation/modification
