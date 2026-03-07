# Security Hardening Checklist

This checklist replaces the earlier narrative plan. Every repository-side item below has now been implemented. One external operator action remains at the end.

## Secrets And Environment

- [x] Ignore `.env`, `.env.docker`, and `.env.docker.localhost` in git.
- [x] Untrack `.env` and `.env.docker` from the repository index.
- [x] Remove embedded Cloudflare tunnel token usage from local scripts.
- [x] Blank `NEXTAUTH_SECRET` in [/.env.example](/Users/corey/Projects/TravelPlanner/.env.example) and add generation guidance.
- [x] Add `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to example env files.
- [x] Add runtime validation for insecure `NEXTAUTH_SECRET` values.
- [x] Require production secrets in [/docker-compose.yml](/Users/corey/Projects/TravelPlanner/docker-compose.yml) and [/docker-compose.deploy.yml](/Users/corey/Projects/TravelPlanner/docker-compose.deploy.yml).

## HTTP And Auth Hardening

- [x] Add `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Strict-Transport-Security` headers in [/next.config.js](/Users/corey/Projects/TravelPlanner/next.config.js).
- [x] Add shared rate limiting in [/src/lib/rate-limit.ts](/Users/corey/Projects/TravelPlanner/src/lib/rate-limit.ts).
- [x] Apply rate limiting to login, registration, forgot-password, reset-password, and upload endpoints.
- [x] Shorten JWT session lifetime to 7 days in [/src/lib/auth.ts](/Users/corey/Projects/TravelPlanner/src/lib/auth.ts).
- [x] Harden redirect handling with same-origin validation.

## Password Reset

- [x] Add `PasswordResetToken` to [/prisma/schema.prisma](/Users/corey/Projects/TravelPlanner/prisma/schema.prisma).
- [x] Add a Prisma migration for password reset tokens.
- [x] Add Resend-backed reset email sending with a development fallback.
- [x] Replace the forgot-password stub with a real token flow.
- [x] Add `/api/auth/reset-password`.
- [x] Add `/reset-password` page and form UI.

## Password Policy

- [x] Introduce a shared password schema with minimum length, lowercase, uppercase, and numeric requirements.
- [x] Apply the shared password schema to registration, reset-password, and change-password validation.

## Upload Hardening

- [x] Derive saved file extensions from MIME type instead of user-provided filenames.
- [x] Validate magic bytes for JPEG, PNG, and WebP uploads.

## Registration And Error Handling

- [x] Replace the registration conflict message with a generic non-enumerating response.
- [x] Stop returning internal error details from the registration API.

## Container Hardening

- [x] Add a non-root runtime user to [/Dockerfile](/Users/corey/Projects/TravelPlanner/Dockerfile).
- [x] Ensure copied runtime artifacts are owned by the non-root user.

## Verification

- [x] Prisma client regenerated after schema changes.
- [x] Validator coverage updated for new password rules and reset-password validation.
- [x] Environment validation coverage added.

## External Operator Follow-Up

- [ ] Revoke the previously leaked Cloudflare token in the Cloudflare dashboard and replace any still-active remote secret values. This cannot be completed from the repository alone.

## Additional Suggestions

- Add a nonce-based CSP later if the inline theme bootstrap script is moved to a nonce-friendly model.
- Add audit logging for password reset requests, password changes, and role changes.
- Consider isolating uploads behind object storage or a separate host if public file volume grows.
- Revisit the remaining `npm audit` findings during the next major Next.js upgrade.