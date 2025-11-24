/**
 * Token Blacklist Service
 * 
 * Stores invalidated tokens (logout, password change)
 * In production, use Redis with TTL for automatic cleanup
 */

import { ITokenBlacklistService } from "./interfaces/ITokenBlacklistService.js";

// #region In-Memory Blacklist (Development)
class TokenBlacklistService implements ITokenBlacklistService {
  private blacklist: Set<string> = new Set();

  /**
   * Add token to blacklist
   */
  addToken(token: string): void {
    this.blacklist.add(token);
  }

  /**
   * Check if token is blacklisted
   */
  isBlacklisted(token: string): boolean {
    return this.blacklist.has(token);
  }

  /**
   * Remove token from blacklist
   * (Called when token naturally expires)
   */
  removeToken(token: string): void {
    this.blacklist.delete(token);
  }

  /**
   * Clear all blacklisted tokens
   * (For testing)
   */
  clear(): void {
    this.blacklist.clear();
  }

  /**
   * Get blacklist size
   */
  size(): number {
    return this.blacklist.size;
  }
}

export const tokenBlacklistService = new TokenBlacklistService();
// #endregion

// #region Redis Blacklist (Production)
/**
 * Production implementation using Redis:
 * 
 * import { redisClient } from '../config/redis';
 * 
 * class RedisTokenBlacklistService {
 *   async addToken(token: string, expiresIn: number): Promise<void> {
 *     await redisClient.setex(`blacklist:${token}`, expiresIn, '1');
 *   }
 * 
 *   async isBlacklisted(token: string): Promise<boolean> {
 *     const result = await redisClient.get(`blacklist:${token}`);
 *     return result !== null;
 *   }
 * }
 */
// #endregion