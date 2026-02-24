# Security Hardening Plan: Authentication & Sensitive Data

## Context

A security audit of the authentication flow and data handling revealed several issues ranging from critical (secrets committed to git, placeholder `NEXTAUTH_SECRET`) to medium (incomplete password reset, no rate limiting, missing security headers). The core auth architecture is sound — bcrypt with 12 salt rounds, proper RBAC with weight-based role hierarchy, Zod validation on all inputs, Prisma ORM preventing SQL injection — but production-readiness gaps need to be closed before this app can be considered secure.

---

## 1. CRITICAL: Remove Secrets from Git & Fix NEXTAUTH_SECRET

### Problem

`.env` is tracked by git (confirmed via `git ls-files`). It has been in the repo since the initial commit and contains:
- `NEXTAUTH_SECRET="your-secret-here"` — a publicly known placeholder string being used to sign all JWT tokens
- `CLOUDFLARE_TOKEN="eyJhIjoiNzg2Nz..."` — a real Cloudflare API token
- `DATABASE_URL` with database credentials

The `.gitignore` (line 27) only ignores `.env*.local`, not `.env` itself. This means every clone of the repo gets these secrets.

The `NEXTAUTH_SECRET` placeholder is especially dangerous: anyone who knows the secret can forge valid JWT session tokens for any user.

### Implementation

#### 1a. Manual: Revoke the Cloudflare token

Go to the Cloudflare dashboard, revoke the token `eyJhIjoiNzg2Nz...`, and generate a new one. No code change can fix this — the old token is in the git history permanently. Place the new value only in your local `.env` file (which will be untracked after step 1b).

#### 1b. Fix `.gitignore` and untrack `.env`

**File:** `.gitignore`

Current state (line 27):
```gitignore
.env*.local
```

Change to:
```gitignore
.env
.env*.local
.env.docker
```

Then run:
```bash
git rm --cached .env .env.docker
```

This untrack both files. The `.env.example` and `.env.docker.example` files remain tracked — they contain only placeholder values.

#### 1c. Update `.env.example`

**File:** `.env.example`

Replace contents with:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/travelplanner"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""
# ^^^ REQUIRED. Generate with: openssl rand -base64 32

RESEND_API_KEY=""
# ^^^ Required for password reset emails. Get one at https://resend.com
```

Remove the Cloudflare token entirely. Production-only secrets should not appear in example files.

#### 1d. Fail-fast on insecure NEXTAUTH_SECRET

**New file:** `src/lib/env-check.ts`

```typescript
const KNOWN_INSECURE = [
  "your-secret-here",
  "change-me-in-production",
  "your-secret-here-change-in-production",
];

export function validateEnvironment() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (
    !secret ||
    KNOWN_INSECURE.includes(secret) ||
    secret.length < 16
  ) {
    throw new Error(
      "[SECURITY] NEXTAUTH_SECRET is missing or insecure. " +
        "Generate a proper secret with: openssl rand -base64 32"
    );
  }
}
```

**File to modify:** `src/lib/auth.ts`

Add at the top, before the `authOptions` export:
```typescript
import { validateEnvironment } from "./env-check";

if (process.env.NODE_ENV === "production") {
  validateEnvironment();
}
```

The production guard prevents this from breaking local dev if someone hasn't set it, while ensuring production never starts with a bad secret.

#### 1e. Fix docker-compose.yml to require secrets and stop exposing DB port

**File:** `docker-compose.yml`

Change line 8 (DB password):
```yaml
# Before:
POSTGRES_PASSWORD: ${DB_PASSWORD:-password}
# After:
POSTGRES_PASSWORD: ${DB_PASSWORD:?DB_PASSWORD is required}
```

Change line 29 (DATABASE_URL):
```yaml
# Before:
DATABASE_URL: postgresql://${DB_USER:-traveler}:${DB_PASSWORD:-password}@db:5432/${DB_NAME:-travelplanner}
# After:
DATABASE_URL: postgresql://${DB_USER:-traveler}:${DB_PASSWORD:?DB_PASSWORD is required}@db:5432/${DB_NAME:-travelplanner}
```

Change line 31 (NEXTAUTH_SECRET):
```yaml
# Before:
NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:-change-me-in-production}
# After:
NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:?NEXTAUTH_SECRET is required. Generate with: openssl rand -base64 32}
```

Remove the database port mapping (lines 10-11). The DB only needs to be reachable from the `app` container via the Docker network, not from the host:
```yaml
# Remove these lines:
    ports:
      - "${DB_PORT:-5432}:5432"
