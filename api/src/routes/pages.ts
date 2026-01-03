/**
 * Rotas de Páginas
 */

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { getCookie } from 'hono/cookie';
import type { Env } from '../index';

export const pagesRoutes = new Hono<{ Bindings: Env }>();

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

// Aplicar middleware em todas as rotas
pagesRoutes.use('*', authMiddleware);

// Listar páginas
pagesRoutes.get('/', async (c) => {
  try {
    const status = c.req.query('status');
    const menuId = c.req.query('menu_id');
    const search = c.req.query('search');
    
    let query = 'SELECT p.*, m.name as menu_name FROM pages p LEFT JOIN menus m ON p.menu_id = m.id WHERE 1=1';
    const params: any[] = [];
    
    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }
    
    if (menuId) {
      query += ' AND p.menu_id = ?';
      params.push(menuId);
    }
    
    if (search) {
      query += ' AND (p.title LIKE ? OR p.slug LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY p.position ASC, p.created_at DESC';
    
    const stmt = c.env.DB.prepare(query);
    const result = await (params.length ? stmt.bind(...params) : stmt).all();
    
    return c.json({ success: true, data: result.results });
  } catch (error) {
    console.error('List pages error:', error);
    return c.json({ error: 'Erro ao listar páginas' }, 500);
  }
});

// Buscar página por ID
pagesRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const page = await c.env.DB.prepare(
      'SELECT p.*, m.name as menu_name FROM pages p LEFT JOIN menus m ON p.menu_id = m.id WHERE p.id = ?'
    ).bind(id).first();
    
    if (!page) {
      return c.json({ error: 'Página não encontrada' }, 404);
    }
    
    // Buscar seções da página
    const sections = await c.env.DB.prepare(
      'SELECT * FROM page_sections WHERE page_id = ? ORDER BY position ASC'
    ).bind(id).all();
    
    return c.json({
      success: true,
      data: { ...page, sections: sections.results }
    });
  } catch (error) {
    console.error('Get page error:', error);
    return c.json({ error: 'Erro ao buscar página' }, 500);
  }
});

// Criar página
pagesRoutes.post('/', async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    
    const {
      title, slug, page_type, banner_image, banner_title, banner_subtitle,
      content, excerpt, meta_title, meta_description, meta_keywords,
      canonical_url, og_image, menu_id, position, is_featured, status, sections
    } = data;
    
    if (!title || !slug) {
      return c.json({ error: 'Título e slug são obrigatórios' }, 400);
    }
    
    // Verificar se slug já existe
    const existing = await c.env.DB.prepare(
      'SELECT id FROM pages WHERE slug = ?'
    ).bind(slug).first();
    
    if (existing) {
      return c.json({ error: 'Slug já existe' }, 400);
    }
    
    const id = `page_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const publishedAt = status === 'published' ? new Date().toISOString() : null;
    
    await c.env.DB.prepare(`
      INSERT INTO pages (
        id, title, slug, page_type, banner_image, banner_title, banner_subtitle,
        content, excerpt, meta_title, meta_description, meta_keywords,
        canonical_url, og_image, menu_id, position, is_featured, status,
        published_at, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, title, slug, page_type || 'content', banner_image, banner_title, banner_subtitle,
      content, excerpt, meta_title, meta_description, meta_keywords,
      canonical_url, og_image, menu_id, position || 0, is_featured ? 1 : 0, status || 'draft',
      publishedAt, user.sub, user.sub
    ).run();
    
    // Criar seções se houver
    if (sections && Array.isArray(sections)) {
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const sectionId = `section_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
        
        await c.env.DB.prepare(`
          INSERT INTO page_sections (id, page_id, section_type, title, content, position, is_visible)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          sectionId, id, section.section_type, section.title,
          JSON.stringify(section.content), i, section.is_visible !== false ? 1 : 0
        ).run();
      }
    }
    
    // Invalidar cache
    await c.env.CACHE.delete(`page:${slug}`);
    await c.env.CACHE.delete('pages:all');
    await c.env.CACHE.delete('sitemap');
    
    return c.json({ success: true, data: { id, slug } }, 201);
  } catch (error) {
    console.error('Create page error:', error);
    return c.json({ error: 'Erro ao criar página' }, 500);
  }
});

