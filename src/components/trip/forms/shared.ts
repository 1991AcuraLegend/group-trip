// Shared helpers for entry forms

// Format a Date/string to datetime-local input value: "YYYY-MM-DDTHH:MM"
export function toDatetimeLocal(date: Date | string | undefined | null): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Format a Date/string to date input value: "YYYY-MM-DD"
// Uses UTC methods because dates are stored as UTC midnight in the DB.
export function toDateInput(date: Date | string | undefined | null): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

// Convert datetime-local or date string to ISO string
export function toISO(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}
