import { ICategoryRepository } from '../repository/interfaces/ICategoryRepository.js';
import { Category } from '../models/Category.js';
import { CreateCategoryDTO, UpdateCategoryDTO, CategoryQueryDTO } from '../types/dto/category.dto.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { cacheService } from './CacheService.js';
import { ICategoryService } from './interfaces/ICategoryService.js';
/**
 * Category Service with Caching
 * 
 * Caching Strategy:
 * - Cache individual categories by ID (frequently accessed)
 * - Cache category lists (read-heavy operation)
 * - Invalidate cache on updates/deletes (write-through pattern)
 * 
 * Cache Keys Convention:
 * - category:{id} - Individual category
 * - categories:all - All categories
 * - categories:type:{type} - Categories filtered by type
 * - categories:stats - Statistics
 */

export class CategoryService implements ICategoryService {
  // Cache key prefixes
  private readonly CACHE_PREFIX = 'category';
  private readonly CACHE_ALL_KEY = 'categories:all';
  private readonly CACHE_STATS_KEY = 'categories:stats';

  constructor(private repo: ICategoryRepository) {} // Depends on interface

  /**
   * Create a new category
   * 
   * Cache Strategy:
   * - Don't cache on create (not needed yet)
   * - Invalidate list caches (they're now stale)
   */
  async createCategory(data: CreateCategoryDTO): Promise<Category> {
    // Check for duplicate names
    const nameExists = await this.repo.existsByName(data.name);
    
    if (nameExists) {
      throw new ConflictError(
        `Category with name "${data.name}" already exists. Please choose a different name.`
      );
    }

    // Create category
    const category = await this.repo.create(data);

    // Invalidate list caches (they now exclude this new category)
    this.invalidateListCaches();

    return category;
  }

  /**
   * Get category by ID
   * 
   * Cache Strategy:
   * - Try cache first (cache-aside pattern)
   * - If miss, fetch from DB and cache
   * - TTL: 5 minutes (categories rarely change)
   */
  async getCategoryById(id: string): Promise<Category> {
    const cacheKey = `${this.CACHE_PREFIX}:${id}`;

    // Use getOrSet for elegant cache-aside pattern
    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const category = await this.repo.findById(id);
        
        if (!category) {
          throw new NotFoundError(
            `Category with ID "${id}" not found. It may have been deleted.`
          );
        }

        return category;
      },
      300 // 5 minutes TTL
    );
  }

  /**
   * Get all categories
   * 
   * Cache Strategy:
   * - Cache entire list (read-heavy, write-rare)
   * - Different cache keys for different filters
   * - Invalidate on any write operation
   */
  async getAllCategories(query?: CategoryQueryDTO): Promise<Category[]> {
    // Build cache key based on filter
    const cacheKey = query?.type 
      ? `categories:type:${query.type}`
      : this.CACHE_ALL_KEY;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.repo.findAll(
          query?.type ? { type: query.type } : undefined
        );
      },
      300 // 5 minutes TTL
    );
  }

  /**
   * Update category
   * 
   * Cache Strategy:
   * - Invalidate specific category cache
   * - Invalidate list caches (they contain old data)
   * - Don't cache the result (will be cached on next read)
   */
  async updateCategory(id: string, data: UpdateCategoryDTO): Promise<Category> {
    // Check if category exists
    const existingCategory = await this.repo.findById(id);
    
    if (!existingCategory) {
      throw new NotFoundError(
        `Category with ID "${id}" not found. Cannot update a non-existent category.`
      );
    }

    if(data.name == existingCategory.name){
      throw new ConflictError(
        `The new name is the same as the current name. Please provide a different name to update.`
      );
    }

    // Check for name conflicts
    if (data.name && data.name.toLowerCase() !== existingCategory.name.toLowerCase()) {
      const nameExists = await this.repo.existsByName(data.name, id);
      
      if (nameExists) {
        throw new ConflictError(
          `Category with name "${data.name}" already exists. Please choose a different name.`
        );
      }
    }

    // Perform update
    const updatedCategory = await this.repo.update(id, data);

    if (!updatedCategory) {
      throw new NotFoundError(
        `Category with ID "${id}" was deleted during the update operation.`
      );
    }

    // Invalidate caches
    this.invalidateCategoryCache(id);
    this.invalidateListCaches();

    return updatedCategory;
  }

  /**
   * Delete category
   * 
   * Cache Strategy:
   * - Invalidate specific category cache
   * - Invalidate list caches
   */
  async deleteCategory(id: string): Promise<void> {
    // Check if category exists
    const category = await this.repo.findById(id);
    
    if (!category) {
      throw new NotFoundError(
        `Category with ID "${id}" not found. Cannot delete a non-existent category.`
      );
    }

    // Delete from database
    const deleted = await this.repo.delete(id);

    if (!deleted) {
      throw new NotFoundError(
        `Category with ID "${id}" was deleted by another process.`
      );
    }

    // Invalidate caches
    this.invalidateCategoryCache(id);
    this.invalidateListCaches();
  }

  /**
   * Get category statistics
   * 
   * Cache Strategy:
   * - Cache stats (computationally expensive)
   * - Shorter TTL (1 minute) for fresher data
   * - Invalidate on any write operation
   */
  async getCategoryStatistics() {
    return cacheService.getOrSet(
      this.CACHE_STATS_KEY,
      async () => {
        const [foodCount, hygieneCount, clothingCount, otherCount, allCategories] = 
          await Promise.all([
            this.repo.countByType('FOOD'),
            this.repo.countByType('HYGIENE'),
            this.repo.countByType('CLOTHING'),
            this.repo.countByType('OTHER'),
            this.repo.findAll(),
          ]);

        return {
          total: allCategories.length,
          byType: {
            food: foodCount,
            hygiene: hygieneCount,
            clothing: clothingCount,
            other: otherCount,
          },
        };
      },
      60 // 1 minute TTL (shorter for stats)
    );
  }

  /**
   * Invalidate cache for a specific category
   */
  private invalidateCategoryCache(id: string): void {
    const cacheKey = `${this.CACHE_PREFIX}:${id}`;
    cacheService.delete(cacheKey);
  }

  /**
   * Invalidate all list caches
   * 
   * Called when any category is created/updated/deleted
   * because lists now contain stale data
   */
  private invalidateListCaches(): void {
    // Delete all cache
    cacheService.delete(this.CACHE_ALL_KEY);
    
    // Delete filtered lists
    cacheService.deletePattern('categories:type:*');
    
    // Delete stats
    cacheService.delete(this.CACHE_STATS_KEY);
  }

  /**
   * Clear all category caches
   * 
   * Useful for:
   * - Manual cache refresh
   * - Testing
   * - Debugging
   */
  clearAllCaches(): void {
    cacheService.deletePattern('category');
    cacheService.deletePattern('categories');
    console.log('All category caches cleared');
  }
}