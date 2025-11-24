import { Request, Response, NextFunction } from 'express';

import { IAuthService } from '../services/interfaces/IAuthService.js';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from '../types/dto/auth.dto.js';
import { ValidationError } from '../utils/errors.js';
import { extractTokenFromHeader } from '../config/jwt.js';

export class AuthController {
  constructor(private readonly authService: IAuthService) {}

  // #region Register
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        
      const validatedData = registerSchema.parse(req.body);
      const result = await this.authService.register(validatedData);

      res.status(201).json({
        success: true,
        data: result,
        message: 'User registered successfully',
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        next(new ValidationError('Invalid registration data', error.errors));
        return;
      }
      next(error);
    }
  };
  // #endregion

  // #region Login
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await this.authService.login(validatedData);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        next(new ValidationError('Invalid login data', error.errors));
        return;
      }
      next(error);
    }
  };
  // #endregion

  // #region Refresh Token
  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);
      const result = await this.authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Token refreshed successfully',
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        next(new ValidationError('Invalid refresh token', error.errors));
        return;
      }
      next(error);
    }
  };
  // #endregion

  // #region Logout
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accessToken = extractTokenFromHeader(req.headers.authorization);
      const { refreshToken } = req.body;

      if (!accessToken || !refreshToken) {
        next(new ValidationError('Access token and refresh token are required'));
        return;
      }

      await this.authService.logout(accessToken, refreshToken);

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  };
  // #endregion

  // #region Change Password
  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = changePasswordSchema.parse(req.body);
      
      // req.user is populated by authenticate middleware
      const userId = req.user?.userId;
      if (!userId) {
        next(new ValidationError('User not authenticated'));
        return;
      }

      await this.authService.changePassword(
        userId,
        validatedData.currentPassword,
        validatedData.newPassword
      );

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        next(new ValidationError('Invalid password data', error.errors));
        return;
      }
      next(error);
    }
  };
  // #endregion

  // #region Get Current User
  getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // req.user is populated by authenticate middleware
      res.status(200).json({
        success: true,
        data: req.user,
      });
    } catch (error) {
      next(error);
    }
  };
  // #endregion
}