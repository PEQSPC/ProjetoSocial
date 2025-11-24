import NodeCache from 'node-cache';

/**
 * Cache Service
 * 
 * This service provides a consistent interface for caching operations.
 * It abstracts the caching implementation, so we can easily swap
 * node-cache for Redis later without changing business code.
 * 
 * Benefits:
 * - Reduces database queries for frequently accessed data
 * - Improves response times
 * - Decreases server load
 * - Provides predictable performance
 */

export class CacheService {
  private cache: NodeCache;

  constructor(
    /**
     * TTL (Time To Live) in seconds
     * How long cached data remains valid before expiring
     */
    private readonly defaultTtl: number = Number(process.env.CACHE_TTL) || 300, // 5 minutes default
    
    /**
     * Check period in seconds
     * How often to check for expired keys
     */
    private readonly checkPeriod: number = Number(process.env.CACHE_CHECK_PERIOD) || 600 // 10 minutes
  ) {
    this.cache = new NodeCache({
      stdTTL: defaultTtl,
      checkperiod: checkPeriod,
      useClones: true, // Clone objects to prevent accidental mutation
    });

    // Log cache events in development
    if (process.env.NODE_ENV === 'development') {
      this.cache.on('set', (key, value) => {
        console.log(`[Cache] SET: ${key}`);
      });

      this.cache.on('expired', (key, value) => {
        console.log(`[Cache] EXPIRED: ${key}`);
      });

      this.cache.on('del', (key, value) => {
        console.log(`[Cache] DELETE: ${key}`);
      });
    }
  }

  /**
   * Get value from cache
   * 
   * @param key - Cache key
   * @returns Cached value or undefined if not found/expired
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Set value in cache
   * 
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Optional custom TTL (overrides default)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    this.cache.set(key, value, ttl || this.defaultTtl);
  }

  /**
   * Delete specific key from cache
   * 
   * @param key - Cache key to delete
   */
  delete(key: string): void {
    this.cache.del(key);
  }

  /**
   * Delete multiple keys matching a pattern
   * 
   * @param pattern - String pattern to match (e.g., 'category:*')
   */
  deletePattern(pattern: string): void {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter(key => 
      key.includes(pattern.replace('*', ''))
    );
    
    if (matchingKeys.length > 0) {
      this.cache.del(matchingKeys);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.flushAll();
    console.log('[Cache] All cache cleared');
  }

  /**
   * Check if key exists in cache
   * 
   * @param key - Cache key
   * @returns true if key exists and hasn't expired
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get cache statistics
   * 
   * Useful for monitoring and debugging
   */
  getStats() {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
      ksize: this.cache.getStats().ksize,
      vsize: this.cache.getStats().vsize,
    };
  }

  /**
   * Get or set pattern (cache-aside pattern)
   * 
   * This is the most common caching pattern:
   * 1. Try to get from cache
   * 2. If not found, fetch from source
   * 3. Store in cache for next time
   * 4. Return the data
   * 
   * @param key - Cache key
   * @param fetchFn - Function to fetch data if not cached
   * @param ttl - Optional TTL
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = this.get<T>(key);
    
    if (cached !== undefined) {
      console.log(`[Cache] HIT: ${key}`);
      return cached;
    }

    // Cache miss - fetch from source
    console.log(`[Cache] MISS: ${key}`);
    const data = await fetchFn();

    // Store in cache
    this.set(key, data, ttl);

    return data;
  }
}

// Export singleton instance
export const cacheService = new CacheService(
  parseInt(process.env.CACHE_TTL || '300', 10), // 5 minutes default
  parseInt(process.env.CACHE_CHECK_PERIOD || '600', 10) // 10 minutes
);