```

Developers who need direct DB access can use `docker exec -it travelplanner-db psql -U traveler -d travelplanner`.

#### 1f. Update `.env.docker.example`

**File:** `.env.docker.example`

```env
# Docker Compose Environment Configuration
# Copy this to .env.docker and set ALL required values before running

# PostgreSQL Configuration
DB_USER=traveler
DB_PASSWORD=             # REQUIRED - set a strong database password
DB_NAME=travelplanner

# Next.js Configuration
APP_PORT=3000
NODE_ENV=production

# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=         # REQUIRED - generate with: openssl rand -base64 32

# Email (Resend)
RESEND_API_KEY=          # REQUIRED for password reset emails
```

---

## 2. HIGH: Add Security Headers

### Problem

`next.config.js` only configures `images.remotePatterns: []`. There are no security headers configured anywhere — not in `next.config.js`, not in `middleware.ts`. The app is vulnerable to:
- **Clickjacking** — no `X-Frame-Options` means the app can be embedded in an iframe on a malicious site
- **MIME sniffing** — browsers could interpret uploaded images as HTML
- **Referrer leakage** — share codes in URLs could leak to third-party sites via the Referer header
- **Missing HSTS** — no enforcement of HTTPS connections

### Implementation

**File:** `next.config.js`

Replace entire file:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking — deny all iframe embedding
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent MIME-type sniffing (important for uploaded images)
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Control referer leakage (protects share codes in URLs)
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable unused browser APIs
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Force HTTPS (2-year max-age)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### Why no CSP

The app uses an inline `<script>` for theme initialization (`src/app/layout.tsx` lines 27-43, via `dangerouslySetInnerHTML`). Adding a Content-Security-Policy would require either `unsafe-inline` (which defeats the XSS protection CSP provides) or a per-request nonce (which adds complexity for statically generated pages). Since the audit confirmed no XSS vectors exist (all user input is rendered as JSX text nodes, file uploads are restricted to images, no `innerHTML` usage), CSP is deferred. The five headers above address clickjacking, MIME sniffing, referrer leakage, and transport security — all meaningful real-world protections.

---

## 3. HIGH: Add Rate Limiting

### Problem

There is no rate limiting on any endpoint. An attacker can:
- Brute-force login credentials indefinitely
- Spam the registration endpoint
- Flood the forgot-password endpoint to enumerate emails by timing
- Exhaust disk space via unlimited file uploads
- Enumerate share codes

### Implementation

#### 3a. Install dependency

```bash
npm install rate-limiter-flexible
```

This package has ~1.5M weekly downloads, zero dependencies, and supports in-memory storage (appropriate for a single-instance deployment). If you scale to multiple instances later, you can swap to Redis-backed storage without changing the API.

#### 3b. Create rate limiting utility

**New file:** `src/lib/rate-limit.ts`

```typescript
import { RateLimiterMemory } from "rate-limiter-flexible";
import { NextResponse } from "next/server";

// Auth endpoints: 5 attempts per 60 seconds, then blocked for 60 seconds
const authLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60,
  blockDuration: 60,
});

// File uploads: 10 per 60 seconds
const uploadLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
});

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

type LimiterType = "auth" | "upload";

const limiters: Record<LimiterType, RateLimiterMemory> = {
  auth: authLimiter,
  upload: uploadLimiter,
};

/**
 * Check rate limit. Returns null if allowed, or a 429 NextResponse if blocked.
 *
 * Usage:
 *   const blocked = await rateLimit(request, "auth");
 *   if (blocked) return blocked;
 */
