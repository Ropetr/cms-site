/**
 * Rotas de Páginas
 * Multi-tenant: todas as queries filtram por site_id
 */

import { Hono } from 'hono';
import type { Env } from '../index';
import { tenantMiddleware, getSiteId } from '../middleware/tenant';

export const pagesRoutes = new Hono<{ Bindings: Env }>();

// Aplicar middleware de tenant em todas as rotas
pagesRoutes.use('*', tenantMiddleware);

// Listar páginas
pagesRoutes.get('/', async (c) => {
  try {
    const siteId = getSiteId(c);
    const status = c.req.query('status');
    const menuId = c.req.query('menu_id');
    const search = c.req.query('search');
    
    let query = 'SELECT p.*, m.name as menu_name FROM pages p LEFT JOIN menus m ON p.menu_id = m.id WHERE p.site_id = ?';
    const params: any[] = [siteId];
    
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
    const result = await stmt.bind(...params).all();
    
    return c.json({ success: true, data: result.results });
  } catch (error) {
    console.error('List pages error:', error);
    return c.json({ error: 'Erro ao listar páginas' }, 500);
  }
});

// Buscar página por ID
pagesRoutes.get('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');
    
    const page = await c.env.DB.prepare(
      'SELECT p.*, m.name as menu_name FROM pages p LEFT JOIN menus m ON p.menu_id = m.id WHERE p.id = ? AND p.site_id = ?'
    ).bind(id, siteId).first();
    
    if (!page) {
      return c.json({ error: 'Página não encontrada' }, 404);
    }
    
    // Buscar seções da página
    const sections = await c.env.DB.prepare(
      'SELECT * FROM page_sections WHERE page_id = ? AND site_id = ? ORDER BY position ASC'
    ).bind(id, siteId).all();
    
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
    const siteId = getSiteId(c);
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
    
    // Verificar se slug já existe no mesmo site
    const existing = await c.env.DB.prepare(
      'SELECT id FROM pages WHERE slug = ? AND site_id = ?'
    ).bind(slug, siteId).first();
    
    if (existing) {
      return c.json({ error: 'Slug já existe' }, 400);
    }
    
    const id = `page_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const publishedAt = status === 'published' ? new Date().toISOString() : null;
    
    await c.env.DB.prepare(`
      INSERT INTO pages (
        id, site_id, title, slug, page_type, banner_image, banner_title, banner_subtitle,
        content, excerpt, meta_title, meta_description, meta_keywords,
        canonical_url, og_image, menu_id, position, is_featured, status,
        published_at, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, siteId, title, slug, page_type || 'content', banner_image, banner_title, banner_subtitle,
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
          INSERT INTO page_sections (id, site_id, page_id, section_type, title, content, position, is_visible)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          sectionId, siteId, id, section.section_type, section.title,
          JSON.stringify(section.content), i, section.is_visible !== false ? 1 : 0
        ).run();
      }
    }
    
    // Invalidar cache (incluindo site_id na chave)
    await c.env.CACHE.delete(`${siteId}:page:${slug}`);
    await c.env.CACHE.delete(`${siteId}:pages:all`);
    await c.env.CACHE.delete(`${siteId}:sitemap`);
    
    return c.json({ success: true, data: { id, slug } }, 201);
  } catch (error) {
    console.error('Create page error:', error);
    return c.json({ error: 'Erro ao criar página' }, 500);
  }
});

