/**
 * Tenant Middleware
 * Extracts and validates site_id from request context
 */

import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { getCookie } from 'hono/cookie';
import type { Env } from '../index';

export interface TenantContext {
  siteId: string;
  organizationId: string;
  userRole: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  exp: number;
}

/**
 * Middleware that extracts site_id from X-Site-Id header
 * and validates user has access to the site.
 * 
 * Sets tenant context with siteId, organizationId, and userRole.
 * 
 * If no X-Site-Id header is provided, defaults to 'site_default'
 * for backward compatibility.
 */
export const tenantMiddleware = async (c: Context<{ Bindings: Env }>, next: Next) => {
  try {
    const token = getCookie(c, 'auth_token') || c.req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: 'Nao autenticado' }, 401);
    }
    
    const payload = await verify(token, c.env.JWT_SECRET) as unknown as JWTPayload;
    c.set('user' as never, payload as never);
    
    // Get site_id from header or default to 'site_default'
    const siteId = c.req.header('X-Site-Id') || 'site_default';
    
    // Validate user has access to this site
    const access = await c.env.DB.prepare(`
      SELECT s.organization_id, COALESCE(su.role, ou.role) as role
      FROM sites s
      LEFT JOIN site_users su ON s.id = su.site_id AND su.user_id = ?
      LEFT JOIN organization_users ou ON s.organization_id = ou.organization_id AND ou.user_id = ?
      WHERE s.id = ? AND s.is_active = 1 AND (su.user_id IS NOT NULL OR ou.user_id IS NOT NULL)
    `).bind(payload.sub, payload.sub, siteId).first();
    
    if (!access) {
      return c.json({ error: 'Sem acesso a este site' }, 403);
    }
    
    // Set tenant context
    c.set('tenant' as never, {
      siteId,
      organizationId: access.organization_id,
      userRole: access.role,
    } as never);
    
    await next();
  } catch (error) {
    return c.json({ error: 'Token invalido' }, 401);
  }
};

/**
 * Helper function to get tenant context from request
 */
export const getTenant = (c: Context): TenantContext => {
  return c.get('tenant') as TenantContext;
};

/**
 * Helper function to get site_id from tenant context
 */
export const getSiteId = (c: Context): string => {
  const tenant = c.get('tenant') as TenantContext;
  return tenant?.siteId || 'site_default';
};
