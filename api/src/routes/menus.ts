/**
 * Rotas de Menus
 * Multi-tenant: todas as queries filtram por site_id
 */

import { Hono } from 'hono';
import type { Env } from '../index';
import { tenantMiddleware, getSiteId } from '../middleware/tenant';

export const menusRoutes = new Hono<{ Bindings: Env }>();

// Aplicar middleware de tenant em todas as rotas
menusRoutes.use('*', tenantMiddleware);

// Listar menus (estrutura hierárquica)
menusRoutes.get('/', async (c) => {
  try {
    const siteId = getSiteId(c);
    const flat = c.req.query('flat') === 'true';
    
    const result = await c.env.DB.prepare(
      'SELECT * FROM menus WHERE site_id = ? ORDER BY position ASC'
    ).bind(siteId).all();
    
    if (flat) {
      return c.json({ success: true, data: result.results });
    }
    
    // Montar estrutura hierárquica
    const menus = result.results as any[];
    const menuMap = new Map();
    const rootMenus: any[] = [];
    
    // Primeiro passo: criar mapa
    menus.forEach(menu => {
      menuMap.set(menu.id, { ...menu, children: [] });
    });
    
    // Segundo passo: montar hierarquia
    menus.forEach(menu => {
      const menuItem = menuMap.get(menu.id);
      if (menu.parent_id) {
        const parent = menuMap.get(menu.parent_id);
        if (parent) {
          parent.children.push(menuItem);
        } else {
          rootMenus.push(menuItem);
        }
      } else {
        rootMenus.push(menuItem);
      }
    });
    
    return c.json({ success: true, data: rootMenus });
  } catch (error) {
    console.error('List menus error:', error);
    return c.json({ error: 'Erro ao listar menus' }, 500);
  }
});

// Buscar menu por ID
menusRoutes.get('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');
    
    const menu = await c.env.DB.prepare(
      'SELECT * FROM menus WHERE id = ? AND site_id = ?'
    ).bind(id, siteId).first();
    
    if (!menu) {
      return c.json({ error: 'Menu não encontrado' }, 404);
    }
    
    // Buscar submenus
    const submenus = await c.env.DB.prepare(
      'SELECT * FROM menus WHERE parent_id = ? AND site_id = ? ORDER BY position ASC'
    ).bind(id, siteId).all();
    
    // Buscar páginas do menu
    const pages = await c.env.DB.prepare(
      'SELECT id, title, slug, status FROM pages WHERE menu_id = ? AND site_id = ? ORDER BY position ASC'
    ).bind(id, siteId).all();
    
    return c.json({
      success: true,
      data: {
        ...menu,
        submenus: submenus.results,
        pages: pages.results
      }
    });
  } catch (error) {
    console.error('Get menu error:', error);
    return c.json({ error: 'Erro ao buscar menu' }, 500);
  }
});

// Criar menu
menusRoutes.post('/', async (c) => {
  try {
    const siteId = getSiteId(c);
    const data = await c.req.json();
    const { name, slug, description, icon, parent_id, position, is_visible } = data;
    
    if (!name || !slug) {
      return c.json({ error: 'Nome e slug são obrigatórios' }, 400);
    }
    
    // Verificar se slug já existe no mesmo site
    const existing = await c.env.DB.prepare(
      'SELECT id FROM menus WHERE slug = ? AND site_id = ?'
    ).bind(slug, siteId).first();
    
    if (existing) {
      return c.json({ error: 'Slug já existe' }, 400);
    }
    
    const id = `menu_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    
    await c.env.DB.prepare(`
      INSERT INTO menus (id, site_id, name, slug, description, icon, parent_id, position, is_visible)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, siteId, name, slug, description, icon, parent_id, position || 0, is_visible !== false ? 1 : 0
    ).run();
    
    // Invalidar cache
    await c.env.CACHE.delete(`${siteId}:menus:all`);
    await c.env.CACHE.delete(`${siteId}:navigation`);
    
    return c.json({ success: true, data: { id, slug } }, 201);
  } catch (error) {
    console.error('Create menu error:', error);
    return c.json({ error: 'Erro ao criar menu' }, 500);
  }
});

