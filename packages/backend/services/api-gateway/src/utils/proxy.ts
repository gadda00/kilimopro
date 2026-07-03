/**
 * Route Proxy Utility
 * Proxies requests to microservices
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { getLogger } from '@kilimopro/logger';
import { getCacheClient } from '@kilimopro/cache-client';
import { config } from '../config/index.js';
import { createInternalError } from '@kilimopro/shared-types';

const logger = getLogger('proxy');
const cache = getCacheClient('proxy');

interface ProxyOptions {
  service: keyof typeof config.services;
  path: string;
  cacheTtl?: number;
  cacheKey?: (req: FastifyRequest) => string;
  transformRequest?: (req: FastifyRequest) => any;
  transformResponse?: (res: any) => any;
}

export function createProxyRoute(options: ProxyOptions) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { service, path, cacheTtl, cacheKey, transformRequest, transformResponse } = options;
    const serviceUrl = config.services[service];
    
    if (!serviceUrl) {
      throw createInternalError(`Service ${service} not configured`);
    }

    try {
      // Generate cache key if caching is enabled
      let cacheKeyValue: string | undefined;
      if (cacheTtl && cacheKey) {
        cacheKeyValue = cacheKey(request);
        const cached = await cache.get<any>(cacheKeyValue);
        if (cached) {
          logger.debug('Cache hit', { cacheKey: cacheKeyValue });
          return transformResponse ? transformResponse(cached) : cached;
        }
      }

      // Build URL
      const url = new URL(path, serviceUrl);
      
      // Copy query parameters
      if (request.query) {
        Object.entries(request.query).forEach(([key, value]) => {
          if (value !== undefined) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      // Build request options
      const requestOptions: RequestInit = {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...(request.headers as any),
        },
      };

      // Remove headers that shouldn't be forwarded
      delete requestOptions.headers.host;
      delete requestOptions.headers['content-length'];

      // Add authentication if user is authenticated
      if (request.user) {
        requestOptions.headers['X-User-ID'] = request.user.userId;
        requestOptions.headers['X-User-Role'] = request.user.role;
      }

      // Add body for non-GET requests
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        const body = transformRequest ? transformRequest(request) : request.body;
        requestOptions.body = JSON.stringify(body);
      }

      logger.debug('Proxying request', {
        method: request.method,
        url: url.toString(),
        service,
      });

      // Make request to microservice
      const response = await fetch(url.toString(), requestOptions);
      
      if (!response.ok) {
        const error = await response.text();
        logger.error('Proxy request failed', {
          status: response.status,
          error,
          url: url.toString(),
        });
        
        // Return the error from the microservice
        reply.status(response.status);
        return { error };
      }

      const data = await response.json();
      
      // Cache response if caching is enabled
      if (cacheTtl && cacheKeyValue) {
        await cache.set(cacheKeyValue, data, cacheTtl);
        logger.debug('Cached response', { cacheKey: cacheKeyValue, ttl: cacheTtl });
      }

      // Transform response if needed
      const result = transformResponse ? transformResponse(data) : data;
      
      logger.debug('Proxy request successful', {
        status: response.status,
        service,
        path,
      });

      return result;
    } catch (error) {
      logger.error('Proxy error', {
        error: error as Error,
        service,
        path,
      });
      throw createInternalError('Service unavailable');
    }
  };
}

// Create cache key from request
export function createCacheKey(prefix: string) {
  return (req: FastifyRequest) => {
    const parts = [prefix];
    
    // Add path
    parts.push(req.url.split('?')[0]);
    
    // Add query parameters (sorted for consistency)
    if (req.query && Object.keys(req.query).length > 0) {
      const sortedQuery = Object.entries(req.query)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      parts.push(sortedQuery);
    }
    
    // Add user ID if authenticated
    if (req.user) {
      parts.push(`user:${req.user.userId}`);
    }
    
    return parts.join(':');
  };
}
