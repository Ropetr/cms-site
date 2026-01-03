/**
 * Rotas de Categories (Blog)
 */

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { getCookie } from 'hono/cookie';
import type { Env } from '../index';

export const categoriesRoutes = new Hono<{ Bindings: Env }>();

// Middleware de autenticação
const authMiddleware = async (c: any, next: any) => {
  try {
    const token = getCookie(c, 'auth_token') || c.req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return c.json({ error: 'Não autenticado' }, 401);
    const payload = await verify(token, c.env.JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch {
    return c.json({ error: 'Token inválido' }, 401);
  }
};

categoriesRoutes.use('*', authMiddleware);

// Listar categorias
categoriesRoutes.get('/', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT c.*, COUNT(p.id) as posts_count
      FROM categories c
      LEFT JOIN posts p ON p.category_id = c.id AND p.status = 'published'
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();

    return c.json({ success: true, data: result.results });
  } catch (error) {
    console.error('List categories error:', error);
    return c.json({ error: 'Erro ao listar categorias' }, 500);
  }
});

// Buscar categoria por ID
categoriesRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await c.env.DB.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first();
    if (!result) return c.json({ error: 'Categoria não encontrada' }, 404);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ error: 'Erro ao buscar categoria' }, 500);
  }
});

// Criar categoria
categoriesRoutes.post('/', async (c) => {
  try {
    const data = await c.req.json();
    const { name, slug, description, color } = data;

    if (!name || !slug) {
      return c.json({ error: 'Nome e slug são obrigatórios' }, 400);
    }

    const existing = await c.env.DB.prepare('SELECT id FROM categories WHERE slug = ?').bind(slug).first();
    if (existing) return c.json({ error: 'Slug já existe' }, 400);

    const id = `cat_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;

    await c.env.DB.prepare(`
      INSERT INTO categories (id, name, slug, description, color)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, name, slug, description || null, color || '#6b7280').run();

    return c.json({ success: true, data: { id, slug } }, 201);
  } catch (error) {
    console.error('Create category error:', error);
    return c.json({ error: 'Erro ao criar categoria' }, 500);
  }
});

// Atualizar categoria
categoriesRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const { name, slug, description, color } = data;

    const existing = await c.env.DB.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first();
    if (!existing) return c.json({ error: 'Categoria não encontrada' }, 404);

    if (slug && slug !== existing.slug) {
      const slugExists = await c.env.DB.prepare('SELECT id FROM categories WHERE slug = ? AND id != ?').bind(slug, id).first();
      if (slugExists) return c.json({ error: 'Slug já existe' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE categories SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        description = ?,
        color = COALESCE(?, color),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(name, slug, description || null, color, id).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Erro ao atualizar categoria' }, 500);
  }
});

// Excluir categoria
categoriesRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    // Verificar se há posts nesta categoria
    const posts = await c.env.DB.prepare('SELECT COUNT(*) as count FROM posts WHERE category_id = ?').bind(id).first();
    if (posts && (posts.count as number) > 0) {
      return c.json({ error: 'Categoria possui posts associados' }, 400);
    }

    await c.env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Erro ao excluir categoria' }, 500);
  }
});
