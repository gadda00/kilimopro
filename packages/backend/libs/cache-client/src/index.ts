/**
 * KilimoPRO Cache Client
 * Redis-based caching with TTL, patterns, and utilities
 */

import Redis from 'ioredis';
import { Logger, getLogger } from '@kilimopro/logger';

// Cache entry interface
export interface CacheEntry<T> {
  value: T;
  ttl: number; // seconds
  createdAt: Date;
  expiresAt: Date;
}

// Cache options
export interface CacheOptions {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  ttl?: number; // default TTL in seconds
  prefix?: string; // key prefix for namespacing
}

// Cache statistics
export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
  memoryUsage: number;
}

// Cache client interface
export interface CacheClient {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Basic operations
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  
  // Batch operations
  getMany<T>(keys: string[]): Promise<(T | null)[]>;
  setMany<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
  
  // Pattern operations
  keys(pattern: string): Promise<string[]>;
  scan(pattern: string, count?: number): Promise<string[]>;
  
  // Advanced operations
  getWithTTL<T>(key: string): Promise<{ value: T | null; ttl: number }>;
  increment(key: string, by?: number): Promise<number>;
  decrement(key: string, by?: number): Promise<number>;
  
  // TTL operations
  expire(key: string, ttl: number): Promise<void>;
  ttl(key: string): Promise<number>;
  persist(key: string): Promise<void>;
  
  // Cache invalidation
  invalidateByPattern(pattern: string): Promise<number>;
  invalidateByPrefix(prefix: string): Promise<number>;
  
  // Statistics
  getStats(): Promise<CacheStats>;
  resetStats(): void;
  
  // Health check
  healthCheck(): Promise<boolean>;
}

// Main cache client class
export class KilimoCacheClient implements CacheClient {
  private redis: Redis;
  private logger: Logger;
  private options: Required<CacheOptions>;
  