export async function rateLimit(
  request: Request,
  type: LimiterType
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  try {
    await limiters[type].consume(ip);
    return null;
  } catch {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }
}
```

#### 3c. Apply to auth endpoints

**File:** `src/app/api/auth/register/route.ts`

Add at the very start of the POST handler, before any other logic:
```typescript
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const blocked = await rateLimit(request, "auth");
  if (blocked) return blocked;

  // ... rest of existing handler unchanged
}
```

**File:** `src/app/api/auth/forgot-password/route.ts` — same pattern.

**File:** `src/app/api/upload/route.ts` — same pattern but with `"upload"` type.

#### 3d. Rate limit the NextAuth login endpoint

**File:** `src/app/api/auth/[...nextauth]/route.ts`

This file currently just re-exports the NextAuth handler. We need to wrap the POST method (which handles credential submission) while leaving GET unrestricted:

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

export { handler as GET };

export async function POST(request: NextRequest, context: any) {
  const blocked = await rateLimit(request, "auth");
  if (blocked) return blocked;
  return handler(request, context);
}
```

Read the current file first to confirm its structure, but based on the audit it should be a simple re-export of the NextAuth handler.

---

## 4. MEDIUM: Complete Password Reset with Resend

### Problem

The current forgot-password endpoint (`src/app/api/auth/forgot-password/route.ts`) is a stub:
```typescript
console.log(`Password reset link for ${email}: ${baseUrl}/reset?token=mock-token-${user.id}`);
```

Issues:
- Token is `mock-token-${user.id}` — entirely predictable, leaks user ID
- No token storage in the database — no validation possible
- No expiration — tokens would be valid forever
- No `/reset` page exists — even the mock link goes nowhere
- The console.log leaks user emails and token info to server logs

### Implementation

#### 4a. Add PasswordResetToken model

**File:** `prisma/schema.prisma`

Add after the User model:
```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Add reverse relation to the User model:
```prisma
model User {
  // ... existing fields ...
  passwordResetTokens PasswordResetToken[]
}
```

Then run:
```bash
npx prisma migrate dev --name add-password-reset-tokens
```

**Design notes:**
- `usedAt` tracks when a token was consumed (nullable = unused). This provides an audit trail and prevents replay attacks.
- `expiresAt` enables time-limited tokens (we use 1 hour).
- `onDelete: Cascade` on User means deleting a user automatically cleans up their reset tokens.
- The `@unique` on `token` ensures fast lookups and prevents duplicate tokens.

#### 4b. Add validators

**File:** `src/validators/auth.ts`

Add these schemas after the existing ones:
```typescript
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const resetPasswordApiSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
```

Note: When step 5 (password complexity) is implemented, the `password` field in these schemas will be updated to use the shared `passwordSchema`.

#### 4c. Create Resend email utility

**New dependency:**
```bash
npm install resend
```

**New file:** `src/lib/email.ts`

```typescript
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<void> {
  if (!resend) {
    // Development fallback — no API key configured
    console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`);
    return;
  }

  await resend.emails.send({
    from: "Group Trip <noreply@grouptravel.cbesmer.com>",
    to: email,
    subject: "Reset your password",
    html: `
      <h2>Reset your password</h2>
      <p>Someone requested a password reset for your Group Trip account.</p>
      <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    `,
  });
}
```

**Notes:**
- The `from` address domain must be verified in Resend's dashboard.
- When `RESEND_API_KEY` is not set, it gracefully falls back to console logging for local development.
- The email HTML is intentionally simple — no external CSS or images that could trigger mixed content issues.

#### 4d. Rewrite forgot-password endpoint

**File:** `src/app/api/auth/forgot-password/route.ts`

Replace the entire file:
```typescript
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/validators/auth";
import { rateLimit } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";
import { ZodError } from "zod";

export async function POST(request: Request) {
  const blocked = await rateLimit(request, "auth");
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Invalidate any existing unused tokens for this user
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      // Generate cryptographically secure token (256 bits of entropy)
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: { token, userId: user.id, expiresAt },
      });

      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      await sendPasswordResetEmail(email, resetUrl);
    }

    // Always return 200 — don't reveal whether the email exists
    return NextResponse.json({
      message: "If an account exists, a reset link has been sent",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Key differences from the stub:**
- Uses `crypto.randomBytes(32)` (256 bits) instead of `mock-token-${user.id}` (which leaked the user ID and had ~0 bits of entropy)
- Stores the token in the database with a 1-hour expiration
- Invalidates previous unused tokens for the same user (prevents token hoarding)
- Sends the email via Resend (or logs in dev)
- Rate limited
- Anti-enumeration behavior preserved (always returns 200)

#### 4e. Create reset-password API endpoint

**New file:** `src/app/api/auth/reset-password/route.ts`

```typescript
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordApiSchema } from "@/validators/auth";
import { rateLimit } from "@/lib/rate-limit";
import { ZodError } from "zod";

export async function POST(request: Request) {
  const blocked = await rateLimit(request, "auth");
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const { token, password } = resetPasswordApiSchema.parse(body);

    // Look up token and verify it's valid
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: { select: { id: true } } },
    });

    if (
      !resetToken ||
      resetToken.usedAt !== null ||
      resetToken.expiresAt < new Date()
    ) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    // Hash new password with same config as registration (bcrypt, 12 rounds)
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password and mark token as used atomically
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Security properties:**
- Token is looked up by its hashed value (Prisma `@unique` index)
- Three-way validation: token exists AND not already used AND not expired
- Password update and token consumption happen in a `$transaction` to prevent race conditions
- Uses `bcrypt.hash(password, 12)` — same as registration and change-password
- Rate limited to prevent brute-force token guessing

