/**
 * Audit Logs Routes
 * API endpoints for viewing audit logs
 */

import { Hono } from 'hono';
import type { Env } from '../index';
import { tenantMiddleware, getTenant } from '../middleware/tenant';
import { requirePermission } from '../middleware/rbac';
import { getAuditLogs } from '../middleware/audit';

const audit = new Hono<{ Bindings: Env }>();

audit.use('/*', tenantMiddleware);

audit.get('/', requirePermission('audit.read'), async (c) => {
  try {
    const tenant = getTenant(c);
    const url = new URL(c.req.url);
    
    const filters = {
      siteId: url.searchParams.get('site_id') || tenant.siteId,
      organizationId: url.searchParams.get('organization_id') || tenant.organizationId,
      userId: url.searchParams.get('user_id') || undefined,
      action: url.searchParams.get('action') || undefined,
      resourceType: url.searchParams.get('resource_type') || undefined,
      startDate: url.searchParams.get('start_date') || undefined,
      endDate: url.searchParams.get('end_date') || undefined,
      limit: parseInt(url.searchParams.get('limit') || '50'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
    };
    
    const result = await getAuditLogs(c, filters);
    
    return c.json({
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: filters.offset + result.logs.length < result.total,
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return c.json({ error: 'Erro ao buscar logs de auditoria' }, 500);
  }
});

audit.get('/actions', requirePermission('audit.read'), async (c) => {
  try {
    const tenant = getTenant(c);
    
    const result = await c.env.DB.prepare(`
      SELECT DISTINCT action, COUNT(*) as count
      FROM audit_logs
      WHERE site_id = ? OR organization_id = ?
      GROUP BY action
      ORDER BY count DESC
    `).bind(tenant.siteId, tenant.organizationId).all();
    
    return c.json({
      success: true,
      data: result.results || [],
    });
  } catch (error) {
    console.error('Error fetching audit actions:', error);
    return c.json({ error: 'Erro ao buscar ações de auditoria' }, 500);
  }
});

audit.get('/resources', requirePermission('audit.read'), async (c) => {
  try {
    const tenant = getTenant(c);
    
    const result = await c.env.DB.prepare(`
      SELECT DISTINCT resource_type, COUNT(*) as count
      FROM audit_logs
      WHERE site_id = ? OR organization_id = ?
      GROUP BY resource_type
      ORDER BY count DESC
    `).bind(tenant.siteId, tenant.organizationId).all();
    
    return c.json({
      success: true,
      data: result.results || [],
    });
  } catch (error) {
    console.error('Error fetching audit resources:', error);
    return c.json({ error: 'Erro ao buscar recursos de auditoria' }, 500);
  }
});

audit.get('/stats', requirePermission('audit.read'), async (c) => {
  try {
    const tenant = getTenant(c);
    const url = new URL(c.req.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const result = await c.env.DB.prepare(`
      SELECT 
        DATE(created_at) as date,
        action,
        COUNT(*) as count
      FROM audit_logs
      WHERE (site_id = ? OR organization_id = ?)
        AND created_at >= ?
      GROUP BY DATE(created_at), action
      ORDER BY date DESC
    `).bind(tenant.siteId, tenant.organizationId, startDate.toISOString()).all();
    
    return c.json({
      success: true,
      data: result.results || [],
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    return c.json({ error: 'Erro ao buscar estatísticas de auditoria' }, 500);
  }
});

export default audit;