// Atualizar menu
menusRoutes.put('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');
    const data = await c.req.json();
    
    const existing = await c.env.DB.prepare(
      'SELECT slug FROM menus WHERE id = ? AND site_id = ?'
    ).bind(id, siteId).first();
    
    if (!existing) {
      return c.json({ error: 'Menu não encontrado' }, 404);
    }
    
    const { name, slug, description, icon, parent_id, position, is_visible } = data;
    
    // Verificar se novo slug já existe no mesmo site
    if (slug && slug !== existing.slug) {
      const slugExists = await c.env.DB.prepare(
        'SELECT id FROM menus WHERE slug = ? AND id != ? AND site_id = ?'
      ).bind(slug, id, siteId).first();
      
      if (slugExists) {
        return c.json({ error: 'Slug já existe' }, 400);
      }
    }
    
    // Evitar que menu seja pai de si mesmo
    if (parent_id === id) {
      return c.json({ error: 'Menu não pode ser pai de si mesmo' }, 400);
    }
    
    await c.env.DB.prepare(`
      UPDATE menus SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        description = ?,
        icon = ?,
        parent_id = ?,
        position = COALESCE(?, position),
        is_visible = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND site_id = ?
    `).bind(
      name, slug, description, icon, parent_id, position, is_visible !== false ? 1 : 0, id, siteId
    ).run();
    
    // Invalidar cache
    await c.env.CACHE.delete(`${siteId}:menus:all`);
    await c.env.CACHE.delete(`${siteId}:navigation`);
    
    return c.json({ success: true, data: { id, slug: slug || existing.slug } });
  } catch (error) {
    console.error('Update menu error:', error);
    return c.json({ error: 'Erro ao atualizar menu' }, 500);
  }
});

// Deletar menu
menusRoutes.delete('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');
    
    // Verificar se menu existe no site
    const menu = await c.env.DB.prepare(
      'SELECT id FROM menus WHERE id = ? AND site_id = ?'
    ).bind(id, siteId).first();
    
    if (!menu) {
      return c.json({ error: 'Menu não encontrado' }, 404);
    }
    
    // Verificar se tem submenus
    const submenus = await c.env.DB.prepare(
      'SELECT id FROM menus WHERE parent_id = ? AND site_id = ?'
    ).bind(id, siteId).first();
    
    if (submenus) {
      return c.json({ error: 'Menu possui submenus. Delete-os primeiro.' }, 400);
    }
    
    // Verificar se tem páginas
    const pages = await c.env.DB.prepare(
      'SELECT id FROM pages WHERE menu_id = ? AND site_id = ?'
    ).bind(id, siteId).first();
    
    if (pages) {
      return c.json({ error: 'Menu possui páginas vinculadas. Desvincule-as primeiro.' }, 400);
    }
    
    // Deletar menu
    await c.env.DB.prepare('DELETE FROM menus WHERE id = ? AND site_id = ?').bind(id, siteId).run();
    
    // Invalidar cache
    await c.env.CACHE.delete(`${siteId}:menus:all`);
    await c.env.CACHE.delete(`${siteId}:navigation`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete menu error:', error);
    return c.json({ error: 'Erro ao deletar menu' }, 500);
  }
});

// Reordenar menus
menusRoutes.post('/reorder', async (c) => {
  try {
    const siteId = getSiteId(c);
    const { menus } = await c.req.json();
    
    if (!Array.isArray(menus)) {
      return c.json({ error: 'Lista de menus inválida' }, 400);
    }
    
    for (const menu of menus) {
      await c.env.DB.prepare(
        'UPDATE menus SET position = ?, parent_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND site_id = ?'
      ).bind(menu.position, menu.parent_id || null, menu.id, siteId).run();
    }
    
    // Invalidar cache
    await c.env.CACHE.delete(`${siteId}:menus:all`);
    await c.env.CACHE.delete(`${siteId}:navigation`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Reorder menus error:', error);
    return c.json({ error: 'Erro ao reordenar menus' }, 500);
  }
});
