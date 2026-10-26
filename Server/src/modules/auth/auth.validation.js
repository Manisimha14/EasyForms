// src/modules/auth/auth.validation.js
// Zod schemas for all authentication endpoints.
// All object schemas use .strict() to reject unknown properties.

import { z } from 'zod';
import { COMMON_PASSWORDS } from '../../constants/common-passwords.js';

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Invalid email format.')
  .max(254, 'Email must not exceed 254 characters.');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(64, 'Password must not exceed 64 characters.')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter.')
  .regex(/[0-9]/, 'Password must contain at least one number.');

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    name: z.string().trim().min(1, 'Name cannot be empty.').max(80, 'Name must not exceed 80 characters.').optional(),
  })
  .strict()
  .refine((data) => data.password.toLowerCase() !== data.email.toLowerCase(), {
    message: 'Password cannot be the same as your email address.',
    path: ['password'],
  })
  .refine((data) => !COMMON_PASSWORDS.has(data.password.toLowerCase()), {
    message: 'Password is too common and easily guessed.',
    path: ['password'],
  });

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required.'),
  })
  .strict();

export const refreshSchema = z
  .object({
    refreshToken: z.string().min(1, 'Refresh token is required.'),
  })
  .strict();

export const logoutSchema = z
  .object({
    refreshToken: z.string().min(1, 'Refresh token is required.'),
  })
  .strict();

export const updateMeSchema = z
  .object({
    name: z.string().trim().min(1, 'Name cannot be empty.').max(80, 'Name must not exceed 80 characters.'),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: passwordSchema,
  })
  .strict()
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password.',
    path: ['newPassword'],
  })
  .refine((data) => !COMMON_PASSWORDS.has(data.newPassword.toLowerCase()), {
    message: 'New password is too common and easily guessed.',
    path: ['newPassword'],
  });

export const deleteMeSchema = z
  .object({
    password: z.string().min(1, 'Password is required.'),
  })
  .strict();
