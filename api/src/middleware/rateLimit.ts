/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting requests per tenant/user/IP
 */

import { Context, Next } from 'hono';
import type { Env } from '../index';
import { getTenant } from './tenant';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (c: Context) => string;
  skipFailedRequests?: boolean;
  message?: string;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 100,
  message: 'Muitas requisições. Tente novamente em alguns minutos.',
};

/**
 * Generate rate limit key based on user, site, or IP
 */
const defaultKeyGenerator = (c: Context): string => {
  const user = c.get('user');
  const tenant = getTenant(c);
  
  if (user?.sub) {
    return `user:${user.sub}`;
  }
  
  if (tenant?.siteId) {
    return `site:${tenant.siteId}`;
  }
  
  const ip = c.req.header('CF-Connecting-IP') || 
             c.req.header('X-Forwarded-For') || 
             'unknown';
  return `ip:${ip}`;
};

/**
 * Clean up old rate limit entries
 */
const cleanupOldEntries = async (c: Context<{ Bindings: Env }>, windowMs: number): Promise<void> => {
  const cutoff = new Date(Date.now() - windowMs).toISOString();
  
  try {
    await c.env.DB.prepare(`
      DELETE FROM rate_limits WHERE window_start < ?
    `).bind(cutoff).run();
  } catch (error) {
    console.error('Failed to cleanup rate limits:', error);
  }
};

/**
 * Get current request count for identifier
 */
const getRequestCount = async (
  c: Context<{ Bindings: Env }>,
  identifier: string,
  identifierType: string,
  endpoint: string,
  windowMs: number
): Promise<number> => {
  const windowStart = new Date(Date.now() - windowMs).toISOString();
  
  const result = await c.env.DB.prepare(`
    SELECT request_count FROM rate_limits
    WHERE identifier = ? AND identifier_type = ? AND endpoint = ? AND window_start > ?
  `).bind(identifier, identifierType, endpoint, windowStart).first();
  
  return (result?.request_count as number) || 0;
};

/**
 * Increment request count for identifier
 */
const incrementRequestCount = async (
  c: Context<{ Bindings: Env }>,
  identifier: string,
  identifierType: string,
  endpoint: string
): Promise<void> => {
  const id = `rl_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  
  try {
    await c.env.DB.prepare(`
      INSERT INTO rate_limits (id, identifier, identifier_type, endpoint, request_count, window_start)
      VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(identifier, identifier_type, endpoint) 
      DO UPDATE SET request_count = request_count + 1
    `).bind(id, identifier, identifierType, endpoint).run();
  } catch (error) {
    console.error('Failed to increment rate limit:', error);
  }
};

/**
 * Rate limiting middleware factory
 */
export const rateLimit = (config: Partial<RateLimitConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const keyGenerator = finalConfig.keyGenerator || defaultKeyGenerator;
  
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const key = keyGenerator(c);
    const [identifierType, identifier] = key.includes(':') 
      ? key.split(':') 
      : ['unknown', key];
    
    const endpoint = new URL(c.req.url).pathname;
    
    await cleanupOldEntries(c, finalConfig.windowMs * 2);
    
    const currentCount = await getRequestCount(
      c, 
      identifier, 
      identifierType, 
      endpoint, 
      finalConfig.windowMs
    );
    
    if (currentCount >= finalConfig.maxRequests) {
      return c.json({
        error: finalConfig.message,
        retry_after: Math.ceil(finalConfig.windowMs / 1000),
      }, 429);
    }
    
    await incrementRequestCount(c, identifier, identifierType, endpoint);
    
    c.header('X-RateLimit-Limit', finalConfig.maxRequests.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, finalConfig.maxRequests - currentCount - 1).toString());
    c.header('X-RateLimit-Reset', new Date(Date.now() + finalConfig.windowMs).toISOString());
    
    await next();
  };
};

/**
 * Strict rate limit for sensitive endpoints (login, register)
 */
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: 'Muitas tentativas. Aguarde 15 minutos.',
});

/**
 * Standard rate limit for API endpoints
 */
export const standardRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 100,
  message: 'Limite de requisições atingido. Aguarde um minuto.',
});

/**
 * Relaxed rate limit for read-only endpoints
 */
export const relaxedRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 500,
  message: 'Limite de requisições atingido.',
});

/**
 * Upload rate limit for media endpoints
 */
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 20,
  message: 'Limite de uploads atingido. Aguarde um minuto.',
});
