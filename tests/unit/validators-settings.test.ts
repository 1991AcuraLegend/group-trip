import { describe, it, expect } from 'vitest';
import { changePasswordSchema, changeNameSchema } from '@/validators/settings';

describe('changePasswordSchema', () => {
  const valid = {
    currentPassword: 'oldpassword',
    newPassword: 'newpassword1',
    confirmNewPassword: 'newpassword1',
  };

  it('accepts valid matching passwords', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an empty currentPassword', () => {
    expect(changePasswordSchema.safeParse({ ...valid, currentPassword: '' }).success).toBe(false);
  });

  it('rejects missing currentPassword', () => {
    const { currentPassword: _, ...rest } = valid;
    expect(changePasswordSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects newPassword shorter than 8 characters', () => {
    expect(
      changePasswordSchema.safeParse({ ...valid, newPassword: 'short', confirmNewPassword: 'short' }).success,
    ).toBe(false);
  });

  it('rejects when newPassword and confirmNewPassword do not match', () => {
    expect(changePasswordSchema.safeParse({ ...valid, confirmNewPassword: 'different' }).success).toBe(false);
  });

  it('accepts newPassword of exactly 8 characters', () => {
    expect(
      changePasswordSchema.safeParse({ ...valid, newPassword: 'exactly8', confirmNewPassword: 'exactly8' }).success,
    ).toBe(true);
  });
});

describe('changeNameSchema', () => {
  it('accepts a valid name', () => {
    expect(changeNameSchema.safeParse({ name: 'Alice Smith' }).success).toBe(true);
  });

  it('rejects an empty name', () => {
    expect(changeNameSchema.safeParse({ name: '' }).success).toBe(false);
  });

  it('rejects a missing name', () => {
    expect(changeNameSchema.safeParse({}).success).toBe(false);
  });

  it('rejects a name over 100 characters', () => {
    expect(changeNameSchema.safeParse({ name: 'a'.repeat(101) }).success).toBe(false);
  });

  it('accepts a name of exactly 100 characters', () => {
    expect(changeNameSchema.safeParse({ name: 'a'.repeat(100) }).success).toBe(true);
  });
});
