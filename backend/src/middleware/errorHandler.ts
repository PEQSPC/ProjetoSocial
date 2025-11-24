import { Request, Response, NextFunction } from 'express';

import { AppError } from '../utils/errors.js';

/**
 * Global Error Handler Middleware
 * 
 * This middleware catches all errors thrown in the application
 * and formats them into consistent HTTP responses.
 * 
 * Error flow:
 * 1. Error occurs in controller/service/repository
 * 2. Error is passed to next(error)
 * 3. Express automatically forwards to error middleware
 * 4. We format and send appropriate response
 */

export const errorHandler =  (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error for debugging (in production, use proper logging service)
  console.error('Error occurred:', {
    name: error.name,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Handle our custom AppError instances
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        statusCode: error.statusCode,
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error.stack 
        }),
      },
    });
    return;
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: {
          message: 'A record with this value already exists',
          statusCode: 409,
        },
      });
      return;
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: {
          message: 'Record not found',
          statusCode: 404,
        },
      });
      return;
    }
  }
  // Handle unexpected errors (500)
  res.status(500).json({
    success: false,
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
      statusCode: 500,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack 
      }),
    },
  });
  
};

/**
 * 404 Not Found Handler
 * 
 * This middleware catches requests to non-existent routes
 */
export const notFoundHandler =  (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404,
    },
  });
 
};