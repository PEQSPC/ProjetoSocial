import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
//import 'express-async-errors'; // Allows async/await in route handlers

import categoryRoutes from './routes/categoryRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { cacheService } from './services/CacheService.js';
import { prisma } from './config/prisma.js';
import authRoutes from './routes/authRoutes.js';
// Load environment variables
dotenv.config();

/**
 * Express Application Setup
 * 
 * This is the entry point of our API.
 * We configure middleware, routes, and error handling here.
 */

const app: Application = express();
const PORT = process.env.PORT || 3000;

// #region Middleware

/**
 * Security middleware (helmet)
 * Sets various HTTP headers for security
 */
app.use(helmet());

/**
 * CORS middleware
 * Allows cross-origin requests (configure based on your needs)
 */
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));

/**
 * Body parser middleware
 * Parses incoming JSON payloads
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// #endregion

// #region Routes

/**
 * Health check endpoint
 * Used by load balancers and monitoring systems
 */
app.get('/health', async (_, res) => {
  const dbHealthy = await prisma.$queryRaw`SELECT 1`;
  
  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: dbHealthy ? 'connected' : 'disconnected',
  });
});

// Add this route before your API routes
app.get('/cache/stats', (_, res) => {
  const stats = cacheService.getStats();
  
  res.json({
    success: true,
    data: {
      ...stats,
      hitRate: stats.hits / (stats.hits + stats.misses) || 0,
    },
  });
});

// Optional: Add cache clear endpoint (protect in production!)
app.post('/cache/clear', (_, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({
      success: false,
      error: 'Cache clearing is disabled in production',
    });
    return;
  }
  
  cacheService.clear();
  
  res.json({
    success: true,
    message: 'All cache cleared',
  });
});

/**
 * API Routes
 * Mount all API routes under /api prefix
 */
app.use('/api/categories', categoryRoutes);

/**
 * Authentication Routes
 * Handles user registration, login, and token refresh
 */
app.use('/api/auth', authRoutes);

// #endregion

// #region Error Handling

/**
 * 404 handler - catches requests to non-existent routes
 * Must come after all valid routes
 */
app.use(notFoundHandler);

/**
 * Global error handler - catches all errors
 * Must be the last middleware
 */
app.use(errorHandler);

// #endregion

// #region Server Startup

/**
 * Start server
 */
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   Food Bank Management System API  v1.0   ║
╠═══════════════════════════════════════════╣
║  Environment: ${process.env.NODE_ENV?.padEnd(27)} ║
║  Port: ${PORT.toString().padEnd(34)} ║
║  Status: Running                          ║
╚═══════════════════════════════════════════╝
  `);
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Categories API: http://localhost:${PORT}/api/categories`);
});

/**
 * Graceful shutdown
 * Properly close connections when server stops
 */
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('HTTP server closed');
    
    await prisma.$disconnect();
    console.log('Database connection closed');
    
    console.log('Graceful shutdown completed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// #endregion

export default app;