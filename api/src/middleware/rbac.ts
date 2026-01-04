/**
 * RBAC (Role-Based Access Control) Middleware
 * Handles permission checking for API routes
 */

import { Context, Next } from 'hono';
import type { Env } from '../index';

export interface Permission {
  resource: string;
  action: string;
}

interface UserPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Permission levels by role (higher = more access)
 */
export const ROLE_LEVELS: Record<string, number> = {
  super_admin: 100,
  agency_admin: 80,
  agency_editor: 60,
  client_admin: 40,
  client_editor: 20,
  viewer: 10,
};

/**
 * Check if a user has a specific permission
 */
export const hasPermission = async (
  c: Context<{ Bindings: Env }>,
  userId: string,
  permission: string
): Promise<boolean> => {
  const result = await c.env.DB.prepare(`
    SELECT 1 FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    JOIN users u ON u.role_id = rp.role_id
    WHERE u.id = ? AND p.name = ?
    LIMIT 1
  `).bind(userId, permission).first();
  
  return !!result;
};

/**
 * Check if a user has permission for a resource action
 */
export const hasResourcePermission = async (
  c: Context<{ Bindings: Env }>,
  userId: string,
  resource: string,
  action: string
): Promise<boolean> => {
  return hasPermission(c, userId, `${resource}.${action}`);
};

/**
 * Get all permissions for a user
 */
export const getUserPermissions = async (
  c: Context<{ Bindings: Env }>,
  userId: string
): Promise<string[]> => {
  const results = await c.env.DB.prepare(`
    SELECT p.name FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    JOIN users u ON u.role_id = rp.role_id
    WHERE u.id = ?
  `).bind(userId).all();
  
  return (results.results || []).map((r: any) => r.name);
};

/**
 * Get user's role level
 */
export const getUserRoleLevel = async (
  c: Context<{ Bindings: Env }>,
  userId: string
): Promise<number> => {
  const result = await c.env.DB.prepare(`
    SELECT r.level FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = ?
  `).bind(userId).first();
  
  return (result?.level as number) || 0;
};

/**
 * Middleware factory that requires a specific permission
 */
export const requirePermission = (permission: string) => {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const user = c.get('user' as never) as UserPayload | undefined;
    
    if (!user?.sub) {
      return c.json({ error: 'Não autenticado' }, 401);
    }
    
    const allowed = await hasPermission(c, user.sub, permission);
    
    if (!allowed) {
      return c.json({ 
        error: 'Sem permissão para esta ação',
        required_permission: permission 
      }, 403);
    }
    
    await next();
  };
};

/**
 * Middleware factory that requires any of the specified permissions
 */
export const requireAnyPermission = (permissions: string[]) => {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const user = c.get('user' as never) as UserPayload | undefined;
    
    if (!user?.sub) {
      return c.json({ error: 'Não autenticado' }, 401);
    }
    
    for (const permission of permissions) {
      const allowed = await hasPermission(c, user.sub, permission);
      if (allowed) {
        await next();
        return;
      }
    }
    
    return c.json({ 
      error: 'Sem permissão para esta ação',
      required_permissions: permissions 
    }, 403);
  };
};

/**
 * Middleware factory that requires a minimum role level
 */
export const requireRoleLevel = (minLevel: number) => {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const user = c.get('user' as never) as UserPayload | undefined;
    
    if (!user?.sub) {
      return c.json({ error: 'Não autenticado' }, 401);
    }
    
    const userLevel = await getUserRoleLevel(c, user.sub);
    
    if (userLevel < minLevel) {
      return c.json({ 
        error: 'Nível de acesso insuficiente',
        required_level: minLevel,
        user_level: userLevel
      }, 403);
    }
    
    await next();
  };
};

/**
 * Middleware that requires super admin role
 */
export const requireSuperAdmin = requireRoleLevel(ROLE_LEVELS.super_admin);

/**
 * Middleware that requires agency admin or higher
 */
export const requireAgencyAdmin = requireRoleLevel(ROLE_LEVELS.agency_admin);

/**
 * Middleware that requires client admin or higher
 */
export const requireClientAdmin = requireRoleLevel(ROLE_LEVELS.client_admin);