// Atualizar página
pagesRoutes.put('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const user = c.get('user');
    const id = c.req.param('id');
    const data = await c.req.json();
    
    // Verificar se página existe no site
    const existing = await c.env.DB.prepare(
      'SELECT slug FROM pages WHERE id = ? AND site_id = ?'
    ).bind(id, siteId).first();
    
    if (!existing) {
      return c.json({ error: 'Página não encontrada' }, 404);
    }
    
    const {
      title, slug, page_type, banner_image, banner_title, banner_subtitle,
      content, excerpt, meta_title, meta_description, meta_keywords,
      canonical_url, og_image, menu_id, position, is_featured, status, sections
    } = data;
    
    // Verificar se novo slug já existe no mesmo site (se mudou)
    if (slug && slug !== existing.slug) {
      const slugExists = await c.env.DB.prepare(
        'SELECT id FROM pages WHERE slug = ? AND id != ? AND site_id = ?'
      ).bind(slug, id, siteId).first();
      
      if (slugExists) {
        return c.json({ error: 'Slug já existe' }, 400);
      }
    }
    
    // Construir query dinamicamente apenas com campos enviados
    const updates: string[] = [];
    const values: any[] = [];
    
    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (slug !== undefined) { updates.push('slug = ?'); values.push(slug); }
    if (page_type !== undefined) { updates.push('page_type = ?'); values.push(page_type); }
    if (banner_image !== undefined) { updates.push('banner_image = ?'); values.push(banner_image || null); }
    if (banner_title !== undefined) { updates.push('banner_title = ?'); values.push(banner_title || null); }
    if (banner_subtitle !== undefined) { updates.push('banner_subtitle = ?'); values.push(banner_subtitle || null); }
    if (content !== undefined) { updates.push('content = ?'); values.push(content || null); }
    if (excerpt !== undefined) { updates.push('excerpt = ?'); values.push(excerpt || null); }
    if (meta_title !== undefined) { updates.push('meta_title = ?'); values.push(meta_title || null); }
    if (meta_description !== undefined) { updates.push('meta_description = ?'); values.push(meta_description || null); }
    if (meta_keywords !== undefined) { updates.push('meta_keywords = ?'); values.push(meta_keywords || null); }
    if (canonical_url !== undefined) { updates.push('canonical_url = ?'); values.push(canonical_url || null); }
    if (og_image !== undefined) { updates.push('og_image = ?'); values.push(og_image || null); }
    if (menu_id !== undefined) { updates.push('menu_id = ?'); values.push(menu_id || null); }
    if (position !== undefined) { updates.push('position = ?'); values.push(position); }
    if (is_featured !== undefined) { updates.push('is_featured = ?'); values.push(is_featured ? 1 : 0); }
    if (status !== undefined) { 
      updates.push('status = ?'); 
      values.push(status);
      if (status === 'published') {
        updates.push('published_at = COALESCE(published_at, CURRENT_TIMESTAMP)');
      }
    }
    
    // Sempre atualizar updated_by e updated_at
    updates.push('updated_by = ?');
    values.push(user.sub);
    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    // Adicionar id e site_id no final
    values.push(id);
    values.push(siteId);
    
    if (updates.length > 0) {
      const query = `UPDATE pages SET ${updates.join(', ')} WHERE id = ? AND site_id = ?`;
      await c.env.DB.prepare(query).bind(...values).run();
    }
    
    // Atualizar seções se houver
    if (sections && Array.isArray(sections)) {
      // Deletar seções antigas do site
      await c.env.DB.prepare('DELETE FROM page_sections WHERE page_id = ? AND site_id = ?').bind(id, siteId).run();
      
      // Criar novas seções
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const sectionId = section.id || `section_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
        
        await c.env.DB.prepare(`
          INSERT INTO page_sections (id, site_id, page_id, section_type, title, content, position, is_visible)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          sectionId, siteId, id, section.section_type, section.title,
          JSON.stringify(section.content), i, section.is_visible !== false ? 1 : 0
        ).run();
      }
    }
    
    // Invalidar cache
    await c.env.CACHE.delete(`${siteId}:page:${existing.slug}`);
    if (slug && slug !== existing.slug) {
      await c.env.CACHE.delete(`${siteId}:page:${slug}`);
    }
    await c.env.CACHE.delete(`${siteId}:pages:all`);
    await c.env.CACHE.delete(`${siteId}:sitemap`);
    
    return c.json({ success: true, data: { id, slug: slug || existing.slug } });
  } catch (error) {
    console.error('Update page error:', error);
    return c.json({ error: 'Erro ao atualizar página' }, 500);
  }
});

// Deletar página
pagesRoutes.delete('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');
    
    // Buscar página para invalidar cache
    const page = await c.env.DB.prepare(
      'SELECT slug FROM pages WHERE id = ? AND site_id = ?'
    ).bind(id, siteId).first();
    
    if (!page) {
      return c.json({ error: 'Página não encontrada' }, 404);
    }
    
    // Deletar seções
    await c.env.DB.prepare('DELETE FROM page_sections WHERE page_id = ? AND site_id = ?').bind(id, siteId).run();
    
    // Deletar página
    await c.env.DB.prepare('DELETE FROM pages WHERE id = ? AND site_id = ?').bind(id, siteId).run();
    
    // Invalidar cache
    await c.env.CACHE.delete(`${siteId}:page:${page.slug}`);
    await c.env.CACHE.delete(`${siteId}:pages:all`);
    await c.env.CACHE.delete(`${siteId}:sitemap`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete page error:', error);
    return c.json({ error: 'Erro ao deletar página' }, 500);
  }
});

// Reordenar páginas
pagesRoutes.post('/reorder', async (c) => {
  try {
    const siteId = getSiteId(c);
    const { pages } = await c.req.json();
    
    if (!Array.isArray(pages)) {
      return c.json({ error: 'Lista de páginas inválida' }, 400);
    }
    
    for (const page of pages) {
      await c.env.DB.prepare(
        'UPDATE pages SET position = ?, menu_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND site_id = ?'
      ).bind(page.position, page.menu_id, page.id, siteId).run();
    }
    
    // Invalidar cache
    await c.env.CACHE.delete(`${siteId}:pages:all`);
    
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
    const siteId = getSiteId(c);
    const pageId = c.req.param('id');
    
    const sections = await c.env.DB.prepare(
      'SELECT * FROM page_sections WHERE page_id = ? AND site_id = ? ORDER BY position ASC'
    ).bind(pageId, siteId).all();
    
    return c.json({ success: true, data: sections.results });
  } catch (error) {
    console.error('List sections error:', error);
    return c.json({ error: 'Erro ao listar seções' }, 500);
  }
});

