/**
 * Rotas de Menu Items
 * CRUD para itens de menu com suporte a hierarquia (submenus)
 * Multi-tenant: todas as queries filtram por site_id
 */

import { Hono } from 'hono';
import type { Env } from '../index';
import { tenantMiddleware, getSiteId } from '../middleware/tenant';

export const menuItemsRoutes = new Hono<{ Bindings: Env }>();

// Aplicar middleware de tenant em todas as rotas
menuItemsRoutes.use('*', tenantMiddleware);

// Listar itens de um menu específico
menuItemsRoutes.get('/menu/:menuId', async (c) => {
  try {
    const siteId = getSiteId(c);
    const menuId = c.req.param('menuId');
    
    // Verificar se menu existe e pertence ao site
    const menu = await c.env.DB.prepare(
      'SELECT id FROM menus WHERE id = ? AND site_id = ?'
    ).bind(menuId, siteId).first();
    
    if (!menu) {
      return c.json({ error: 'Menu não encontrado' }, 404);
    }
    
    // Buscar itens com estrutura hierárquica
    const items = await c.env.DB.prepare(`
      SELECT 
        mi.*,
        p.title as page_title,
        p.slug as page_slug
      FROM menu_items mi
      LEFT JOIN pages p ON mi.page_id = p.id
      WHERE mi.menu_id = ? AND mi.site_id = ?
      ORDER BY mi.position ASC
    `).bind(menuId, siteId).all();
    
    // Montar estrutura hierárquica
    const itemMap = new Map();
    const rootItems: any[] = [];
    
    // Primeiro passo: criar mapa
    (items.results || []).forEach((item: any) => {
      itemMap.set(item.id, { ...item, children: [] });
    });
    
    // Segundo passo: montar hierarquia
    (items.results || []).forEach((item: any) => {
      const menuItem = itemMap.get(item.id);
      if (item.parent_item_id) {
        const parent = itemMap.get(item.parent_item_id);
        if (parent) {
          parent.children.push(menuItem);
        } else {
          rootItems.push(menuItem);
        }
      } else {
        rootItems.push(menuItem);
      }
    });
    
    return c.json({ success: true, data: rootItems });
  } catch (error) {
    console.error('List menu items error:', error);
    return c.json({ error: 'Erro ao listar itens do menu' }, 500);
  }
});

// Buscar item por ID
menuItemsRoutes.get('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');
    
    const item = await c.env.DB.prepare(`
      SELECT 
        mi.*,
        p.title as page_title,
        p.slug as page_slug
      FROM menu_items mi
      LEFT JOIN pages p ON mi.page_id = p.id
      WHERE mi.id = ? AND mi.site_id = ?
    `).bind(id, siteId).first();
    
    if (!item) {
      return c.json({ error: 'Item não encontrado' }, 404);
    }
    
    return c.json({ success: true, data: item });
  } catch (error) {
    console.error('Get menu item error:', error);
    return c.json({ error: 'Erro ao buscar item' }, 500);
  }
});

