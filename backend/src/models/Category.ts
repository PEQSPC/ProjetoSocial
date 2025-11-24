/**
 * Category Domain Model
 * 
 * This represents the Category entity in our domain.
 * It encapsulates:
 * 1. The data structure (properties)
 * 2. Business rules (validation)
 * 3. Behavior (methods)
 * 
 * The domain model is independent of:
 * - How data is stored (database)
 * - How data is transported (HTTP)
 * - How data is presented (UI)
 */

import { CategoryResponseDTO } from "types/dto/category.dto";

export class Category {
  constructor(
    
    public readonly id: string,
    public name: string,
    public type: CategoryType,
    public readonly createdAt: Date,
    public updatedAt: Date
  ) {
    // Constructor validation ensures objects are always in valid state
    // This is called "maintaining invariants"
    this.validateName(name);
    this.validateType(type);
  }

  /**
   * Business Rule: Category names must be meaningful
   * 
   * Why in the model?
   * This is a business rule, not just technical validation.
   * The business says "categories need meaningful names."
   */
  private validateName(name: string): void {
    if (!name || name.trim().length < 2) {
      throw new Error('Category name must be at least 2 characters');
    }

    if (name.trim().length > 100) {
      throw new Error('Category name must not exceed 100 characters');
    }
  }

  /**
   * Business Rule: Category must have a valid type
   * 
   * Runtime validation ensures type safety beyond TypeScript.
   * Data from external sources needs runtime checking.
   */
  private validateType(type: string): void {
    const validTypes: CategoryType[] = ['FOOD', 'HYGIENE', 'CLOTHING', 'OTHER'];
    if (!validTypes.includes(type as CategoryType)) {
      throw new Error(`Invalid category type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    }
  }

  /**
   * Update the category with new data
   * 
   * This method encapsulates update logic, ensuring:
   * 1. All invariants are checked before modification
   * 2. Updated timestamp is automatically maintained
   * 3. Partial updates are supported
   */
  public update(name?: string, type?: CategoryType): void {
    if (name !== undefined) {
      this.validateName(name);
      this.name = name.trim();
    }

    if (type !== undefined) {
      this.validateType(type);
      this.type = type;
    }

    // Automatically update the timestamp
    this.updatedAt = new Date();
  }

  /**
   * Check if category name matches (case-insensitive)
   * 
   * Business method for comparing names.
   * Encapsulates the comparison logic.
   */
  public hasName(name: string): boolean {
    return this.name.toLowerCase() === name.toLowerCase();
  }

  /**
   * Convert domain model to plain object
   * 
   * Used when:
   * - Sending data to clients (JSON serialization)
   * - Storing in database
   * - Logging
   */
   public toDTO(): CategoryResponseDTO  {
     return {
       id: this.id,
       name: this.name,
       type: this.type,
       createdAt: this.createdAt,
       updatedAt: this.updatedAt
     };
  }

  /**
   * Create a copy of this category
   * 
   * Useful for testing and ensuring immutability patterns
   */
  public clone(): Category {
    return new Category(
      this.id,
      this.name,
      this.type,
      new Date(this.createdAt),
      new Date(this.updatedAt)
    );
  }
}

/**
 * Type definition for category types
 * 
 * Union type provides compile-time type safety.
 * The domain model also validates this at runtime.
 */
export type CategoryType = 'FOOD' | 'HYGIENE' | 'CLOTHING' | 'OTHER';