#### 4f. Create reset-password page

**New file:** `src/app/(auth)/reset-password/page.tsx`

Follows the exact same layout pattern as `src/app/(auth)/forgot-password/page.tsx`:

```tsx
import Link from "next/link";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="glass bg-white rounded-2xl shadow-md border border-sand-200 p-8 flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold font-display text-ocean-900">
            Set new password
          </h1>
          <p className="mt-1 text-sm text-sand-500">
            Enter your new password below
          </p>
        </div>

        <Suspense fallback={<div className="h-32" />}>
          <ResetPasswordForm />
        </Suspense>

        <p className="text-center text-sm text-sand-500">
          <Link
            href="/login"
            className="text-ocean-600 hover:text-ocean-700 hover:underline font-medium"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
```

**Note:** The `<Suspense>` boundary is required because the form uses `useSearchParams()` to read the token. Without it, the Next.js build fails (this is the same pattern used on the existing auth pages — see commit `b10535a`).

#### 4g. Create reset-password form component

**New file:** `src/components/auth/ResetPasswordForm.tsx`

Follows the same patterns as `RegisterForm.tsx` — uses `react-hook-form` + `zodResolver`, the app's `Input` and `Button` components, and `useSearchParams`:

```tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/validators/auth";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: token ?? "" },
  });

  if (!token) {
    return (
      <div className="rounded-md bg-coral-50 p-4 text-sm text-coral-800">
        Invalid reset link. Please request a new one.
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-md bg-seafoam-50 p-4 text-sm text-seafoam-800">
        Password updated successfully. You can now{" "}
        <a href="/login" className="underline font-medium">
          sign in
        </a>{" "}
        with your new password.
      </div>
    );
  }

  async function onSubmit(data: ResetPasswordInput) {
    setServerError(null);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: data.token, password: data.password }),
    });

    if (!res.ok) {
      const body = await res.json();
      setServerError(body.error || "Something went wrong");
      return;
    }

    setSuccess(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <input type="hidden" {...register("token")} />
      <Input
        label="New Password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register("password")}
      />
      <Input
        label="Confirm Password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      {serverError && (
        <p className="text-sm text-coral-600 text-center">{serverError}</p>
      )}
      <Button type="submit" loading={isSubmitting} className="w-full">
        Reset password
      </Button>
    </form>
  );
}
```

---

## 5. MEDIUM: Strengthen Password Requirements

### Problem

Password validation (`src/validators/auth.ts` line 12, `src/validators/settings.ts`) only enforces `min(8)`. No uppercase, lowercase, or digit requirements. Users can register with passwords like `aaaaaaaa`.

### Implementation

**File:** `src/validators/auth.ts`

Extract a shared password schema at the top of the file:
```typescript
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number");
```

Replace `z.string().min(8, "Password must be at least 8 characters")` with `passwordSchema` in:
- `registerSchema` (line 12) — the `password` field
- `registerApiSchema` (line 24) — the `password` field
- `resetPasswordSchema` (from step 4b) — the `password` field
- `resetPasswordApiSchema` (from step 4b) — the `password` field

**File:** `src/validators/settings.ts`

Import `passwordSchema` from `@/validators/auth` and use it for the `newPassword` field in:
- `changePasswordSchema`
- `changePasswordApiSchema`

The `currentPassword` field should NOT use the new schema — existing passwords that don't meet the new requirements still need to be accepted for verification.