// Criar item de menu
menuItemsRoutes.post('/', async (c) => {
  try {
    const siteId = getSiteId(c);
    const data = await c.req.json();
    const { 
      menu_id, 
      label, 
      url, 
      page_id, 
      item_type = 'link', 
      target = '_self',
      icon,
      parent_item_id,
      position = 0,
      is_visible = true
    } = data;
    
    if (!menu_id || !label) {
      return c.json({ error: 'menu_id e label são obrigatórios' }, 400);
    }
    
    // Verificar se menu existe
    const menu = await c.env.DB.prepare(
      'SELECT id FROM menus WHERE id = ? AND site_id = ?'
    ).bind(menu_id, siteId).first();
    
    if (!menu) {
      return c.json({ error: 'Menu não encontrado' }, 404);
    }
    
    // Se page_id fornecido, verificar se página existe
    if (page_id) {
      const page = await c.env.DB.prepare(
        'SELECT id, slug FROM pages WHERE id = ? AND site_id = ?'
      ).bind(page_id, siteId).first();
      
      if (!page) {
        return c.json({ error: 'Página não encontrada' }, 404);
      }
    }
    
    // Se parent_item_id fornecido, verificar se existe
    if (parent_item_id) {
      const parent = await c.env.DB.prepare(
        'SELECT id FROM menu_items WHERE id = ? AND menu_id = ? AND site_id = ?'
      ).bind(parent_item_id, menu_id, siteId).first();
      
      if (!parent) {
        return c.json({ error: 'Item pai não encontrado' }, 404);
      }
    }
    
    // Gerar ID
    const id = `item_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    
    // Calcular URL baseado no tipo
    let finalUrl = url;
    if (item_type === 'home') {
      finalUrl = '/';
    } else if (item_type === 'page' && page_id) {
      const page = await c.env.DB.prepare(
        'SELECT slug FROM pages WHERE id = ?'
      ).bind(page_id).first() as { slug: string } | null;
      finalUrl = page ? `/${page.slug}` : url;
    }
    
    await c.env.DB.prepare(`
      INSERT INTO menu_items (
        id, menu_id, site_id, label, url, page_id, item_type, target,
        icon, parent_item_id, position, is_visible
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, menu_id, siteId, label, finalUrl, page_id, item_type, target,
      icon, parent_item_id, position, is_visible ? 1 : 0
    ).run();
    
    // Invalidar cache de navegação
    await c.env.CACHE.delete(`${siteId}:navigation`);
    await c.env.CACHE.delete(`${siteId}:menus:all`);
    
    return c.json({ 
      success: true, 
      data: { id, menu_id, label, url: finalUrl } 
    }, 201);
  } catch (error) {
    console.error('Create menu item error:', error);
    return c.json({ error: 'Erro ao criar item' }, 500);
  }
});

// Atualizar item de menu
menuItemsRoutes.put('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');
    const data = await c.req.json();
    const { 
      label, 
      url, 
      page_id, 
      item_type, 
      target,
      icon,
      parent_item_id,
      position,
      is_visible
    } = data;
    
    // Verificar se item existe
    const existing = await c.env.DB.prepare(
      'SELECT id, menu_id FROM menu_items WHERE id = ? AND site_id = ?'
    ).bind(id, siteId).first() as { id: string; menu_id: string } | null;
    
    if (!existing) {
      return c.json({ error: 'Item não encontrado' }, 404);
    }
    
    // Evitar que item seja pai de si mesmo
    if (parent_item_id === id) {
      return c.json({ error: 'Item não pode ser pai de si mesmo' }, 400);
    }
    
    // Calcular URL se necessário
    let finalUrl = url;
    if (item_type === 'home') {
      finalUrl = '/';
    } else if (item_type === 'page' && page_id) {
      const page = await c.env.DB.prepare(
        'SELECT slug FROM pages WHERE id = ?'
      ).bind(page_id).first() as { slug: string } | null;
      finalUrl = page ? `/${page.slug}` : url;
    }
    
    await c.env.DB.prepare(`
      UPDATE menu_items SET
        label = COALESCE(?, label),
        url = COALESCE(?, url),
        page_id = ?,
        item_type = COALESCE(?, item_type),
        target = COALESCE(?, target),
        icon = ?,
        parent_item_id = ?,
        position = COALESCE(?, position),
        is_visible = COALESCE(?, is_visible),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND site_id = ?
    `).bind(
      label, finalUrl, page_id, item_type, target,
      icon, parent_item_id, position, is_visible !== undefined ? (is_visible ? 1 : 0) : null,
      id, siteId
    ).run();
    
    // Invalidar cache
    await c.env.CACHE.delete(`${siteId}:navigation`);
    await c.env.CACHE.delete(`${siteId}:menus:all`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Update menu item error:', error);
    return c.json({ error: 'Erro ao atualizar item' }, 500);
  }
});

