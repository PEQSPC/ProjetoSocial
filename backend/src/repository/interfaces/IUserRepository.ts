import { AppUser } from '../../models/AppUser';

export interface IUserRepository {
  create(data: {
    name: string;
    email: string;
    passwordHash: string;
    role: string;
    isActive: boolean;
  }): Promise<AppUser>;
  findById(id: string): Promise<AppUser | null>;
  findByEmail(email: string): Promise<AppUser | null>;
  updateLastLogin(id: string): Promise<void>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
}