### Why no special character requirement

Requiring special characters pushes users toward predictable patterns (`Password1!`). Length + mixed case + digit provides strong entropy for a travel planning app. Breached password checking (HaveIBeenPwned API) would add an external dependency and network call during every registration and password change — disproportionate for this app's threat model.

---

## 6. MEDIUM: Configure JWT Expiration

### Problem

`src/lib/auth.ts` has no `session.maxAge` or `jwt.maxAge` set. NextAuth defaults to 30 days. If a user's device is stolen or compromised, the attacker has up to 30 days of access.

### Implementation

**File:** `src/lib/auth.ts`

Add `maxAge` to the session config (line 33):
```typescript
session: {
  strategy: "jwt",
  maxAge: 7 * 24 * 60 * 60, // 7 days (down from default 30)
},
```

### Why 7 days

The default 30 days is long for a trip planning app where sessions are typically active during planning sprints. 7 days keeps users signed in for a week of active planning but doesn't persist sessions for a month. This is pragmatic without being annoying.

### Why no token rotation

NextAuth v4's JWT rotation with CredentialsProvider is fragile. The `rotate` option is designed for OAuth flows where a refresh token exists. With credentials, rotation can invalidate sessions unexpectedly when the user has multiple tabs open. The 7-day expiry alone is a significant improvement.

---

## 7. MEDIUM: Harden File Upload Validation

### Problem

In `src/app/api/upload/route.ts`, line 28:
```typescript
const ext = extname((file as File).name || '').toLowerCase() || '.jpg';
```

The file extension is extracted from the user-provided filename. While the MIME type is validated against `ACCEPTED_IMAGE_TYPES` (JPEG, PNG, WebP), a user could send `Content-Type: image/png` with a file named `payload.html`. The resulting file would be saved as `<nanoid>.html` in the public uploads directory and served by Next.js as HTML.

### Implementation

**File:** `src/app/api/upload/route.ts`

**Change 1: Derive extension from MIME type, not filename**

Replace line 28:
```typescript
// Before:
const ext = extname((file as File).name || '').toLowerCase() || '.jpg';

// After:
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const ext = MIME_TO_EXT[file.type] || ".jpg";
```

This ensures the saved file always has an image extension, regardless of what the user named their file.

**Change 2: Add magic byte validation**

After `const buffer = Buffer.from(bytes);` (line 31), add:
```typescript
const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46], // "RIFF" header
};

const expectedMagic = MAGIC_BYTES[file.type];
if (expectedMagic && !expectedMagic.every((b, i) => buffer[i] === b)) {
  return NextResponse.json(
    { error: "File content does not match its declared type" },
    { status: 400 }
  );
}
```

This validates that the actual file bytes match the declared MIME type. It prevents an attacker from uploading an HTML or JavaScript file with a spoofed `Content-Type: image/png` header. The `MIME_TO_EXT` map from Change 1 makes this belt-and-suspenders, but defense in depth is appropriate for file uploads.

---

## 8. LOW: Reduce Registration Email Enumeration

### Problem

`src/app/api/auth/register/route.ts` lines 13-16:
```typescript
if (existing) {
  return NextResponse.json(
    { error: "Email already in use" },
    { status: 409 }
  );
}
```

This confirms whether an email exists in the system. The login endpoint correctly uses a generic "Invalid email or password" message, but registration leaks this information.

### Implementation

**File:** `src/app/api/auth/register/route.ts`

Change the error message:
```typescript
if (existing) {
  return NextResponse.json(
    { error: "Unable to create account. Please try a different email or sign in." },
    { status: 409 }
  );
}
```

**File:** `src/components/auth/RegisterForm.tsx`

Update the client-side 409 handler to match:
```typescript
if (res.status === 409) {
  setServerError(
    "Unable to create account. Please try a different email or sign in."
  );
  return;
}
```

### Limitations

A determined attacker can still enumerate by timing differences (the happy path runs `bcrypt.hash` which takes ~250ms, while the conflict path returns immediately). Full anti-enumeration would require always running bcrypt or introducing artificial delay — overkill for this app's threat model.

---

## 9. LOW: Docker Non-Root User

### Problem

The `Dockerfile` has no `USER` directive. The Next.js app runs as root inside the container. If the app has a code execution vulnerability, the attacker gets root access to the container.

