/**
 * Audit Logging Middleware
 * Records all important actions for security and compliance
 */

import { Context } from 'hono';
import type { Env } from '../index';
import { getTenant } from './tenant';

interface UserPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
}

export interface AuditLogEntry {
  userId?: string;
  siteId?: string;
  organizationId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Generate a unique ID for audit log entries
 */
const generateAuditId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `audit_${timestamp}_${random}`;
};

/**
 * Log an action to the audit log
 */
export const logAudit = async (
  c: Context<{ Bindings: Env }>,
  entry: AuditLogEntry
): Promise<void> => {
  try {
    const user = c.get('user' as never) as UserPayload | undefined;
    const tenant = getTenant(c);
    
    const id = generateAuditId();
    const userId = entry.userId || user?.sub;
    const siteId = entry.siteId || tenant?.siteId;
    const organizationId = entry.organizationId || tenant?.organizationId;
    const ipAddress = entry.ipAddress || c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For');
    const userAgent = entry.userAgent || c.req.header('User-Agent');
    
    await c.env.DB.prepare(`
      INSERT INTO audit_logs (
        id, user_id, site_id, organization_id, action, resource_type,
        resource_id, resource_name, old_value, new_value, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      userId || null,
      siteId || null,
      organizationId || null,
      entry.action,
      entry.resourceType,
      entry.resourceId || null,
      entry.resourceName || null,
      entry.oldValue ? JSON.stringify(entry.oldValue) : null,
      entry.newValue ? JSON.stringify(entry.newValue) : null,
      ipAddress || null,
      userAgent || null
    ).run();
  } catch (error) {
    console.error('Failed to log audit entry:', error);
  }
};

/**
 * Log a create action
 */
export const logCreate = async (
  c: Context<{ Bindings: Env }>,
  resourceType: string,
  resourceId: string,
  resourceName?: string,
  newValue?: any
): Promise<void> => {
  await logAudit(c, {
    action: 'create',
    resourceType,
    resourceId,
    resourceName,
    newValue,
  });
};

/**
 * Log an update action
 */
export const logUpdate = async (
  c: Context<{ Bindings: Env }>,
  resourceType: string,
  resourceId: string,
  resourceName?: string,
  oldValue?: any,
  newValue?: any
): Promise<void> => {
  await logAudit(c, {
    action: 'update',
    resourceType,
    resourceId,
    resourceName,
    oldValue,
    newValue,
  });
};

/**
 * Log a delete action
 */
export const logDelete = async (
  c: Context<{ Bindings: Env }>,
  resourceType: string,
  resourceId: string,
  resourceName?: string,
  oldValue?: any
): Promise<void> => {
  await logAudit(c, {
    action: 'delete',
    resourceType,
    resourceId,
    resourceName,
    oldValue,
  });
};

/**
 * Log a login action
 */
export const logLogin = async (
  c: Context<{ Bindings: Env }>,
  userId: string,
  email: string,
  success: boolean
): Promise<void> => {
  await logAudit(c, {
    userId,
    action: success ? 'login' : 'login_failed',
    resourceType: 'auth',
    resourceId: userId,
    resourceName: email,
  });
};

/**
 * Log a logout action
 */
export const logLogout = async (
  c: Context<{ Bindings: Env }>,
  userId: string
): Promise<void> => {
  await logAudit(c, {
    userId,
    action: 'logout',
    resourceType: 'auth',
    resourceId: userId,
  });
};

/**
 * Log a publish action
 */
export const logPublish = async (
  c: Context<{ Bindings: Env }>,
  resourceType: string,
  resourceId: string,
  resourceName?: string,
  published: boolean = true
): Promise<void> => {
  await logAudit(c, {
    action: published ? 'publish' : 'unpublish',
    resourceType,
    resourceId,
    resourceName,
  });
};

/**
 * Get audit logs with filters
 */
export const getAuditLogs = async (
  c: Context<{ Bindings: Env }>,
  filters: {
    siteId?: string;
    organizationId?: string;
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ logs: any[]; total: number }> => {
  let whereClause = '1=1';
  const params: any[] = [];
  
  if (filters.siteId) {
    whereClause += ' AND site_id = ?';
    params.push(filters.siteId);
  }
  
  if (filters.organizationId) {
    whereClause += ' AND organization_id = ?';
    params.push(filters.organizationId);
  }
  
  if (filters.userId) {
    whereClause += ' AND user_id = ?';
    params.push(filters.userId);
  }
  
  if (filters.action) {
    whereClause += ' AND action = ?';
    params.push(filters.action);
  }
  
  if (filters.resourceType) {
    whereClause += ' AND resource_type = ?';
    params.push(filters.resourceType);
  }
  
  if (filters.startDate) {
    whereClause += ' AND created_at >= ?';
    params.push(filters.startDate);
  }
  
  if (filters.endDate) {
    whereClause += ' AND created_at <= ?';
    params.push(filters.endDate);
  }
  
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  
  const countResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM audit_logs WHERE ${whereClause}
  `).bind(...params).first();
  
  const logsResult = await c.env.DB.prepare(`
    SELECT al.*, u.name as user_name, u.email as user_email
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE ${whereClause}
    ORDER BY al.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...params, limit, offset).all();
  
  return {
    logs: logsResult.results || [],
    total: (countResult?.total as number) || 0,
  };
};
