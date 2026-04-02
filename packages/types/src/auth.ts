// KWIKSELLER - Auth Validation Schemas
// Zod validation schemas for authentication forms

import { z } from 'zod'

// ==================== LOGIN ====================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// ==================== REGISTER ====================

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    phone: z.string().optional(),
    role: z.enum(['BUYER', 'VENDOR']),
    storeName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      if (data.role === 'VENDOR') {
        return !!data.storeName && data.storeName.length >= 3
      }
      return true
    },
    {
      message: 'Store name is required for vendors',
      path: ['storeName'],
    }
  )

export type RegisterFormData = z.infer<typeof registerSchema>

// ==================== FORGOT PASSWORD ====================

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

// ==================== RESET PASSWORD ====================

export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    otp: z
      .string()
      .min(6, 'Verification code must be 6 digits'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

// ==================== CHANGE PASSWORD ====================

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ['confirmNewPassword'],
  })

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

// ==================== EMAIL VERIFICATION ====================

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
})

export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>

// ==================== PROFILE UPDATE ====================

export const profileUpdateSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  dateOfBirth: z.string().optional(),
})

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>

// ==================== ADDRESS ====================

export const addressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  postalCode: z.string().optional(),
  isDefault: z.boolean().optional(),
  type: z.enum(['SHIPPING', 'BILLING']),
})

export type AddressFormData = z.infer<typeof addressSchema>