### Implementation

**File:** `Dockerfile`

In the runtime stage, after the `RUN npx prisma generate` line and before `EXPOSE 3000`, add:
```dockerfile
# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Ensure uploads directory exists and is writable
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

# Switch to non-root user
USER nextjs
```

Update the COPY directives that copy from the builder stage to set ownership:
```dockerfile
# Before:
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# After:
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
```

This follows the official Next.js Dockerfile example. The `nextjs` user has no shell access and minimal permissions. The `public/uploads` directory is explicitly made writable since the app writes uploaded images there at runtime.

---

## Summary

### New Files

| File | Purpose |
|------|---------|
| `src/lib/env-check.ts` | Reject placeholder NEXTAUTH_SECRET in production |
| `src/lib/rate-limit.ts` | In-memory rate limiting utility |
| `src/lib/email.ts` | Resend email integration for password reset |
| `src/app/api/auth/reset-password/route.ts` | Password reset API endpoint |
| `src/app/(auth)/reset-password/page.tsx` | Password reset page |
| `src/components/auth/ResetPasswordForm.tsx` | Password reset form component |

### Modified Files

| File | Change |
|------|--------|
| `.gitignore` | Add `.env`, `.env.docker` to ignore list |
| `.env.example` | Add secret generation instructions, add RESEND_API_KEY, remove Cloudflare token |
| `.env.docker.example` | Require secrets, add RESEND_API_KEY |
| `docker-compose.yml` | Require secrets via `${VAR:?msg}`, remove DB port exposure |
| `Dockerfile` | Add non-root user, set file ownership |
| `next.config.js` | Add security headers (X-Frame-Options, HSTS, etc.) |
| `prisma/schema.prisma` | Add `PasswordResetToken` model + User relation |
| `src/lib/auth.ts` | Import env check, set `session.maxAge` to 7 days |
| `src/validators/auth.ts` | Add `passwordSchema` with complexity rules, add reset schemas |
| `src/validators/settings.ts` | Apply `passwordSchema` to change-password validators |
| `src/app/api/auth/[...nextauth]/route.ts` | Wrap POST handler with rate limiter |
| `src/app/api/auth/register/route.ts` | Add rate limiting, change enumeration message |
| `src/app/api/auth/forgot-password/route.ts` | Full rewrite with real tokens + Resend email |
| `src/app/api/upload/route.ts` | Rate limit, MIME-based extension, magic byte validation |
| `src/components/auth/RegisterForm.tsx` | Update 409 error message |

### New Dependencies

| Package | Purpose | Weekly Downloads |
|---------|---------|-----------------|
| `rate-limiter-flexible` | In-memory rate limiting | ~1.5M |
| `resend` | Transactional email for password reset | ~300K |

### Manual Actions Required

1. Revoke the Cloudflare token in the Cloudflare dashboard and generate a new one
2. Generate a real NEXTAUTH_SECRET: `openssl rand -base64 32`
3. Get a Resend API key at https://resend.com and verify the sender domain
4. After implementation, run `git rm --cached .env` to untrack the file

---

## Verification

1. **Secrets removed from git:** `git ls-files .env` returns nothing
2. **Env check works:** Set `NODE_ENV=production` with `NEXTAUTH_SECRET="your-secret-here"`, verify app refuses to start with clear error message
3. **Security headers present:** `curl -I http://localhost:3000` shows X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Strict-Transport-Security
4. **Rate limiting works:** Hit login endpoint 6 times in rapid succession, verify 6th request gets 429 status
5. **Password reset flow:** Request reset via forgot-password form → receive email (or console log in dev) → follow link → set new password → sign in with new password
6. **Password complexity enforced:** Try registering with `abcdefgh` (no uppercase/digit), verify Zod rejection message
7. **JWT expiry:** Sign in, inspect the `next-auth.session-token` cookie, confirm expiration is ~7 days out
8. **Upload hardened:** Attempt uploading an HTML file with `Content-Type: image/png`, verify rejection by magic byte check
9. **Registration enumeration fixed:** Register with existing email, verify generic error message
10. **Docker non-root:** Build container, run `docker exec travelplanner-app whoami`, verify output is `nextjs`
11. **Existing tests pass:** `npm run test` shows no regressions
