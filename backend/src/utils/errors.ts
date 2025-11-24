/**
 * Custom Error Classes
 * 
 * These errors carry semantic meaning that helps:
 * 1. Error middleware map errors to HTTP status codes
 * 2. Services communicate error conditions clearly
 * 3. Developers understand what went wrong
 */

export abstract class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

/**
 * 404 Not Found
 * Resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * 409 Conflict
 * Operation conflicts with current state
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

/**
 * 400 Bad Request
 * Invalid request data
 */
export class ValidationError extends AppError {
  constructor(
    message: string = 'Validation failed',
    public readonly errors?: any[]
  ) {
    super(message, 400);
  }
}

/**
 * 401 Unauthorized
 * Authentication missing or invalid
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

/**
 * 403 Forbidden
 * User lacks permission
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

/**
 * 500 Internal Server Error
 * Unexpected errors (indicates a bug)
 */
export class InternalError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, false);
  }
}