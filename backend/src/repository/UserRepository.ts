import { prisma } from '../config/prisma.js';
import { Prisma } from '../generated/prisma/client.js';
import { AppUser } from '../models/AppUser.js';
import { IUserRepository } from './interfaces/IUserRepository';


export class UserRepository implements IUserRepository {
  constructor(private readonly prismaClient: typeof prisma) {}

  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
    role: string;
    isActive: boolean;
  }): Promise<AppUser> {
    const user = await this.prismaClient.appUser.create({
      data: {
        name: data.name,
        email: data.email,
        password : data.passwordHash,
        role: data.role,
        isActive: data.isActive,
      },
    });

    return this.toDomainModel(user);
  }

  async findById(id: string): Promise<AppUser | null> {
    const user = await this.prismaClient.appUser.findUnique({
      where: { id },
    });

    if (!user) return null;
    return this.toDomainModel(user);
  }

  async findByEmail(email: string): Promise<AppUser | null> {
    const user = await this.prismaClient.appUser.findUnique({
      where: { email },
    });

    if (!user) return null;
    return this.toDomainModel(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prismaClient.appUser.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.prismaClient.appUser.update({
      where: { id },
      data: { password: passwordHash },
    });
  }

  private toDomainModel(prismaUser: any): AppUser {
    return new AppUser(
      prismaUser.id,
      prismaUser.name,
      prismaUser.email,
      prismaUser.role,
      prismaUser.password,
      prismaUser.isActive,
      prismaUser.createdAt,
      prismaUser.lastLoginAt
    );
  }
}