import { z } from 'zod';

/**
 * Data Transfer Objects (DTOs) for Category
 * 
 * DTOs serve as contracts between layers. They define:
 * 1. What data comes into the API (request validation)
 * 2. What data goes out of the API (response shape)
 * 
 * Using Zod gives us:
 * - Runtime validation (catches bad data at runtime)
 * - Type inference (TypeScript types derived from schemas)
 * - Clear error messages (tells users exactly what's wrong)
 */

// #region Validation Schemas

/**
 * Schema for creating a new category
 * 
 * All fields are required because we're creating a new entity.
 * The business rules:
 * - Name must be meaningful (2-100 chars)
 * - Type must be one of the predefined values
 */
export const createCategorySchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim(), // Remove whitespace
  
  type: z.enum(['FOOD', 'HYGIENE', 'CLOTHING', 'OTHER'] as const, {
    message: 'Type must be one of: FOOD, HYGIENE, CLOTHING, OTHER'
  })
});

/**
 * Schema for updating an existing category
 * 
 * All fields are optional to support partial updates.
 * The client can send only what they want to change.
 */
export const updateCategorySchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim()
    .optional(),
  
  type: z.enum(['FOOD', 'HYGIENE', 'CLOTHING', 'OTHER'])
    .optional()
});

/**
 * Schema for validating UUID parameters
 * Used in routes like GET /categories/:id
 */
export const categoryIdSchema = z.uuid({
  message: 'Invalid category ID format. Must be a valid UUID.'
});

/**
 * Schema for query parameters (filtering)
 * Used in routes like GET /categories?type=FOOD
 */
export const categoryQuerySchema = z.object({
  type: z.enum(['FOOD', 'HYGIENE', 'CLOTHING', 'OTHER']).optional()
});

// #endregion

// #region TypeScript Types

/**
 * Infer TypeScript types from Zod schemas
 * 
 * This is powerful because:
 * 1. Single source of truth (schema defines both validation and types)
 * 2. If validation changes, types automatically update
 * 3. No duplication between runtime and compile-time checks
 */
export type CreateCategoryDTO = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDTO = z.infer<typeof updateCategorySchema>;
export type CategoryIdDTO = z.infer<typeof categoryIdSchema>;
export type CategoryQueryDTO = z.infer<typeof categoryQuerySchema>;

/**
 * Response DTO - What the API returns to clients
 * 
 * This explicitly defines the API contract.
 * We control exactly what data clients see.
 */
export interface CategoryResponseDTO {
  id: string;
  name: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

// #endregion