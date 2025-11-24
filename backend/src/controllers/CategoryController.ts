import { Request, Response, NextFunction } from 'express';

import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  categoryQuerySchema,
  CategoryResponseDTO,
} from '../types/dto/category.dto.js';
import { ValidationError } from '../utils/errors.js';
import { ICategoryService } from 'services/interfaces/ICategoryService.js';
//import { prisma } from '../config/prisma.js';

/**
 * Category Controller
 * 
 * The controller handles HTTP-specific concerns:
 * 1. Parse and validate request data
 * 2. Call appropriate service methods
 * 3. Format responses
 * 4. Handle HTTP status codes
 * 
 * The controller doesn't contain business logic.
 * It's a thin layer that translates HTTP to domain operations.
 * 
 * Notice: Controller depends on ICategoryService interface,
 * not the concrete CategoryService class.
 */

export class CategoryController {
  constructor(private readonly categoryService: ICategoryService) {}

  /**
   * Create a new category
   * POST /api/categories
   * 
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  createCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate request body
      const validatedData = createCategorySchema.parse(req.body);

      // Call service
      const category = await this.categoryService.createCategory(validatedData);

      // Format response
      const dto: CategoryResponseDTO = category.toDTO();
      // Send response
      res.status(201).json({
        success: true,
        data: dto,
        message: 'Category created successfully',
      });
    } catch (error: any) {
      // Zod validation errors
      if (error.name === 'ZodError') {
        next(new ValidationError('Invalid request data', error.errors));
        return;
      }
      // Pass other errors to error middleware
      next(error);
    }
  };

  /**
   * Get category by ID
   * GET /api/categories/:id
   * 
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  getCategoryById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate route parameter
      const id = categoryIdSchema.parse(req.params.id);

      // Call service
      const category = await this.categoryService.getCategoryById(id);

      // Format response
      const dto: CategoryResponseDTO = category.toDTO();
      // Send response
      res.status(200).json({
        success: true,
        data: dto,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        next(new ValidationError('Invalid category ID', error.errors));
        return;
      }
      next(error);
    }
  };

  /**
   * Get all categories
   * GET /api/categories
   * Query params: ?type=FOOD
   * 
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  getAllCategories = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate query parameters
      const query = categoryQuerySchema.parse(req.query);

      // Call service
      const categories = await this.categoryService.getAllCategories(query);

      // Format response
      const dto = categories.map(cat => cat.toDTO());
      // Send response
      res.status(200).json({
        success: true,
        data: dto,
        count: dto.length,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        next(new ValidationError('Invalid query parameters', error.errors));
        return;
      }
      next(error);
    }
  };

  /**
   * Update category
   * PUT /api/categories/:id
   * 
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  updateCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate route parameter
      const id = categoryIdSchema.parse(req.params.id);

      // Validate request body
      const validatedData = updateCategorySchema.parse(req.body);

      // Check if there's actually data to update
      if (Object.keys(validatedData).length === 0) {
        next(new ValidationError('No fields to update provided'));
        return;
      }

      // Call service
      const category = await this.categoryService.updateCategory(id, validatedData);

      // Format response
      const dto: CategoryResponseDTO = category.toDTO();
      // Send response
      res.status(200).json({
        success: true,
        data: dto,
        message: 'Category updated successfully',
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        next(new ValidationError('Invalid request data', error.errors));
        return;
      }
      next(error);
    }
  };

  /**
   * Delete category
   * DELETE /api/categories/:id
   * 
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  deleteCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate route parameter
      const id = categoryIdSchema.parse(req.params.id);

      // Call service
      await this.categoryService.deleteCategory(id);

      // Send response (204 No Content)
      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        next(new ValidationError('Invalid category ID', error.errors));
        return;
      }
      next(error);
    }
  };

  /**
   * Get category statistics
   * GET /api/categories/stats
   * 
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  getCategoryStatistics = async (
    _: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stats = await this.categoryService.getCategoryStatistics();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}