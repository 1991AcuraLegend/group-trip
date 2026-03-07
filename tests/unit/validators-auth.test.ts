import { describe, it, expect } from 'vitest';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordApiSchema,
  resetPasswordSchema,
} from '@/validators/auth';

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
    password: 'Securepass1',
    confirmPassword: 'Securepass1',
  };

  it('accepts valid registration data', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects when password is shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'Short1', confirmPassword: 'Short1' });
    expect(result.success).toBe(false);
  });

  it('rejects when password is missing an uppercase letter', () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: 'securepass1',
      confirmPassword: 'securepass1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when password is missing a number', () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: 'Securepass',
      confirmPassword: 'Securepass',
    });
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

describe('resetPasswordSchema', () => {
  const valid = {
    token: 'token-123',
    password: 'Resetpass1',
    confirmPassword: 'Resetpass1',
  };

  it('accepts a valid token and password', () => {
    expect(resetPasswordSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects when passwords do not match', () => {
    expect(
      resetPasswordSchema.safeParse({ ...valid, confirmPassword: 'Resetpass2' }).success
    ).toBe(false);
  });

  it('rejects weak passwords', () => {
    expect(
      resetPasswordSchema.safeParse({ ...valid, password: 'weakpass', confirmPassword: 'weakpass' }).success
    ).toBe(false);
  });

  it('accepts the API schema payload', () => {
    expect(resetPasswordApiSchema.safeParse({ token: valid.token, password: valid.password }).success).toBe(true);
  });
});
