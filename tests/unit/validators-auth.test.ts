import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, forgotPasswordSchema } from '@/validators/auth';

describe('loginSchema', () => {
  it('accepts valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'alice@example.com', password: 'secret' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing email', () => {
    const result = loginSchema.safeParse({ password: 'secret' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({ email: 'alice@example.com', password: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing password', () => {
    const result = loginSchema.safeParse({ email: 'alice@example.com' });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  const valid = {
    name: 'Alice Smith',
    email: 'alice@example.com',
    password: 'securepass',
    confirmPassword: 'securepass',
  };

  it('accepts valid registration data', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects when password is shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'short', confirmPassword: 'short' });
    expect(result.success).toBe(false);
  });

  it('rejects when passwords do not match', () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: 'different' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = registerSchema.safeParse({ ...valid, email: 'bad-email' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty name', () => {
    const result = registerSchema.safeParse({ ...valid, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a name over 100 characters', () => {
    const result = registerSchema.safeParse({ ...valid, name: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('accepts name of exactly 100 characters', () => {
    expect(registerSchema.safeParse({ ...valid, name: 'a'.repeat(100) }).success).toBe(true);
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'alice@example.com' }).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects a missing email', () => {
    expect(forgotPasswordSchema.safeParse({}).success).toBe(false);
  });
});
