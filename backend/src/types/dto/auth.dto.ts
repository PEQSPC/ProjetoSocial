import { z } from 'zod';

// #region Login DTOs
export const loginSchema = z.object({
  email: z.email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginDTO = z.infer<typeof loginSchema>;

export interface LoginResponseDTO {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}
// #endregion

// #region Register DTOs
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  email: z.email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  role: z.enum(['ADMIN', 'MANAGER', 'VOLUNTEER']).optional().default('VOLUNTEER'),
});

export type RegisterDTO = z.infer<typeof registerSchema>;
// #endregion

// #region Refresh Token DTOs
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenDTO = z.infer<typeof refreshTokenSchema>;

export interface RefreshTokenResponseDTO {
  accessToken: string;
  refreshToken: string;
}
// #endregion

// #region Change Password DTOs
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
});

export type ChangePasswordDTO = z.infer<typeof changePasswordSchema>;
// #endregion