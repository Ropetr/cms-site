/**
 * Rotas de Configurações
 * Multi-tenant: todas as queries filtram por site_id
 */

import { Hono } from 'hono';
import type { Env } from '../index';
import { tenantMiddleware, getSiteId } from '../middleware/tenant';

export const settingsRoutes = new Hono<{ Bindings: Env }>();

// Aplicar middleware de tenant em todas as rotas
settingsRoutes.use('*', tenantMiddleware);

// Listar todas as configurações
settingsRoutes.get('/', async (c) => {
  try {
    const siteId = getSiteId(c);
    const group = c.req.query('group');
    
    let query = 'SELECT * FROM settings WHERE site_id = ?';
    const params: any[] = [siteId];
    
    if (group) {
      query += ' AND group_name = ?';
      params.push(group);
    }
    
    query += ' ORDER BY group_name ASC, key ASC';
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    
    // Organizar por grupo
    const byGroup: Record<string, any[]> = {};
    for (const setting of result.results as any[]) {
      const groupName = setting.group_name || 'general';
      if (!byGroup[groupName]) {
        byGroup[groupName] = [];
      }
      
      // Parsear JSON se necessário
      let value = setting.value;
      if (setting.type === 'json' && value) {
        try {
          value = JSON.parse(value);
        } catch {}
      } else if (setting.type === 'boolean') {
        value = value === 'true' || value === '1';
      } else if (setting.type === 'number') {
        value = Number(value);
      }
      
      byGroup[groupName].push({ ...setting, value });
    }
    
    return c.json({ success: true, data: byGroup });
  } catch (error) {
    console.error('List settings error:', error);
    return c.json({ error: 'Erro ao listar configurações' }, 500);
  }
});

// Buscar configuração específica
settingsRoutes.get('/:key', async (c) => {
  try {
    const siteId = getSiteId(c);
    const key = c.req.param('key');
    
    const setting = await c.env.DB.prepare(
      'SELECT * FROM settings WHERE key = ? AND site_id = ?'
    ).bind(key, siteId).first();
    
    if (!setting) {
      return c.json({ error: 'Configuração não encontrada' }, 404);
    }
    
    // Parsear valor
    let value = setting.value;
    if (setting.type === 'json' && value) {
      try {
        value = JSON.parse(value as string);
      } catch {}
    }
    
    return c.json({ success: true, data: { ...setting, value } });
  } catch (error) {
    console.error('Get setting error:', error);
    return c.json({ error: 'Erro ao buscar configuração' }, 500);
  }
});

// Atualizar configuração
settingsRoutes.put('/:key', async (c) => {
  try {
    const siteId = getSiteId(c);
    const user = c.get('user');
    
    // Apenas admin pode alterar configurações
    if (user.role !== 'admin') {
      return c.json({ error: 'Sem permissão' }, 403);
    }
    
    const key = c.req.param('key');
    const data = await c.req.json();
    
    const existing = await c.env.DB.prepare(
      'SELECT * FROM settings WHERE key = ? AND site_id = ?'
    ).bind(key, siteId).first();
    
    if (!existing) {
      return c.json({ error: 'Configuração não encontrada' }, 404);
    }
    
    // Converter valor para string se necessário
    let value = data.value;
    if (existing.type === 'json' && typeof value === 'object') {
      value = JSON.stringify(value);
    } else if (existing.type === 'boolean') {
      value = value ? 'true' : 'false';
    } else if (value !== null && value !== undefined) {
      value = String(value);
    }
    
    await c.env.DB.prepare(
      'UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ? AND site_id = ?'
    ).bind(value, key, siteId).run();
    
    // Invalidar cache
    await c.env.CACHE.delete(`${siteId}:settings:all`);
    await c.env.CACHE.delete(`${siteId}:settings:${key}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Update setting error:', error);
    return c.json({ error: 'Erro ao atualizar configuração' }, 500);
  }
});

// Atualizar múltiplas configurações
settingsRoutes.put('/', async (c) => {
  try {
    const siteId = getSiteId(c);
    const user = c.get('user');
    
    // Apenas admin pode alterar configurações
    if (user.role !== 'admin') {
      return c.json({ error: 'Sem permissão' }, 403);
    }
    
    const data = await c.req.json();
    const { settings } = data;
    
    if (!settings || !Array.isArray(settings)) {
      return c.json({ error: 'Lista de configurações inválida' }, 400);
    }
    
    for (const setting of settings) {
      const existing = await c.env.DB.prepare(
        'SELECT type FROM settings WHERE key = ? AND site_id = ?'
      ).bind(setting.key, siteId).first();
      
      if (!existing) continue;
      
      // Converter valor
      let value = setting.value;
      if (existing.type === 'json' && typeof value === 'object') {
        value = JSON.stringify(value);
      } else if (existing.type === 'boolean') {
        value = value ? 'true' : 'false';
      } else if (value !== null && value !== undefined) {
        value = String(value);
      }
      
      await c.env.DB.prepare(
        'UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ? AND site_id = ?'
      ).bind(value, setting.key, siteId).run();
      
      await c.env.CACHE.delete(`${siteId}:settings:${setting.key}`);
    }
    
    // Invalidar cache geral
    await c.env.CACHE.delete(`${siteId}:settings:all`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Batch update settings error:', error);
    return c.json({ error: 'Erro ao atualizar configurações' }, 500);
  }
});

// Criar nova configuração (apenas admin)
settingsRoutes.post('/', async (c) => {
  try {
    const siteId = getSiteId(c);
    const user = c.get('user');
    
    if (user.role !== 'admin') {
      return c.json({ error: 'Sem permissão' }, 403);
    }
    
    const data = await c.req.json();
    const { key, value, type, group_name, label, description } = data;
    
    if (!key) {
      return c.json({ error: 'Chave é obrigatória' }, 400);
    }
    
    // Verificar se já existe no mesmo site
    const existing = await c.env.DB.prepare(
      'SELECT id FROM settings WHERE key = ? AND site_id = ?'
    ).bind(key, siteId).first();
    
    if (existing) {
      return c.json({ error: 'Configuração já existe' }, 400);
    }
    
    const id = `set_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    
    // Converter valor
    let storedValue = value;
    if (type === 'json' && typeof value === 'object') {
      storedValue = JSON.stringify(value);
    } else if (type === 'boolean') {
      storedValue = value ? 'true' : 'false';
    } else if (value !== null && value !== undefined) {
      storedValue = String(value);
    }
    
    await c.env.DB.prepare(`
      INSERT INTO settings (id, site_id, key, value, type, group_name, label, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, siteId, key, storedValue, type || 'string', group_name || 'general', label, description
    ).run();
    
    return c.json({ success: true, data: { id, key } }, 201);
  } catch (error) {
    console.error('Create setting error:', error);
    return c.json({ error: 'Erro ao criar configuração' }, 500);
  }
});

// Deletar configuração (apenas admin)
settingsRoutes.delete('/:key', async (c) => {
  try {
    const siteId = getSiteId(c);
    const user = c.get('user');
    
    if (user.role !== 'admin') {
      return c.json({ error: 'Sem permissão' }, 403);
    }
    
    const key = c.req.param('key');
    
    await c.env.DB.prepare('DELETE FROM settings WHERE key = ? AND site_id = ?').bind(key, siteId).run();
    
    await c.env.CACHE.delete(`${siteId}:settings:all`);
    await c.env.CACHE.delete(`${siteId}:settings:${key}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete setting error:', error);
    return c.json({ error: 'Erro ao deletar configuração' }, 500);
  }
});
