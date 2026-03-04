export function getBaseUrl(): string {
  const url = process.env.NEXTAUTH_URL;
  if (!url) throw new Error('NEXTAUTH_URL is not set');
  return url.replace(/\/$/, '');
}
