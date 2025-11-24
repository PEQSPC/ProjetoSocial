import { PrismaClient } from '@prisma/client';
import { AppUser } from '../models/AppUser';
import { IUserRepository } from './interfaces/IUserRepository';

export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
    role: string;
    isActive: boolean;
  }): Promise<AppUser> {
    const user = await this.prisma.appUser.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        isActive: data.isActive,
      },
    });

    return this.toDomainModel(user);
  }

  async findById(id: string): Promise<AppUser | null> {
    const user = await this.prisma.appUser.findUnique({
      where: { id },
    });

    if (!user) return null;
    return this.toDomainModel(user);
  }

  async findByEmail(email: string): Promise<AppUser | null> {
    const user = await this.prisma.appUser.findUnique({
      where: { email },
    });

    if (!user) return null;
    return this.toDomainModel(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.appUser.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.prisma.appUser.update({
      where: { id },
      data: { passwordHash },
    });
  }

  private toDomainModel(prismaUser: any): AppUser {
    return new AppUser(
      prismaUser.id,
      prismaUser.name,
      prismaUser.email,
      prismaUser.role,
      prismaUser.passwordHash,
      prismaUser.isActive,
      prismaUser.createdAt,
      prismaUser.lastLoginAt
    );
  }
}