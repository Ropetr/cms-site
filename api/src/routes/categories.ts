/**
 * Rotas de Categories (Blog)
 * Multi-tenant: todas as queries filtram por site_id
 */

import { Hono } from 'hono';
import type { Env } from '../index';
import { tenantMiddleware, getSiteId } from '../middleware/tenant';

export const categoriesRoutes = new Hono<{ Bindings: Env }>();

// Aplicar middleware de tenant em todas as rotas
categoriesRoutes.use('*', tenantMiddleware);

// Listar categorias
categoriesRoutes.get('/', async (c) => {
  try {
    const siteId = getSiteId(c);
    const result = await c.env.DB.prepare(`
      SELECT c.*, COUNT(p.id) as posts_count
      FROM categories c
      LEFT JOIN posts p ON p.category_id = c.id AND p.status = 'published' AND p.site_id = ?
      WHERE c.site_id = ?
      GROUP BY c.id
      ORDER BY c.name ASC
    `).bind(siteId, siteId).all();

    return c.json({ success: true, data: result.results });
  } catch (error) {
    console.error('List categories error:', error);
    return c.json({ error: 'Erro ao listar categorias' }, 500);
  }
});

// Buscar categoria por ID
categoriesRoutes.get('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');
    const result = await c.env.DB.prepare('SELECT * FROM categories WHERE id = ? AND site_id = ?').bind(id, siteId).first();
    if (!result) return c.json({ error: 'Categoria não encontrada' }, 404);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ error: 'Erro ao buscar categoria' }, 500);
  }
});

// Criar categoria
categoriesRoutes.post('/', async (c) => {
  try {
    const siteId = getSiteId(c);
    const data = await c.req.json();
    const { name, slug, description, color } = data;

    if (!name || !slug) {
      return c.json({ error: 'Nome e slug são obrigatórios' }, 400);
    }

    const existing = await c.env.DB.prepare('SELECT id FROM categories WHERE slug = ? AND site_id = ?').bind(slug, siteId).first();
    if (existing) return c.json({ error: 'Slug já existe' }, 400);

    const id = `cat_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;

    await c.env.DB.prepare(`
      INSERT INTO categories (id, site_id, name, slug, description, color)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, siteId, name, slug, description || null, color || '#6b7280').run();

    return c.json({ success: true, data: { id, slug } }, 201);
  } catch (error) {
    console.error('Create category error:', error);
    return c.json({ error: 'Erro ao criar categoria' }, 500);
  }
});

// Atualizar categoria
categoriesRoutes.put('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');
    const data = await c.req.json();
    const { name, slug, description, color } = data;

    const existing = await c.env.DB.prepare('SELECT * FROM categories WHERE id = ? AND site_id = ?').bind(id, siteId).first();
    if (!existing) return c.json({ error: 'Categoria não encontrada' }, 404);

    if (slug && slug !== existing.slug) {
      const slugExists = await c.env.DB.prepare('SELECT id FROM categories WHERE slug = ? AND id != ? AND site_id = ?').bind(slug, id, siteId).first();
      if (slugExists) return c.json({ error: 'Slug já existe' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE categories SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        description = ?,
        color = COALESCE(?, color),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND site_id = ?
    `).bind(name, slug, description || null, color, id, siteId).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Erro ao atualizar categoria' }, 500);
  }
});

// Excluir categoria
categoriesRoutes.delete('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');
    
    // Verificar se há posts nesta categoria no mesmo site
    const posts = await c.env.DB.prepare('SELECT COUNT(*) as count FROM posts WHERE category_id = ? AND site_id = ?').bind(id, siteId).first();
    if (posts && (posts.count as number) > 0) {
      return c.json({ error: 'Categoria possui posts associados' }, 400);
    }

    await c.env.DB.prepare('DELETE FROM categories WHERE id = ? AND site_id = ?').bind(id, siteId).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Erro ao excluir categoria' }, 500);
  }
});
