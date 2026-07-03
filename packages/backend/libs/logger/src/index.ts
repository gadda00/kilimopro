/**
 * KilimoPRO Logger
 * Structured logging with context, levels, and request tracking
 */

import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';
import { RequestContext } from '@kilimopro/shared-types';

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  SILENT = 'silent',
}

// Log entry interface
export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: RequestContext;
  timestamp: string;
  service?: string;
  version?: string;
  error?: Error;
  meta?: Record<string, any>;
  requestId?: string;
  userId?: string;
  duration?: number;
}

// Logger interface
export interface Logger {
  debug(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string | Error, meta?: Record<string, any>): void;
  child(context: Partial<RequestContext>): Logger;
  withContext(context: RequestContext): Logger;
  startTimer(): () => number;
}

// Main logger class
export class KilimoLogger implements Logger {
  private winstonLogger: WinstonLogger;
  private context: Partial<RequestContext> = {};
  private serviceName: string;
  private serviceVersion: string;

  constructor(
    serviceName: string,
    serviceVersion: string = '1.0.0',
    level: LogLevel = LogLevel.INFO
  ) {
    this.serviceName = serviceName;
    this.serviceVersion = serviceVersion;

    // Create Winston logger
    this.winstonLogger = createLogger({
      level,
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
      ),
      defaultMeta: {
        service: serviceName,
        version: serviceVersion,
      },
      transports: [
        new transports.Console(),
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log' }),
      ],
      exitOnError: false,
    });

    // Add colors for console output
    if (process.env.NODE_ENV !== 'production') {
      this.winstonLogger.add(
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple()
          ),
        })
      );
    }
  }

  private formatMessage(message: string, meta?: Record<string, any>): LogEntry {
    const entry: LogEntry = {
      level: this.getLevelFromString(this.winstonLogger.level),
      message,
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      version: this.serviceVersion,
      requestId: this.context.requestId,
      userId: this.context.userId,
      meta,
    };

    if (this.context.userRole) {
      entry.meta = { ...entry.meta, userRole: this.context.userRole };
    }

    return entry;
  }

  private getLevelFromString(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      default: return LogLevel.INFO;
    }
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.winstonLogger.debug(message, this.formatMessage(message, meta));
  }

  info(message: string, meta?: Record<string, any>): void {
    this.winstonLogger.info(message, this.formatMessage(message, meta));
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.winstonLogger.warn(message, this.formatMessage(message, meta));
  }

  error(message: string | Error, meta?: Record<string, any>): void {
    if (message instanceof Error) {
      this.winstonLogger.error(message.message, {
        ...this.formatMessage(message.message, meta),
        error: message,
        stack: message.stack,
      });
    } else {
      this.winstonLogger.error(message, this.formatMessage(message, meta));
    }
  }

  child(context: Partial<RequestContext>): Logger {
    const childLogger = new KilimoLogger(
      this.serviceName,
      this.serviceVersion,
      this.winstonLogger.level as LogLevel
    );
    childLogger.context = { ...this.context, ...context };
    return childLogger;
  }

  withContext(context: RequestContext): Logger {
    return this.child(context);
  }

  startTimer(): () => number {
    const start = process.hrtime.bigint();
    return () => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1_000_000; // Convert to ms
      return duration;
    };
  }

  // Static method to create a logger
  static create(serviceName: string, serviceVersion?: string, level?: LogLevel): Logger {
    return new KilimoLogger(serviceName, serviceVersion, level);
  }
}

// Global logger instance (can be overridden)
let globalLogger: Logger | null = null;

// Get or create global logger
export function getLogger(serviceName: string, serviceVersion?: string): Logger {
  if (!globalLogger) {
    globalLogger = KilimoLogger.create(
      serviceName,
      serviceVersion,
      (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO
    );
  }
  return globalLogger;
}

// Reset global logger (useful for testing)
export function resetLogger(): void {
  globalLogger = null;
}

// Create a logger with request context
export function createRequestLogger(
  serviceName: string,
  context: RequestContext
): Logger {
  const logger = KilimoLogger.create(serviceName);
  return logger.withContext(context);
}

export { KilimoLogger as Logger };
