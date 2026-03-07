import { describe, expect, it } from 'vitest';
import { validateEnvironment } from '@/lib/env-check';

describe('validateEnvironment', () => {
  it('accepts a strong NEXTAUTH_SECRET', () => {
    const original = process.env.NEXTAUTH_SECRET;
    process.env.NEXTAUTH_SECRET = 'very-secure-secret-value-123';

    expect(() => validateEnvironment()).not.toThrow();

    process.env.NEXTAUTH_SECRET = original;
  });

  it('rejects a known insecure NEXTAUTH_SECRET', () => {
    const original = process.env.NEXTAUTH_SECRET;
    process.env.NEXTAUTH_SECRET = 'your-secret-here';

    expect(() => validateEnvironment()).toThrow(/NEXTAUTH_SECRET/);

    process.env.NEXTAUTH_SECRET = original;
  });
});