# WS 1 — Auth System

> **Depends on:** WS 0 (Bootstrap)
> **Can parallelize with:** WS 2–6
> **Merge order:** 2nd (after WS 0)

---

## Overview

Implement email/password authentication using NextAuth.js with the Credentials provider. Includes login, registration, forgot password (console-log only for MVP), and session management. All other workstreams that need auth will stub `getServerSession()` until this merges.

---

## Files to Create

### 1. NextAuth Configuration

#### `src/lib/auth.ts`

NextAuth config with Credentials provider:

```ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; }
      return token;
    },
    async session({ session, token }) {
      if (session.user) { session.user.id = token.id as string; }
      return session;
    },
  },
};
```

Extend NextAuth types in `src/types/next-auth.d.ts`:
```ts
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: { id: string; name: string; email: string; };
  }
}

declare module 'next-auth/jwt' {
  interface JWT { id: string; }
}
```

#### `src/app/api/auth/[...nextauth]/route.ts`
```ts
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

---

### 2. Auth Helpers

#### `src/lib/auth-helpers.ts`

```ts
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { NextResponse } from 'next/server';

// Get session or return null
export async function getSession() {
  return getServerSession(authOptions);
}

// Get session or throw 401 — use in API routes
export async function requireAuth() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session;
}

// Helper for API routes: returns 401 response if not authed
export async function withAuth(
  handler: (session: { user: { id: string; name: string; email: string } }) => Promise<NextResponse>
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return handler(session);
}
```

---

### 3. Registration API

#### `src/app/api/auth/register/route.ts`

```ts
POST handler:
1. Parse body with registerApiSchema (from src/validators/auth.ts — server-side schema without confirmPassword)
2. Check if email already exists → 409 Conflict
3. Hash password with bcrypt (salt rounds: 12)
4. Create user in database
5. Return { id, email, name } (never return passwordHash)
```

---

### 4. Forgot Password API

#### `src/app/api/auth/forgot-password/route.ts`

```ts
POST handler:
1. Parse body with forgotPasswordSchema
2. Look up user by email
3. If found: console.log a mock reset link (e.g., "Password reset link for {email}: http://localhost:3000/reset?token=mock-token-{userId}")
4. Always return 200 with { message: "If an account exists, a reset link has been sent" } (don't reveal if email exists)
```

---

### 5. Auth Pages

#### `src/app/(auth)/layout.tsx`
Centered layout — full-screen flex container with card in the middle. No navbar. Tailwind classes: `min-h-screen flex items-center justify-center bg-gray-50`.

#### `src/app/(auth)/login/page.tsx`
- Renders `<LoginForm />`
- Link to `/register` and `/forgot-password`

#### `src/app/(auth)/register/page.tsx`
- Renders `<RegisterForm />`
- Link to `/login`

#### `src/app/(auth)/forgot-password/page.tsx`
- Renders `<ForgotPasswordForm />`
- Link back to `/login`

---

### 6. Auth Components

#### `src/components/auth/LoginForm.tsx`
- React Hook Form with `loginSchema` resolver
- Fields: email, password
- Submit: call `signIn('credentials', { email, password, redirect: false })`
- On success: `router.push('/dashboard')`
- On error: show "Invalid email or password"
- Uses `<Input>` and `<Button>` from `src/components/ui/`

#### `src/components/auth/RegisterForm.tsx`
- React Hook Form with `registerSchema` resolver
- Fields: name, email, password, confirmPassword
- Submit: POST to `/api/auth/register`, then auto-login with `signIn()`
- On 409: show "Email already in use"
- On success: redirect to `/dashboard`

#### `src/components/auth/ForgotPasswordForm.tsx`
- React Hook Form with `forgotPasswordSchema` resolver
- Field: email
- Submit: POST to `/api/auth/forgot-password`
- Show success message: "If an account with that email exists, a reset link has been sent."
- (MVP: the "link" is console-logged on the server)

---

### 7. UI Primitives (needed by auth forms, shared with all workstreams)

#### `src/components/ui/Button.tsx`
```tsx
Props: variant ('primary' | 'secondary' | 'danger'), size ('sm' | 'md' | 'lg'), loading (boolean), + standard button props.
- Primary: bg-blue-600 hover:bg-blue-700 text-white
- Secondary: bg-gray-200 hover:bg-gray-300 text-gray-800
- Danger: bg-red-600 hover:bg-red-700 text-white
- Loading: show spinner, disable button
```

#### `src/components/ui/Input.tsx`
```tsx
Props: label (string), error (string), + standard input props.
- Renders label above input, error message below in red.
- Uses forwardRef for React Hook Form compatibility.
```

#### `src/components/ui/LoadingSpinner.tsx`
Simple animated spinner SVG. Props: size ('sm' | 'md' | 'lg').

---

### 8. Middleware

#### `src/middleware.ts`
```ts
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: { signIn: '/login' },
});

export const config = {
  matcher: ['/dashboard/:path*', '/trips/:path*'],
};
```

Protects `/dashboard` and `/trips` routes — redirects to `/login` if not authenticated.

---

## Interface Contracts

### What this workstream exports:

| Export | Path | Used by |
|--------|------|---------|
| `authOptions` | `src/lib/auth.ts` | NextAuth route handler |
| `getSession()` | `src/lib/auth-helpers.ts` | WS 2, 3, 6 API routes |
| `requireAuth()` | `src/lib/auth-helpers.ts` | WS 2, 3, 6 API routes |
| `withAuth()` | `src/lib/auth-helpers.ts` | WS 2, 3, 6 API routes |
| `Session` type extension | `src/types/next-auth.d.ts` | All client components |
| `<Button>` | `src/components/ui/Button.tsx` | WS 2, 4, 6 |
| `<Input>` | `src/components/ui/Input.tsx` | WS 2, 4, 6 |
| `<LoadingSpinner>` | `src/components/ui/LoadingSpinner.tsx` | All |
| Middleware protection | `src/middleware.ts` | Automatic |

### What this workstream consumes:

| Dependency | From | Notes |
|-----------|------|-------|
| `prisma` | WS 0 | Database queries |
| `loginSchema`, `registerSchema`, `forgotPasswordSchema` | WS 0 | Form validation |
| `AuthProvider` | WS 0 | SessionProvider wrapper |
| Root layout | WS 0 | Providers already wrapped |

---

## Stubbing for Parallel Work

Other workstreams that need auth before WS 1 merges should:
1. Import `getServerSession` from `next-auth` directly
2. Use a stub that returns a mock session: `{ user: { id: 'mock-user', name: 'Test', email: 'test@test.com' } }`
3. After WS 1 merges, replace with imports from `src/lib/auth-helpers.ts`

---

## Verification Checklist

- [ ] Registration: POST `/api/auth/register` creates user, passwords are hashed
- [ ] Login: `signIn('credentials')` returns session with user id
- [ ] Session: `getServerSession()` returns user data in API routes
- [ ] Protected routes: `/dashboard` redirects to `/login` when not authenticated
- [ ] Login form: shows validation errors, handles invalid credentials
- [ ] Register form: shows validation errors, handles duplicate email
- [ ] Forgot password: console.logs reset link, shows generic success message
- [ ] JWT token includes user id
- [ ] Session callback includes user id
- [ ] No passwordHash ever returned in API responses