// Deletar item de menu
menuItemsRoutes.delete('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');
    
    // Verificar se item existe
    const item = await c.env.DB.prepare(
      'SELECT id FROM menu_items WHERE id = ? AND site_id = ?'
    ).bind(id, siteId).first();
    
    if (!item) {
      return c.json({ error: 'Item não encontrado' }, 404);
    }
    
    // Verificar se tem filhos
    const children = await c.env.DB.prepare(
      'SELECT id FROM menu_items WHERE parent_item_id = ? AND site_id = ?'
    ).bind(id, siteId).first();
    
    if (children) {
      return c.json({ error: 'Item possui subitens. Delete-os primeiro ou mova-os.' }, 400);
    }
    
    // Deletar item
    await c.env.DB.prepare(
      'DELETE FROM menu_items WHERE id = ? AND site_id = ?'
    ).bind(id, siteId).run();
    
    // Invalidar cache
    await c.env.CACHE.delete(`${siteId}:navigation`);
    await c.env.CACHE.delete(`${siteId}:menus:all`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete menu item error:', error);
    return c.json({ error: 'Erro ao deletar item' }, 500);
  }
});

// Reordenar itens de menu
menuItemsRoutes.post('/reorder', async (c) => {
  try {
    const siteId = getSiteId(c);
    const { items } = await c.req.json();
    
    if (!Array.isArray(items)) {
      return c.json({ error: 'Lista de itens inválida' }, 400);
    }
    
    for (const item of items) {
      await c.env.DB.prepare(`
        UPDATE menu_items SET 
          position = ?, 
          parent_item_id = ?,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND site_id = ?
      `).bind(item.position, item.parent_item_id || null, item.id, siteId).run();
    }
    
    // Invalidar cache
    await c.env.CACHE.delete(`${siteId}:navigation`);
    await c.env.CACHE.delete(`${siteId}:menus:all`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Reorder menu items error:', error);
    return c.json({ error: 'Erro ao reordenar itens' }, 500);
  }
});

// Bulk create - criar múltiplos itens de uma vez (útil para importação)
menuItemsRoutes.post('/bulk', async (c) => {
  try {
    const siteId = getSiteId(c);
    const { menu_id, items } = await c.req.json();
    
    if (!menu_id || !Array.isArray(items)) {
      return c.json({ error: 'menu_id e items são obrigatórios' }, 400);
    }
    
    // Verificar se menu existe
    const menu = await c.env.DB.prepare(
      'SELECT id FROM menus WHERE id = ? AND site_id = ?'
    ).bind(menu_id, siteId).first();
    
    if (!menu) {
      return c.json({ error: 'Menu não encontrado' }, 404);
    }
    
    const createdIds: string[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const id = `item_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
      
      let finalUrl = item.url;
      if (item.item_type === 'home') {
        finalUrl = '/';
      } else if (item.item_type === 'page' && item.page_id) {
        const page = await c.env.DB.prepare(
          'SELECT slug FROM pages WHERE id = ?'
        ).bind(item.page_id).first() as { slug: string } | null;
        finalUrl = page ? `/${page.slug}` : item.url;
      }
      
      await c.env.DB.prepare(`
        INSERT INTO menu_items (
          id, menu_id, site_id, label, url, page_id, item_type, target,
          icon, parent_item_id, position, is_visible
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, menu_id, siteId, item.label, finalUrl, item.page_id || null,
        item.item_type || 'link', item.target || '_self', item.icon || null,
        item.parent_item_id || null, item.position ?? i, item.is_visible !== false ? 1 : 0
      ).run();
      
      createdIds.push(id);
    }
    
    // Invalidar cache
    await c.env.CACHE.delete(`${siteId}:navigation`);
    await c.env.CACHE.delete(`${siteId}:menus:all`);
    
    return c.json({ 
      success: true, 
      data: { created: createdIds.length, ids: createdIds } 
    }, 201);
  } catch (error) {
    console.error('Bulk create menu items error:', error);
    return c.json({ error: 'Erro ao criar itens em lote' }, 500);
  }
});
