import { Category, CategoryType } from '../../models/Category.js';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../../types/dto/category.dto.js';

/**
 * Category Repository Interface
 * 
 * This interface defines the contract for category data access.
 * Any class implementing this interface MUST provide these methods.
 * 
 * Benefits:
 * 1. Dependency Inversion - Services depend on this interface, not concrete classes
 * 2. Testability - Easy to create mock implementations for testing
 * 3. Flexibility - Can swap database implementations without changing services
 * 4. Documentation - Clear contract of what operations are available
 */

export interface ICategoryRepository {
  /**
   * Create a new category
   * @param data - Category data
   * @returns Created category
   */
  create(data: CreateCategoryDTO): Promise<Category>;

  /**
   * Find category by ID
   * @param id - Category UUID
   * @returns Category if found, null otherwise
   */
  findById(id: string): Promise<Category | null>;

  /**
   * Find all categories with optional filtering
   * @param filters - Optional type filter
   * @returns Array of categories
   */
  findAll(filters?: { type?: CategoryType }): Promise<Category[]>;

  /**
   * Update existing category
   * @param id - Category ID
   * @param data - Fields to update
   * @returns Updated category or null if not found
   */
  update(id: string, data: UpdateCategoryDTO): Promise<Category | null>;

  /**
   * Delete category
   * @param id - Category ID
   * @returns true if deleted, false if not found
   */
  delete(id: string): Promise<boolean>;

  /**
   * Check if category name exists
   * @param name - Name to check
   * @param excludeId - ID to exclude (for updates)
   * @returns true if name exists
   */
  existsByName(name: string, excludeId?: string): Promise<boolean>;

  /**
   * Count categories by type
   * @param type - Category type
   * @returns Count of categories
   */
  countByType(type: CategoryType): Promise<number>;
}