  // Statistics
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    hitRate: 0,
    memoryUsage: 0,
  };

  constructor(serviceName: string, options: CacheOptions = {}) {
    this.logger = getLogger(serviceName);
    
    this.options = {
      host: options.host || process.env.REDIS_HOST || 'localhost',
      port: options.port || parseInt(process.env.REDIS_PORT || '6379'),
      password: options.password || process.env.REDIS_PASSWORD,
      db: options.db || parseInt(process.env.REDIS_DB || '0'),
      ttl: options.ttl || 3600, // 1 hour default
      prefix: options.prefix || `${serviceName}:`,
    };

    this.redis = new Redis({
      host: this.options.host,
      port: this.options.port,
      password: this.options.password,
      db: this.options.db,
      retryStrategy: (times) => {
        const delay = Math.min(times * 100, 5000);
        return delay;
      },
    });

    // Set up error handlers
    this.setupErrorHandlers();
  }

  private setupErrorHandlers(): void {
    this.redis.on('error', (error) => {
      this.stats.errors++;
      this.logger.error('Redis error', { error: error as Error });
    });

    this.redis.on('connect', () => {
      this.logger.info('Redis connected');
    });

    this.redis.on('reconnecting', () => {
      this.logger.warn('Redis reconnecting');
    });

    this.redis.on('end', () => {
      this.logger.info('Redis connection closed');
    });
  }

  private getKey(key: string): string {
    return `${this.options.prefix}${key}`;
  }

  async connect(): Promise<void> {
    try {
      // Test connection
      await this.redis.ping();
      this.logger.info('Redis connection established');
    } catch (error) {
      this.logger.error('Redis connection failed', { error: error as Error });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
      this.logger.info('Redis disconnected');
    } catch (error) {
      this.logger.error('Redis disconnection failed', { error: error as Error });
      throw error;
    }
  }

  isConnected(): boolean {
    return this.redis.status === 'ready';
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.getKey(key);
      const value = await this.redis.get(fullKey);
      
      if (value === null) {
        this.stats.misses++;
        return null;
      }
      
      this.stats.hits++;
      return JSON.parse(value) as T;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache get failed', { key, error: error as Error });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const fullKey = this.getKey(key);
      const actualTTL = ttl ?? this.options.ttl;
      
      await this.redis.set(fullKey, JSON.stringify(value), 'EX', actualTTL);
      this.stats.sets++;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache set failed', { key, error: error as Error });
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const fullKey = this.getKey(key);
      await this.redis.del(fullKey);
      this.stats.deletes++;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache delete failed', { key, error: error as Error });
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.getKey(key);
      const result = await this.redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache exists check failed', { key, error: error as Error });
      return false;
    }
  }

  async getMany<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const fullKeys = keys.map(key => this.getKey(key));
      const values = await this.redis.mget(fullKeys);
      
      return values.map((value, index) => {
        if (value === null) {
          this.stats.misses++;
          return null;
        }
        this.stats.hits++;
        return JSON.parse(value) as T;
      });
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache getMany failed', { keys, error: error as Error });
      return keys.map(() => null);
    }
  }

  async setMany<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    try {
      const operations = entries.map(entry => {
        const fullKey = this.getKey(entry.key);
        const actualTTL = entry.ttl ?? this.options.ttl;
        return ['SET', fullKey, JSON.stringify(entry.value), 'EX', actualTTL];
      });
      
      await this.redis.multi(operations).exec();
      this.stats.sets += entries.length;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache setMany failed', { count: entries.length, error: error as Error });
      throw error;
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    try {
      const fullKeys = keys.map(key => this.getKey(key));
      await this.redis.del(fullKeys);
      this.stats.deletes += keys.length;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache deleteMany failed', { keys, error: error as Error });
      throw error;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      const fullPattern = `${this.options.prefix}${pattern}`;
      const keys = await this.redis.keys(fullPattern);
      return keys.map(key => key.replace(this.options.prefix, ''));
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache keys failed', { pattern, error: error as Error });
      return [];
    }
  }

  async scan(pattern: string, count: number = 100): Promise<string[]> {
    try {
      const fullPattern = `${this.options.prefix}${pattern}`;
      const keys: string[] = [];
      let cursor = '0';
      
      do {
        const [newCursor, batch] = await this.redis.scan(
          cursor,
          'MATCH',
          fullPattern,
          'COUNT',
          count.toString()
        );
        cursor = newCursor;
        keys.push(...batch.map(key => key.replace(this.options.prefix, '')));
      } while (cursor !== '0');
      
      return keys;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache scan failed', { pattern, error: error as Error });
      return [];
    }
  }

  async getWithTTL<T>(key: string): Promise<{ value: T | null; ttl: number }> {
    try {
      const fullKey = this.getKey(key);
      const [value, ttl] = await Promise.all([
        this.redis.get(fullKey),
        this.redis.ttl(fullKey),
      ]);
      
      if (value === null) {
        this.stats.misses++;
        return { value: null, ttl };
      }
      
      this.stats.hits++;
      return { value: JSON.parse(value) as T, ttl };
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache getWithTTL failed', { key, error: error as Error });
      return { value: null, ttl: -1 };
    }
  }

  async increment(key: string, by: number = 1): Promise<number> {
    try {
      const fullKey = this.getKey(key);
      const result = await this.redis.incrby(fullKey, by);
      return result;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache increment failed', { key, by, error: error as Error });
      throw error;
    }
  }

  async decrement(key: string, by: number = 1): Promise<number> {
    try {
      const fullKey = this.getKey(key);
      const result = await this.redis.decrby(fullKey, by);
      return result;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache decrement failed', { key, by, error: error as Error });
      throw error;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      const fullKey = this.getKey(key);
      await this.redis.expire(fullKey, ttl);
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache expire failed', { key, ttl, error: error as Error });
      throw error;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      const fullKey = this.getKey(key);
      return await this.redis.ttl(fullKey);
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache ttl failed', { key, error: error as Error });
      return -1;
    }
  }

  async persist(key: string): Promise<void> {
    try {
      const fullKey = this.getKey(key);
      await this.redis.persist(fullKey);
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache persist failed', { key, error: error as Error });
      throw error;
    }
  }

  async invalidateByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) return 0;
      
      await this.deleteMany(keys);
      return keys.length;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache invalidateByPattern failed', { pattern, error: error as Error });
      return 0;
    }
  }

  async invalidateByPrefix(prefix: string): Promise<number> {
    return this.invalidateByPattern(`${prefix}*`);
  }

  getStats(): Promise<CacheStats> {
    return Promise.resolve({
      ...this.stats,
      hitRate: this.stats.hits + this.stats.misses > 0 
        ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
        : 0,
    });
  }

  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      hitRate: 0,
      memoryUsage: 0,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      this.logger.error('Cache health check failed', { error: error as Error });
      return false;
    }
  }

  // Static method to create a client
  static create(serviceName: string, options?: CacheOptions): CacheClient {
    return new KilimoCacheClient(serviceName, options);
  }
}

// Global cache client instance
let globalCacheClient: CacheClient | null = null;

// Get or create global cache client
export function getCacheClient(serviceName: string): CacheClient {
  if (!globalCacheClient) {
    globalCacheClient = KilimoCacheClient.create(serviceName, {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : undefined,
      prefix: `${serviceName}:`,
    });
  }
  return globalCacheClient;
}

// Reset global cache client (useful for testing)
export function resetCacheClient(): void {
  globalCacheClient = null;
}

export { KilimoCacheClient as CacheClient };
