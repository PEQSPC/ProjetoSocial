import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { AuthController } from '../controllers/AuthController.js';
import { AuthService } from '../services/AuthService.js';
import { UserRepository } from '../repository/UserRepository.js';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { tokenBlacklistService } from '../services/TokenBlacklistService.js';

// Dependency injection
const userRepository = new UserRepository(prisma);
const authService = new AuthService(userRepository, tokenBlacklistService);
const authController = new AuthController(authService);

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later',
});

// Public routes
router.post('/register', authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refreshToken);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.post('/change-password', authenticate, authController.changePassword);
router.get('/me', authenticate, authController.getCurrentUser);

export default router;