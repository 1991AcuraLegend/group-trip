const KNOWN_INSECURE = new Set([
  "your-secret-here",
  "change-me-in-production",
  "your-secret-here-change-in-production",
]);

export function validateEnvironment() {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret || KNOWN_INSECURE.has(secret) || secret.length < 16) {
    throw new Error(
      "[SECURITY] NEXTAUTH_SECRET is missing or insecure. Generate one with: openssl rand -base64 32"
    );
  }
}

export function shouldValidateEnvironment() {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.npm_lifecycle_event !== "build" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  );
}