// Adicionar seção a uma página
pagesRoutes.post('/:id/sections', async (c) => {
  try {
    const siteId = getSiteId(c);
    const pageId = c.req.param('id');
    const data = await c.req.json();
    
    const { section_type, title, content, layout, variant, sort_order } = data;
    
    if (!section_type) {
      return c.json({ error: 'Tipo de seção é obrigatório' }, 400);
    }
    
    // Verificar se página existe no site
    const page = await c.env.DB.prepare('SELECT id FROM pages WHERE id = ? AND site_id = ?').bind(pageId, siteId).first();
    if (!page) {
      return c.json({ error: 'Página não encontrada' }, 404);
    }
    
    // Pegar próxima posição se não foi informada
    let position = sort_order;
    if (position === undefined || position === null) {
      const lastSection = await c.env.DB.prepare(
        'SELECT MAX(position) as max_pos FROM page_sections WHERE page_id = ? AND site_id = ?'
      ).bind(pageId, siteId).first();
      position = ((lastSection?.max_pos as number) || 0) + 1;
    }
    
    const id = `section_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    
    await c.env.DB.prepare(`
      INSERT INTO page_sections (id, site_id, page_id, section_type, title, content, layout, variant, position, is_visible)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(
      id, siteId, pageId, section_type, title || section_type,
      typeof content === 'string' ? content : JSON.stringify(content || {}),
      layout || 'default', variant || 'default', position
    ).run();
    
    // Invalidar cache
    const pageData = await c.env.DB.prepare('SELECT slug FROM pages WHERE id = ? AND site_id = ?').bind(pageId, siteId).first();
    if (pageData?.slug) {
      await c.env.CACHE.delete(`${siteId}:page:${pageData.slug}`);
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
    const siteId = getSiteId(c);
    const pageId = c.req.param('id');
    const sectionId = c.req.param('sectionId');
    const data = await c.req.json();
    
    const { title, content, layout, variant, is_visible } = data;
    
    // Verificar se seção existe no site
    const section = await c.env.DB.prepare(
      'SELECT id FROM page_sections WHERE id = ? AND page_id = ? AND site_id = ?'
    ).bind(sectionId, pageId, siteId).first();
    
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
      WHERE id = ? AND page_id = ? AND site_id = ?
    `).bind(
      title,
      typeof content === 'string' ? content : (content ? JSON.stringify(content) : null),
      layout, variant,
      is_visible !== undefined ? (is_visible ? 1 : 0) : null,
      sectionId, pageId, siteId
    ).run();
    
    // Invalidar cache
    const pageData = await c.env.DB.prepare('SELECT slug FROM pages WHERE id = ? AND site_id = ?').bind(pageId, siteId).first();
    if (pageData?.slug) {
      await c.env.CACHE.delete(`${siteId}:page:${pageData.slug}`);
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
    const siteId = getSiteId(c);
    const pageId = c.req.param('id');
    const sectionId = c.req.param('sectionId');
    
    // Verificar se seção existe no site
    const section = await c.env.DB.prepare(
      'SELECT id FROM page_sections WHERE id = ? AND page_id = ? AND site_id = ?'
    ).bind(sectionId, pageId, siteId).first();
    
    if (!section) {
      return c.json({ error: 'Seção não encontrada' }, 404);
    }
    
    await c.env.DB.prepare(
      'DELETE FROM page_sections WHERE id = ? AND page_id = ? AND site_id = ?'
    ).bind(sectionId, pageId, siteId).run();
    
    // Invalidar cache
    const pageData = await c.env.DB.prepare('SELECT slug FROM pages WHERE id = ? AND site_id = ?').bind(pageId, siteId).first();
    if (pageData?.slug) {
      await c.env.CACHE.delete(`${siteId}:page:${pageData.slug}`);
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
    const siteId = getSiteId(c);
    const pageId = c.req.param('id');
    const { section_ids } = await c.req.json();
    
    if (!Array.isArray(section_ids)) {
      return c.json({ error: 'Lista de seções inválida' }, 400);
    }
    
    for (let i = 0; i < section_ids.length; i++) {
      await c.env.DB.prepare(
        'UPDATE page_sections SET position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND page_id = ? AND site_id = ?'
      ).bind(i, section_ids[i], pageId, siteId).run();
    }
    
    // Invalidar cache
    const pageData = await c.env.DB.prepare('SELECT slug FROM pages WHERE id = ? AND site_id = ?').bind(pageId, siteId).first();
    if (pageData?.slug) {
      await c.env.CACHE.delete(`${siteId}:page:${pageData.slug}`);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Reorder sections error:', error);
    return c.json({ error: 'Erro ao reordenar seções' }, 500);
  }
});
