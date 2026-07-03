/**
 * KilimoPRO Database Client
 * Prisma client wrapper with connection pooling, transactions, and utilities
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { Logger, getLogger } from '@kilimopro/logger';

// Prisma client singleton
declare global {
  var prisma: PrismaClient | undefined;
}

// Prisma client options
export interface PrismaClientOptions {
  logLevel?: 'info' | 'query' | 'warn' | 'error';
  maxRetries?: number;
  retryTimeout?: number;
}

// Database client interface
export interface DatabaseClient {
  prisma: PrismaClient;
  logger: Logger;
  
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  
  // Transaction helpers
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T>;
  batchTransaction<T>(operations: Array<() => Promise<T>>, batchSize?: number): Promise<T[]>;
  
  // Query helpers
  paginate<T>(
    model: any,
    args: any,
    page: number,
    limit: number
  ): Promise<{ data: T[]; total: number; page: number; limit: number }>;
  
  // Health check
  healthCheck(): Promise<boolean>;
  
  // Metrics
  getMetrics(): Promise<{
    totalQueries: number;
    slowQueries: number;
    errors: number;
    avgQueryTime: number;
  }>;
}

// Main database client class
export class KilimoDatabaseClient implements DatabaseClient {
  public prisma: PrismaClient;
  public logger: Logger;
  
  private queryCount: number = 0;
  private slowQueryCount: number = 0;
  private errorCount: number = 0;
  private totalQueryTime: number = 0;
  private slowQueryThreshold: number = 1000; // ms

  constructor(
    private serviceName: string,
    options: PrismaClientOptions = {}
  ) {
    this.logger = getLogger(serviceName);
    
    // Create Prisma client
    this.prisma = new PrismaClient({
      log: options.logLevel ? [options.logLevel] : ['error'],
      errorFormat: 'colorless',
    });

    // Set up middleware for logging and metrics
    this.setupMiddleware();
  }

  private setupMiddleware(): void {
    this.prisma.$use(async (params, next) => {
      const start = Date.now();
      const result = await next(params);
      const duration = Date.now() - start;
      
      this.queryCount++;
      this.totalQueryTime += duration;
      
      if (duration > this.slowQueryThreshold) {
        this.slowQueryCount++;
        this.logger.warn(`Slow query: ${params.model}.${params.action}`, {
          duration,
          query: params,
        });
      }
      
      return result;
    });

    this.prisma.$use(async (params, next) => {
      try {
        return await next(params);
      } catch (error) {
        this.errorCount++;
        this.logger.error('Database error', {
          error: error as Error,
          query: params,
        });
        throw error;
      }
    });
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.logger.info('Database connected');
    } catch (error) {
      this.logger.error('Database connection failed', { error: error as Error });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.logger.info('Database disconnected');
    } catch (error) {
      this.logger.error('Database disconnection failed', { error: error as Error });
      throw error;
    }
  }

  async transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return fn(tx);
    });
  }

  async batchTransaction<T>(
    operations: Array<() => Promise<T>>,
    batchSize: number = 100
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await this.prisma.$transaction(
        batch.map(op => op())
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  async paginate<T>(
    model: any,
    args: any,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: T[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      model.findMany({ ...args, skip, take: limit }),
      model.count({ where: args.where }),
    ]);
    
    return {
      data: data as T[],
      total,
      page,
      limit,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Health check failed', { error: error as Error });
      return false;
    }
  }

  getMetrics(): Promise<{
    totalQueries: number;
    slowQueries: number;
    errors: number;
    avgQueryTime: number;
  }> {
    return Promise.resolve({
      totalQueries: this.queryCount,
      slowQueries: this.slowQueryCount,
      errors: this.errorCount,
      avgQueryTime: this.queryCount > 0 ? this.totalQueryTime / this.queryCount : 0,
    });
  }

  // Static method to create a client
  static create(serviceName: string, options?: PrismaClientOptions): DatabaseClient {
    return new KilimoDatabaseClient(serviceName, options);
  }
}

// Global database client instance
let globalDbClient: DatabaseClient | null = null;

// Get or create global database client
export function getDatabaseClient(serviceName: string): DatabaseClient {
  if (!globalDbClient) {
    globalDbClient = KilimoDatabaseClient.create(serviceName, {
      logLevel: process.env.NODE_ENV === 'development' ? 'info' : 'error',
    });
  }
  return globalDbClient;
}

// Reset global database client (useful for testing)
export function resetDatabaseClient(): void {
  globalDbClient = null;
}

export { KilimoDatabaseClient as DatabaseClient };