// Atualizar página
pagesRoutes.put('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const data = await c.req.json();
    
    // Verificar se página existe
    const existing = await c.env.DB.prepare(
      'SELECT slug FROM pages WHERE id = ?'
    ).bind(id).first();
    
    if (!existing) {
      return c.json({ error: 'Página não encontrada' }, 404);
    }
    
    const {
      title, slug, page_type, banner_image, banner_title, banner_subtitle,
      content, excerpt, meta_title, meta_description, meta_keywords,
      canonical_url, og_image, menu_id, position, is_featured, status, sections
    } = data;
    
    // Verificar se novo slug já existe (se mudou)
    if (slug && slug !== existing.slug) {
      const slugExists = await c.env.DB.prepare(
        'SELECT id FROM pages WHERE slug = ? AND id != ?'
      ).bind(slug, id).first();
      
      if (slugExists) {
        return c.json({ error: 'Slug já existe' }, 400);
      }
    }
    
    const publishedAt = status === 'published' ? new Date().toISOString() : null;
    
    await c.env.DB.prepare(`
      UPDATE pages SET
        title = COALESCE(?, title),
        slug = COALESCE(?, slug),
        page_type = COALESCE(?, page_type),
        banner_image = ?,
        banner_title = ?,
        banner_subtitle = ?,
        content = ?,
        excerpt = ?,
        meta_title = ?,
        meta_description = ?,
        meta_keywords = ?,
        canonical_url = ?,
        og_image = ?,
        menu_id = ?,
        position = COALESCE(?, position),
        is_featured = ?,
        status = COALESCE(?, status),
        published_at = COALESCE(?, published_at),
        updated_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      title, slug, page_type, banner_image, banner_title, banner_subtitle,
      content, excerpt, meta_title, meta_description, meta_keywords,
      canonical_url, og_image, menu_id, position, is_featured ? 1 : 0, status,
      publishedAt, user.sub, id
    ).run();
    
    // Atualizar seções se houver
    if (sections && Array.isArray(sections)) {
      // Deletar seções antigas
      await c.env.DB.prepare('DELETE FROM page_sections WHERE page_id = ?').bind(id).run();
      
      // Criar novas seções
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const sectionId = section.id || `section_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
        
        await c.env.DB.prepare(`
          INSERT INTO page_sections (id, page_id, section_type, title, content, position, is_visible)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          sectionId, id, section.section_type, section.title,
          JSON.stringify(section.content), i, section.is_visible !== false ? 1 : 0
        ).run();
      }
    }
    
    // Invalidar cache
    await c.env.CACHE.delete(`page:${existing.slug}`);
    if (slug && slug !== existing.slug) {
      await c.env.CACHE.delete(`page:${slug}`);
    }
    await c.env.CACHE.delete('pages:all');
    await c.env.CACHE.delete('sitemap');
    
    return c.json({ success: true, data: { id, slug: slug || existing.slug } });
  } catch (error) {
    console.error('Update page error:', error);
    return c.json({ error: 'Erro ao atualizar página' }, 500);
  }
});

// Deletar página
pagesRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    // Buscar página para invalidar cache
    const page = await c.env.DB.prepare(
      'SELECT slug FROM pages WHERE id = ?'
    ).bind(id).first();
    
    if (!page) {
      return c.json({ error: 'Página não encontrada' }, 404);
    }
    
    // Deletar seções
    await c.env.DB.prepare('DELETE FROM page_sections WHERE page_id = ?').bind(id).run();
    
    // Deletar página
    await c.env.DB.prepare('DELETE FROM pages WHERE id = ?').bind(id).run();
    
    // Invalidar cache
    await c.env.CACHE.delete(`page:${page.slug}`);
    await c.env.CACHE.delete('pages:all');
    await c.env.CACHE.delete('sitemap');
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete page error:', error);
    return c.json({ error: 'Erro ao deletar página' }, 500);
  }
});

// Reordenar páginas
pagesRoutes.post('/reorder', async (c) => {
  try {
    const { pages } = await c.req.json();
    
    if (!Array.isArray(pages)) {
      return c.json({ error: 'Lista de páginas inválida' }, 400);
    }
    
    for (const page of pages) {
      await c.env.DB.prepare(
        'UPDATE pages SET position = ?, menu_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(page.position, page.menu_id, page.id).run();
    }
    
    // Invalidar cache
    await c.env.CACHE.delete('pages:all');
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Reorder pages error:', error);
    return c.json({ error: 'Erro ao reordenar páginas' }, 500);
  }
});

// ============================================
// ROTAS DE SEÇÕES
// ============================================

// Listar seções de uma página
pagesRoutes.get('/:id/sections', async (c) => {
  try {
    const pageId = c.req.param('id');
    
    const sections = await c.env.DB.prepare(
      'SELECT * FROM page_sections WHERE page_id = ? ORDER BY position ASC'
    ).bind(pageId).all();
    
    return c.json({ success: true, data: sections.results });
  } catch (error) {
    console.error('List sections error:', error);
    return c.json({ error: 'Erro ao listar seções' }, 500);
  }
});

// Adicionar seção a uma página
pagesRoutes.post('/:id/sections', async (c) => {
  try {
    const pageId = c.req.param('id');
    const data = await c.req.json();
    
    const { section_type, title, content, layout, variant, sort_order } = data;
    
    if (!section_type) {
      return c.json({ error: 'Tipo de seção é obrigatório' }, 400);
    }
    
    // Verificar se página existe
    const page = await c.env.DB.prepare('SELECT id FROM pages WHERE id = ?').bind(pageId).first();
    if (!page) {
      return c.json({ error: 'Página não encontrada' }, 404);
    }
    
    // Pegar próxima posição se não foi informada
    let position = sort_order;
    if (position === undefined || position === null) {
      const lastSection = await c.env.DB.prepare(
        'SELECT MAX(position) as max_pos FROM page_sections WHERE page_id = ?'
      ).bind(pageId).first();
      position = ((lastSection?.max_pos as number) || 0) + 1;
    }
    
    const id = `section_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    
    await c.env.DB.prepare(`
      INSERT INTO page_sections (id, page_id, section_type, title, content, layout, variant, position, is_visible)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(
      id, pageId, section_type, title || section_type,
      typeof content === 'string' ? content : JSON.stringify(content || {}),
      layout || 'default', variant || 'default', position
    ).run();
    
    // Invalidar cache
    const pageData = await c.env.DB.prepare('SELECT slug FROM pages WHERE id = ?').bind(pageId).first();
    if (pageData?.slug) {
      await c.env.CACHE.delete(`page:${pageData.slug}`);
    }
    
    return c.json({ success: true, data: { id, page_id: pageId, section_type, title, position } }, 201);
  } catch (error) {
    console.error('Add section error:', error);
    return c.json({ error: 'Erro ao adicionar seção' }, 500);
  }
});

// Atualizar seção
pagesRoutes.put('/:id/sections/:sectionId', async (c) => {
  try {
    const pageId = c.req.param('id');
    const sectionId = c.req.param('sectionId');
    const data = await c.req.json();
    
    const { title, content, layout, variant, is_visible } = data;
    
    // Verificar se seção existe
    const section = await c.env.DB.prepare(
      'SELECT id FROM page_sections WHERE id = ? AND page_id = ?'
    ).bind(sectionId, pageId).first();
    
    if (!section) {
      return c.json({ error: 'Seção não encontrada' }, 404);
    }
    
    await c.env.DB.prepare(`
      UPDATE page_sections SET
        title = COALESCE(?, title),
        content = COALESCE(?, content),
        layout = COALESCE(?, layout),
        variant = COALESCE(?, variant),
        is_visible = COALESCE(?, is_visible),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND page_id = ?
    `).bind(
      title,
      typeof content === 'string' ? content : (content ? JSON.stringify(content) : null),
      layout, variant,
      is_visible !== undefined ? (is_visible ? 1 : 0) : null,
      sectionId, pageId
    ).run();
    
    // Invalidar cache
    const pageData = await c.env.DB.prepare('SELECT slug FROM pages WHERE id = ?').bind(pageId).first();
    if (pageData?.slug) {
      await c.env.CACHE.delete(`page:${pageData.slug}`);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Update section error:', error);
    return c.json({ error: 'Erro ao atualizar seção' }, 500);
  }
});

// Deletar seção
pagesRoutes.delete('/:id/sections/:sectionId', async (c) => {
  try {
    const pageId = c.req.param('id');
    const sectionId = c.req.param('sectionId');
    
    // Verificar se seção existe
    const section = await c.env.DB.prepare(
      'SELECT id FROM page_sections WHERE id = ? AND page_id = ?'
    ).bind(sectionId, pageId).first();
    
    if (!section) {
      return c.json({ error: 'Seção não encontrada' }, 404);
    }
    
    await c.env.DB.prepare(
      'DELETE FROM page_sections WHERE id = ? AND page_id = ?'
    ).bind(sectionId, pageId).run();
    
    // Invalidar cache
    const pageData = await c.env.DB.prepare('SELECT slug FROM pages WHERE id = ?').bind(pageId).first();
    if (pageData?.slug) {
      await c.env.CACHE.delete(`page:${pageData.slug}`);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete section error:', error);
    return c.json({ error: 'Erro ao deletar seção' }, 500);
  }
});

// Reordenar seções
pagesRoutes.post('/:id/sections/reorder', async (c) => {
  try {
    const pageId = c.req.param('id');
    const { section_ids } = await c.req.json();
    
    if (!Array.isArray(section_ids)) {
      return c.json({ error: 'Lista de seções inválida' }, 400);
    }
    
    for (let i = 0; i < section_ids.length; i++) {
      await c.env.DB.prepare(
        'UPDATE page_sections SET position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND page_id = ?'
      ).bind(i, section_ids[i], pageId).run();
    }
    
    // Invalidar cache
    const pageData = await c.env.DB.prepare('SELECT slug FROM pages WHERE id = ?').bind(pageId).first();
    if (pageData?.slug) {
      await c.env.CACHE.delete(`page:${pageData.slug}`);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Reorder sections error:', error);
    return c.json({ error: 'Erro ao reordenar seções' }, 500);
  }
});
