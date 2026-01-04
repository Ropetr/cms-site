/**
 * Rotas de Posts (Blog)
 * Multi-tenant: todas as queries filtram por site_id
 */

import { Hono } from 'hono';
import type { Env } from '../index';
import { tenantMiddleware, getSiteId } from '../middleware/tenant';

export const postsRoutes = new Hono<{ Bindings: Env }>();

// Aplicar middleware de tenant em todas as rotas
postsRoutes.use('*', tenantMiddleware);

// Listar posts
postsRoutes.get('/', async (c) => {
  try {
    const siteId = getSiteId(c);
    const status = c.req.query('status');
    const category = c.req.query('category');
    const search = c.req.query('search');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');

    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug, u.name as author_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.site_id = ?
    `;
    const params: any[] = [siteId];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }
    if (category) {
      query += ' AND p.category_id = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (p.title LIKE ? OR p.excerpt LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await c.env.DB.prepare(query).bind(...params).all();

    // Contar total
    let countQuery = 'SELECT COUNT(*) as total FROM posts WHERE site_id = ?';
    const countParams: any[] = [siteId];
    if (status) { countQuery += ' AND status = ?'; countParams.push(status); }
    if (category) { countQuery += ' AND category_id = ?'; countParams.push(category); }
    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first();

    return c.json({
      success: true,
      data: result.results,
      pagination: { total: countResult?.total || 0, limit, offset }
    });
  } catch (error) {
    console.error('List posts error:', error);
    return c.json({ error: 'Erro ao listar posts' }, 500);
  }
});

// Buscar post por ID
postsRoutes.get('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');
    const result = await c.env.DB.prepare(`
      SELECT p.*, c.name as category_name, u.name as author_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.id = ? AND p.site_id = ?
    `).bind(id, siteId).first();

    if (!result) return c.json({ error: 'Post não encontrado' }, 404);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ error: 'Erro ao buscar post' }, 500);
  }
});

// Criar post
postsRoutes.post('/', async (c) => {
  try {
    const siteId = getSiteId(c);
    const user = c.get('user');
    const data = await c.req.json();
    const { title, slug, excerpt, content, featured_image, category_id, status, is_featured, meta_title, meta_description } = data;

    if (!title || !slug) {
      return c.json({ error: 'Título e slug são obrigatórios' }, 400);
    }

    // Verificar slug único no mesmo site
    const existing = await c.env.DB.prepare('SELECT id FROM posts WHERE slug = ? AND site_id = ?').bind(slug, siteId).first();
    if (existing) return c.json({ error: 'Slug já existe' }, 400);

    const id = `post_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const published_at = status === 'published' ? new Date().toISOString() : null;

    await c.env.DB.prepare(`
      INSERT INTO posts (id, site_id, title, slug, excerpt, content, featured_image, category_id, author_id, status, is_featured, meta_title, meta_description, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, siteId, title, slug, excerpt || null, content || null, featured_image || null,
      category_id || null, user.sub, status || 'draft', is_featured ? 1 : 0,
      meta_title || null, meta_description || null, published_at
    ).run();

    return c.json({ success: true, data: { id, slug } }, 201);
  } catch (error) {
    console.error('Create post error:', error);
    return c.json({ error: 'Erro ao criar post' }, 500);
  }
});

// Atualizar post
postsRoutes.put('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');
    const data = await c.req.json();

    const existing = await c.env.DB.prepare('SELECT * FROM posts WHERE id = ? AND site_id = ?').bind(id, siteId).first();
    if (!existing) return c.json({ error: 'Post não encontrado' }, 404);

    const { title, slug, excerpt, content, featured_image, category_id, status, is_featured, meta_title, meta_description } = data;

    // Verificar slug único se mudou no mesmo site
    if (slug && slug !== existing.slug) {
      const slugExists = await c.env.DB.prepare('SELECT id FROM posts WHERE slug = ? AND id != ? AND site_id = ?').bind(slug, id, siteId).first();
      if (slugExists) return c.json({ error: 'Slug já existe' }, 400);
    }

    // Se está publicando agora
    let published_at = existing.published_at;
    if (status === 'published' && existing.status !== 'published') {
      published_at = new Date().toISOString();
    }

    await c.env.DB.prepare(`
      UPDATE posts SET
        title = COALESCE(?, title),
        slug = COALESCE(?, slug),
        excerpt = ?,
        content = ?,
        featured_image = ?,
        category_id = ?,
        status = COALESCE(?, status),
        is_featured = ?,
        meta_title = ?,
        meta_description = ?,
        published_at = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND site_id = ?
    `).bind(
      title, slug, excerpt || null, content || null, featured_image || null,
      category_id || null, status, is_featured ? 1 : 0,
      meta_title || null, meta_description || null, published_at, id, siteId
    ).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Update post error:', error);
    return c.json({ error: 'Erro ao atualizar post' }, 500);
  }
});

// Excluir post
postsRoutes.delete('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM posts WHERE id = ? AND site_id = ?').bind(id, siteId).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Erro ao excluir post' }, 500);
  }
});
