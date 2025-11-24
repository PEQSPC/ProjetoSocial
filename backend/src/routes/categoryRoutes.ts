import { Router } from 'express';

import { CategoryController } from '../controllers/CategoryController.js';
import { CategoryService } from '../services/CategoryService.js';
import { CategoryRepository } from '../repository/categoryRepository.js';
import { prisma } from '../config/prisma.js'
import { authenticate, authorize } from '../middleware/auth.js';
/**
 * Category Routes
 * 
 * This file defines all HTTP endpoints for categories.
 * 
 * Route structure follows REST conventions:
 * - GET    /categories       → List all categories
 * - POST   /categories       → Create new category
 * - GET    /categories/:id   → Get specific category
 * - PUT    /categories/:id   → Update category
 * - DELETE /categories/:id   → Delete category
 * - GET    /categories/stats → Get statistics
 */

const router = Router();
// Dependency injection chain
// Database → Repository → Service → Controller
const categoryRepository = new CategoryRepository(prisma);
const categoryService = new CategoryService(categoryRepository);
const categoryController = new CategoryController(categoryService);

/**
 * Route definitions
 * 
 * Note: Stats route is before :id route to prevent "stats" being
 * interpreted as an ID parameter
 */

// GET /api/categories/stats - Get statistics
router.get('/stats', categoryController.getCategoryStatistics);

// GET /api/categories - Get all categories (with optional filtering)
router.get('/', categoryController.getAllCategories);

// POST /api/categories - Create new category
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  categoryController.createCategory
);

// GET /api/categories/:id - Get category by ID
router.get('/:id', categoryController.getCategoryById);

// PUT /api/categories/:id - Update category
router.put('/:id', categoryController.updateCategory);

// DELETE /api/categories/:id - Delete category
router.delete('/:id', categoryController.deleteCategory);

export default router;