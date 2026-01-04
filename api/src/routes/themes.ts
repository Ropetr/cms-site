/**
 * Rotas de Temas
 * Multi-tenant: todas as queries filtram por site_id
 */

import { Hono } from 'hono';
import type { Env } from '../index';
import { tenantMiddleware, getSiteId } from '../middleware/tenant';

export const themesRoutes = new Hono<{ Bindings: Env }>();

// Aplicar middleware de tenant em todas as rotas
themesRoutes.use('*', tenantMiddleware);

// Listar temas
themesRoutes.get('/', async (c) => {
  try {
    const siteId = getSiteId(c);
    const result = await c.env.DB.prepare(
      'SELECT * FROM themes WHERE site_id = ? ORDER BY is_active DESC, name ASC'
    ).bind(siteId).all();
    
    // Parsear JSON
    const themes = result.results.map((theme: any) => ({
      ...theme,
      colors: JSON.parse(theme.colors || '{}'),
      fonts: theme.fonts ? JSON.parse(theme.fonts) : null,
    }));
    
    return c.json({ success: true, data: themes });
  } catch (error) {
    console.error('List themes error:', error);
    return c.json({ error: 'Erro ao listar temas' }, 500);
  }
});

// Buscar tema ativo
themesRoutes.get('/active', async (c) => {
  try {
    const siteId = getSiteId(c);
    const theme = await c.env.DB.prepare(
      'SELECT * FROM themes WHERE is_active = 1 AND site_id = ?'
    ).bind(siteId).first();
    
    if (!theme) {
      return c.json({ error: 'Nenhum tema ativo' }, 404);
    }
    
    return c.json({
      success: true,
      data: {
        ...theme,
        colors: JSON.parse(theme.colors as string || '{}'),
        fonts: theme.fonts ? JSON.parse(theme.fonts as string) : null,
      }
    });
  } catch (error) {
    console.error('Get active theme error:', error);
    return c.json({ error: 'Erro ao buscar tema ativo' }, 500);
  }
});

// Buscar tema por ID
themesRoutes.get('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');
    
    const theme = await c.env.DB.prepare(
      'SELECT * FROM themes WHERE id = ? AND site_id = ?'
    ).bind(id, siteId).first();
    
    if (!theme) {
      return c.json({ error: 'Tema não encontrado' }, 404);
    }
    
    return c.json({
      success: true,
      data: {
        ...theme,
        colors: JSON.parse(theme.colors as string || '{}'),
        fonts: theme.fonts ? JSON.parse(theme.fonts as string) : null,
      }
    });
  } catch (error) {
    console.error('Get theme error:', error);
    return c.json({ error: 'Erro ao buscar tema' }, 500);
  }
});

// Criar tema
themesRoutes.post('/', async (c) => {
  try {
    const siteId = getSiteId(c);
    const user = c.get('user');
    
    if (user.role !== 'admin') {
      return c.json({ error: 'Sem permissão' }, 403);
    }
    
    const data = await c.req.json();
    const { name, slug, colors, fonts, is_active } = data;
    
    if (!name || !slug || !colors) {
      return c.json({ error: 'Nome, slug e cores são obrigatórios' }, 400);
    }
    
    // Verificar se slug existe no mesmo site
    const existing = await c.env.DB.prepare(
      'SELECT id FROM themes WHERE slug = ? AND site_id = ?'
    ).bind(slug, siteId).first();
    
    if (existing) {
      return c.json({ error: 'Slug já existe' }, 400);
    }
    
    const id = `theme_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    
    // Se for ativo, desativar outros do mesmo site
    if (is_active) {
      await c.env.DB.prepare('UPDATE themes SET is_active = 0 WHERE site_id = ?').bind(siteId).run();
    }
    
    await c.env.DB.prepare(`
      INSERT INTO themes (id, site_id, name, slug, colors, fonts, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, siteId, name, slug,
      JSON.stringify(colors),
      fonts ? JSON.stringify(fonts) : null,
      is_active ? 1 : 0
    ).run();
    
    // Invalidar cache
    await c.env.CACHE.delete(`${siteId}:theme:active`);
    
    return c.json({ success: true, data: { id, slug } }, 201);
  } catch (error) {
    console.error('Create theme error:', error);
    return c.json({ error: 'Erro ao criar tema' }, 500);
  }
});

