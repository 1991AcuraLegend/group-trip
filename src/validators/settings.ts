import { z } from "zod";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

// Server-side schema (no confirmNewPassword)
export const changePasswordApiSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const changeNameSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
});

export const changeNameApiSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
});

export type ChangeNameInput = z.infer<typeof changeNameSchema>;
