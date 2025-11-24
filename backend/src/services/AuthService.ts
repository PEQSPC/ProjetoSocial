import { IAuthService } from './interfaces/IAuthService';
import { IUserRepository } from '../repositories/interfaces/IUserRepository';
import { LoginDTO, RegisterDTO, LoginResponseDTO, RefreshTokenResponseDTO } from '../types/dto/auth.dto';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokenPair, verifyRefreshToken } from '../config/jwt';
import { tokenBlacklistService } from './TokenBlacklistService';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors';

export class AuthService implements IAuthService {
  constructor(private readonly userRepository: IUserRepository) {}

  // #region Register
  async register(data: RegisterDTO): Promise<LoginResponseDTO> {
    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await this.userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash: hashedPassword,
      role: data.role || 'VOLUNTEER',
      isActive: true,
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(
      user.id,
      user.email,
      user.role
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }
  // #endregion

  // #region Login
  async login(data: LoginDTO): Promise<LoginResponseDTO> {
    // Find user by email
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError('Account is disabled');
    }

    // Verify password
    const isPasswordValid = await comparePassword(data.password, user.passwordHash || '');
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    await this.userRepository.updateLastLogin(user.id);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(
      user.id,
      user.email,
      user.role
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }
  // #endregion

  // #region Refresh Token
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponseDTO> {
    // Check if token is blacklisted
    if (tokenBlacklistService.isBlacklisted(refreshToken)) {
      throw new UnauthorizedError('Token has been revoked');
    }

    // Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error: any) {
      throw new UnauthorizedError(error.message);
    }

    // Verify user still exists and is active
    const user = await this.userRepository.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Generate new token pair
    const tokens = generateTokenPair(user.id, user.email, user.role);

    // Blacklist old refresh token
    tokenBlacklistService.addToken(refreshToken);

    return tokens;
  }
  // #endregion

  // #region Logout
  async logout(accessToken: string, refreshToken: string): Promise<void> {
    // Add both tokens to blacklist
    tokenBlacklistService.addToken(accessToken);
    tokenBlacklistService.addToken(refreshToken);
  }
  // #endregion

  // #region Change Password
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Get user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash || '');
    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await this.userRepository.updatePassword(userId, hashedPassword);
  }
  // #endregion
}