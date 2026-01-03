/**
 * Rotas de Menus
 */

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { getCookie } from 'hono/cookie';
import type { Env } from '../index';

export const menusRoutes = new Hono<{ Bindings: Env }>();

// Middleware de autenticação
const authMiddleware = async (c: any, next: any) => {
  try {
    const token = getCookie(c, 'auth_token') || c.req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: 'Não autenticado' }, 401);
    }
    
    const payload = await verify(token, c.env.JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch {
    return c.json({ error: 'Token inválido' }, 401);
  }
};

menusRoutes.use('*', authMiddleware);

// Listar menus (estrutura hierárquica)
menusRoutes.get('/', async (c) => {
  try {
    const flat = c.req.query('flat') === 'true';
    
    const result = await c.env.DB.prepare(
      'SELECT * FROM menus ORDER BY position ASC'
    ).all();
    
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
    const id = c.req.param('id');
    
    const menu = await c.env.DB.prepare(
      'SELECT * FROM menus WHERE id = ?'
    ).bind(id).first();
    
    if (!menu) {
      return c.json({ error: 'Menu não encontrado' }, 404);
    }
    
    // Buscar submenus
    const submenus = await c.env.DB.prepare(
      'SELECT * FROM menus WHERE parent_id = ? ORDER BY position ASC'
    ).bind(id).all();
    
    // Buscar páginas do menu
    const pages = await c.env.DB.prepare(
      'SELECT id, title, slug, status FROM pages WHERE menu_id = ? ORDER BY position ASC'
    ).bind(id).all();
    
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
    const data = await c.req.json();
    const { name, slug, description, icon, parent_id, position, is_visible } = data;
    
    if (!name || !slug) {
      return c.json({ error: 'Nome e slug são obrigatórios' }, 400);
    }
    
    // Verificar se slug já existe
    const existing = await c.env.DB.prepare(
      'SELECT id FROM menus WHERE slug = ?'
    ).bind(slug).first();
    
    if (existing) {
      return c.json({ error: 'Slug já existe' }, 400);
    }
    
    const id = `menu_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    
    await c.env.DB.prepare(`
      INSERT INTO menus (id, name, slug, description, icon, parent_id, position, is_visible)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, name, slug, description, icon, parent_id, position || 0, is_visible !== false ? 1 : 0
    ).run();
    
    // Invalidar cache
    await c.env.CACHE.delete('menus:all');
    await c.env.CACHE.delete('navigation');
    
    return c.json({ success: true, data: { id, slug } }, 201);
  } catch (error) {
    console.error('Create menu error:', error);
    return c.json({ error: 'Erro ao criar menu' }, 500);
  }
});

// Atualizar menu
menusRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    
    const existing = await c.env.DB.prepare(
      'SELECT slug FROM menus WHERE id = ?'
    ).bind(id).first();
    
    if (!existing) {
      return c.json({ error: 'Menu não encontrado' }, 404);
    }
    
    const { name, slug, description, icon, parent_id, position, is_visible } = data;
    
    // Verificar se novo slug já existe
    if (slug && slug !== existing.slug) {
      const slugExists = await c.env.DB.prepare(
        'SELECT id FROM menus WHERE slug = ? AND id != ?'
      ).bind(slug, id).first();
      
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
      WHERE id = ?
    `).bind(
      name, slug, description, icon, parent_id, position, is_visible !== false ? 1 : 0, id
    ).run();
    
    // Invalidar cache
    await c.env.CACHE.delete('menus:all');
    await c.env.CACHE.delete('navigation');
    
    return c.json({ success: true, data: { id, slug: slug || existing.slug } });
  } catch (error) {
    console.error('Update menu error:', error);
    return c.json({ error: 'Erro ao atualizar menu' }, 500);
  }
});

// Deletar menu
menusRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    // Verificar se menu existe
    const menu = await c.env.DB.prepare(
      'SELECT id FROM menus WHERE id = ?'
    ).bind(id).first();
    
    if (!menu) {
      return c.json({ error: 'Menu não encontrado' }, 404);
    }
    
    // Verificar se tem submenus
    const submenus = await c.env.DB.prepare(
      'SELECT id FROM menus WHERE parent_id = ?'
    ).bind(id).first();
    
    if (submenus) {
      return c.json({ error: 'Menu possui submenus. Delete-os primeiro.' }, 400);
    }
    
    // Verificar se tem páginas
    const pages = await c.env.DB.prepare(
      'SELECT id FROM pages WHERE menu_id = ?'
    ).bind(id).first();
    
    if (pages) {
      return c.json({ error: 'Menu possui páginas vinculadas. Desvincule-as primeiro.' }, 400);
    }
    
    // Deletar menu
    await c.env.DB.prepare('DELETE FROM menus WHERE id = ?').bind(id).run();
    
    // Invalidar cache
    await c.env.CACHE.delete('menus:all');
    await c.env.CACHE.delete('navigation');
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete menu error:', error);
    return c.json({ error: 'Erro ao deletar menu' }, 500);
  }
});

// Reordenar menus
menusRoutes.post('/reorder', async (c) => {
  try {
    const { menus } = await c.req.json();
    
    if (!Array.isArray(menus)) {
      return c.json({ error: 'Lista de menus inválida' }, 400);
    }
    
    for (const menu of menus) {
      await c.env.DB.prepare(
        'UPDATE menus SET position = ?, parent_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(menu.position, menu.parent_id || null, menu.id).run();
    }
    
    // Invalidar cache
    await c.env.CACHE.delete('menus:all');
    await c.env.CACHE.delete('navigation');
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Reorder menus error:', error);
    return c.json({ error: 'Erro ao reordenar menus' }, 500);
  }
});
