import { Category } from '../../models/Category.js';
import { CreateCategoryDTO, UpdateCategoryDTO, CategoryQueryDTO } from '../../types/dto/category.dto.js';

/**
 * Category Service Interface
 * 
 * Defines the business operations available for categories.
 * Controllers depend on this interface, not the concrete service.
 */

export interface ICategoryService {
  /**
   * Create a new category
   */
  createCategory(data: CreateCategoryDTO): Promise<Category>;

  /**
   * Get category by ID
   */
  getCategoryById(id: string): Promise<Category>;

  /**
   * Get all categories with optional filtering
   */
  getAllCategories(query?: CategoryQueryDTO): Promise<Category[]>;

  /**
   * Update existing category
   */
  updateCategory(id: string, data: UpdateCategoryDTO): Promise<Category>;

  /**
   * Delete category
   */
  deleteCategory(id: string): Promise<void>;

  /**
   * Get category statistics
   */
  getCategoryStatistics(): Promise<{
    total: number;
    byType: {
      food: number;
      hygiene: number;
      clothing: number;
      other: number;
    };
  }>;

  /**
   * Clear all caches (optional operation)
   */
  clearAllCaches?(): void;
}