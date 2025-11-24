import { LoginDTO, RegisterDTO, LoginResponseDTO, RefreshTokenResponseDTO } from '../../types/dto/auth.dto.js';

export interface IAuthService {
  register(data: RegisterDTO): Promise<LoginResponseDTO>;
  login(data: LoginDTO): Promise<LoginResponseDTO>;
  refreshToken(refreshToken: string): Promise<RefreshTokenResponseDTO>;
  logout(accessToken: string, refreshToken: string): Promise<void>;
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
}