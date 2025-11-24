import { Category, CategoryType } from '../models/Category.js';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../types/dto/category.dto.js';
import { ICategoryRepository } from './interfaces/ICategoryRepository.js';
import { prisma } from '../config/prisma.js';
import { Prisma } from '../generated/prisma/client.js';

/**
 * Prisma Category Repository Implementation
 * 
 * The repository pattern abstracts data access.
 * It acts as a collection of domain objects in memory.
 * 
 * This class implements the ICategoryRepository interface using Prisma ORM.
 * 
 * Key Point: By implementing the interface, we guarantee that this class
 * provides all the methods defined in the contract. TypeScript will error
 * if we miss any methods or get signatures wrong.
 * Benefits:
 * 1. Testability: Easy to mock for unit tests
 * 2. Flexibility: Can swap database implementation
 * 3. Single Responsibility: Only this class knows about data persistence
 * 4. Domain-focused: Methods speak business language
 */

export class CategoryRepository implements ICategoryRepository {
  
  constructor(private readonly prismaClient: typeof prisma) {
  }

  /**
   * Create a new category
   * 
   * @param data - Category data from DTO
   * @returns Created category as domain model
   */
  async create(data: CreateCategoryDTO): Promise<Category> {
    const category = await this.prismaClient.category.create({
      data: {
        name: data.name.trim(),
        type: data.type,
      },
    });

    return this.toDomainModel(category);
  }

  /**
   * Find category by ID
   * 
   * @param id - Category UUID
   * @returns Category if found, null otherwise
   */
  async findById(id: string): Promise<Category | null> {
    const category = await this.prismaClient.category.findUnique({
      where: { id },
    });

    if (!category) {
      return null;
    }

    return this.toDomainModel(category);
  }

  /**
   * Find all categories with optional filtering
   * 
   * @param filters - Optional type filter
   * @returns Array of categories
   */
  async findAll(filters?: { type?: CategoryType }): Promise<Category[]> {
    const categories = await this.prismaClient.category.findMany({
      where: filters?.type ? { type: filters.type } : undefined,
      orderBy: {
        name: 'asc', // Alphabetical order
      },
    });
    return categories.map(this.toDomainModel);
  }

  /**
   * Update existing category
   * 
   * @param id - Category to update
   * @param data - Fields to update
   * @returns Updated category or null if not found
   */
  async update(id: string, data: UpdateCategoryDTO): Promise<Category | null> {
    try {
      const category = await this.prismaClient.category.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name.trim() }),
          ...(data.type !== undefined && { type: data.type }),
        },
      });

      return this.toDomainModel(category);
    } catch (error) {
      // Prisma throws P2025 when record not found
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }

  /**
 * Delete category
 *
 * @param id - Category ID to delete
 * @returns true if deleted, false if not found
 */
async delete(id: string): Promise<boolean> {
  try {
    await this.prismaClient.category.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    // Prisma "Record not found" error (P2025)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return false;
    }

    throw error;
  }
}

  /**
   * Check if category name exists
   * 
   * @param name - Name to check
   * @param excludeId - ID to exclude (for updates)
   * @returns true if name exists
   */
  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const category = await this.prismaClient.category.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive', // Case-insensitive
        },
        ...(excludeId && { 
          id: { not: excludeId } 
        }),
      },
    });

    return category !== null;
  }

  /**
   * Count categories by type
   * 
   * @param type - Category type
   * @returns Count of categories
   */
  async countByType(type: CategoryType): Promise<number> {
    return this.prismaClient.category.count({
      where: { type },
    });
  }

  /**
   * Convert Prisma result to domain model
   * 
   * This is the bridge between infrastructure and domain.
   * Centralizing conversion means:
   * - Single place to update if domain model changes
   * - Consistent domain object creation
   * - Type safety between layers
   */
  private toDomainModel(prismaCategory : any): Category {
    return new Category(
      prismaCategory.id,
      prismaCategory.name,
      prismaCategory.type as CategoryType,
      prismaCategory.createdAt,
      prismaCategory.updatedAt
    );
  }
}