// Atualizar tema
themesRoutes.put('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const user = c.get('user');
    
    if (user.role !== 'admin') {
      return c.json({ error: 'Sem permissão' }, 403);
    }
    
    const id = c.req.param('id');
    const data = await c.req.json();
    
    const existing = await c.env.DB.prepare(
      'SELECT slug FROM themes WHERE id = ? AND site_id = ?'
    ).bind(id, siteId).first();
    
    if (!existing) {
      return c.json({ error: 'Tema não encontrado' }, 404);
    }
    
    const { name, slug, colors, fonts } = data;
    
    // Verificar se novo slug existe no mesmo site
    if (slug && slug !== existing.slug) {
      const slugExists = await c.env.DB.prepare(
        'SELECT id FROM themes WHERE slug = ? AND id != ? AND site_id = ?'
      ).bind(slug, id, siteId).first();
      
      if (slugExists) {
        return c.json({ error: 'Slug já existe' }, 400);
      }
    }
    
    await c.env.DB.prepare(`
      UPDATE themes SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        colors = COALESCE(?, colors),
        fonts = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND site_id = ?
    `).bind(
      name, slug,
      colors ? JSON.stringify(colors) : null,
      fonts ? JSON.stringify(fonts) : null,
      id, siteId
    ).run();
    
    // Invalidar cache
    await c.env.CACHE.delete(`${siteId}:theme:active`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Update theme error:', error);
    return c.json({ error: 'Erro ao atualizar tema' }, 500);
  }
});

// Ativar tema
themesRoutes.post('/:id/activate', async (c) => {
  try {
    const siteId = getSiteId(c);
    const user = c.get('user');
    
    if (user.role !== 'admin') {
      return c.json({ error: 'Sem permissão' }, 403);
    }
    
    const id = c.req.param('id');
    
    const theme = await c.env.DB.prepare(
      'SELECT id FROM themes WHERE id = ? AND site_id = ?'
    ).bind(id, siteId).first();
    
    if (!theme) {
      return c.json({ error: 'Tema não encontrado' }, 404);
    }
    
    // Desativar todos do mesmo site
    await c.env.DB.prepare('UPDATE themes SET is_active = 0 WHERE site_id = ?').bind(siteId).run();
    
    // Ativar o selecionado
    await c.env.DB.prepare(
      'UPDATE themes SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND site_id = ?'
    ).bind(id, siteId).run();
    
    // Invalidar cache
    await c.env.CACHE.delete(`${siteId}:theme:active`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Activate theme error:', error);
    return c.json({ error: 'Erro ao ativar tema' }, 500);
  }
});

// Deletar tema
themesRoutes.delete('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const user = c.get('user');
    
    if (user.role !== 'admin') {
      return c.json({ error: 'Sem permissão' }, 403);
    }
    
    const id = c.req.param('id');
    
    const theme = await c.env.DB.prepare(
      'SELECT is_active FROM themes WHERE id = ? AND site_id = ?'
    ).bind(id, siteId).first();
    
    if (!theme) {
      return c.json({ error: 'Tema não encontrado' }, 404);
    }
    
    if (theme.is_active) {
      return c.json({ error: 'Não é possível deletar o tema ativo' }, 400);
    }
    
    await c.env.DB.prepare('DELETE FROM themes WHERE id = ? AND site_id = ?').bind(id, siteId).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete theme error:', error);
    return c.json({ error: 'Erro ao deletar tema' }, 500);
  }
});

// Duplicar tema
themesRoutes.post('/:id/duplicate', async (c) => {
  try {
    const siteId = getSiteId(c);
    const user = c.get('user');
    
    if (user.role !== 'admin') {
      return c.json({ error: 'Sem permissão' }, 403);
    }
    
    const id = c.req.param('id');
    
    const theme = await c.env.DB.prepare(
      'SELECT * FROM themes WHERE id = ? AND site_id = ?'
    ).bind(id, siteId).first();
    
    if (!theme) {
      return c.json({ error: 'Tema não encontrado' }, 404);
    }
    
    const newId = `theme_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const newSlug = `${theme.slug}-copy-${Date.now()}`;
    const newName = `${theme.name} (Cópia)`;
    
    await c.env.DB.prepare(`
      INSERT INTO themes (id, site_id, name, slug, colors, fonts, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).bind(
      newId, siteId, newName, newSlug, theme.colors, theme.fonts
    ).run();
    
    return c.json({ success: true, data: { id: newId, slug: newSlug } }, 201);
  } catch (error) {
    console.error('Duplicate theme error:', error);
    return c.json({ error: 'Erro ao duplicar tema' }, 500);
  }
});
