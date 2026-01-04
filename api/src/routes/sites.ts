/**
 * Rotas de Sites
 */

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { getCookie } from 'hono/cookie';
import type { Env } from '../index';

export const sitesRoutes = new Hono<{ Bindings: Env }>();

// Middleware de autenticacao
const authMiddleware = async (c: any, next: any) => {
  try {
    const token = getCookie(c, 'auth_token') || c.req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: 'Nao autenticado' }, 401);
    }
    
    const payload = await verify(token, c.env.JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch {
    return c.json({ error: 'Token invalido' }, 401);
  }
};

sitesRoutes.use('*', authMiddleware);

// Listar sites do usuario
sitesRoutes.get('/', async (c) => {
  try {
    const user = c.get('user');
    
    // Buscar sites onde o usuario tem acesso direto ou via organizacao
    const result = await c.env.DB.prepare(`
      SELECT DISTINCT s.*, o.name as organization_name, o.slug as organization_slug,
        COALESCE(su.role, ou.role) as user_role
      FROM sites s
      INNER JOIN organizations o ON s.organization_id = o.id
      LEFT JOIN site_users su ON s.id = su.site_id AND su.user_id = ?
      LEFT JOIN organization_users ou ON s.organization_id = ou.organization_id AND ou.user_id = ?
      WHERE su.user_id IS NOT NULL OR ou.user_id IS NOT NULL
      ORDER BY s.name ASC
    `).bind(user.sub, user.sub).all();
    
    return c.json({ success: true, data: result.results });
  } catch (error) {
    console.error('List sites error:', error);
    return c.json({ error: 'Erro ao listar sites' }, 500);
  }
});

// Buscar site por ID
sitesRoutes.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    
    // Verificar acesso
    const access = await c.env.DB.prepare(`
      SELECT COALESCE(su.role, ou.role) as role
      FROM sites s
      LEFT JOIN site_users su ON s.id = su.site_id AND su.user_id = ?
      LEFT JOIN organization_users ou ON s.organization_id = ou.organization_id AND ou.user_id = ?
      WHERE s.id = ? AND (su.user_id IS NOT NULL OR ou.user_id IS NOT NULL)
    `).bind(user.sub, user.sub, id).first();
    
    if (!access) {
      return c.json({ error: 'Sem permissao' }, 403);
    }
    
    const site = await c.env.DB.prepare(`
      SELECT s.*, o.name as organization_name, o.slug as organization_slug
      FROM sites s
      INNER JOIN organizations o ON s.organization_id = o.id
      WHERE s.id = ?
    `).bind(id).first();
    
    if (!site) {
      return c.json({ error: 'Site nao encontrado' }, 404);
    }
    
    // Contar recursos
    const stats = await c.env.DB.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM pages WHERE site_id = ?) as pages_count,
        (SELECT COUNT(*) FROM posts WHERE site_id = ?) as posts_count,
        (SELECT COUNT(*) FROM media WHERE site_id = ?) as media_count,
        (SELECT COUNT(*) FROM contacts WHERE site_id = ?) as contacts_count
    `).bind(id, id, id, id).first();
    
    return c.json({
      success: true,
      data: {
        ...site,
        user_role: access.role,
        stats: {
          pages: stats?.pages_count || 0,
          posts: stats?.posts_count || 0,
          media: stats?.media_count || 0,
          contacts: stats?.contacts_count || 0
        }
      }
    });
  } catch (error) {
    console.error('Get site error:', error);
    return c.json({ error: 'Erro ao buscar site' }, 500);
  }
});

// Criar site
sitesRoutes.post('/', async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    const { organization_id, name, slug, domain, subdomain, logo_url, favicon_url } = data;
    
    if (!organization_id || !name || !slug) {
      return c.json({ error: 'organization_id, nome e slug sao obrigatorios' }, 400);
    }
    
    // Verificar se usuario tem acesso a organizacao
    const access = await c.env.DB.prepare(
      'SELECT role FROM organization_users WHERE organization_id = ? AND user_id = ?'
    ).bind(organization_id, user.sub).first();
    
    if (!access || !['owner', 'admin'].includes(access.role as string)) {
      return c.json({ error: 'Sem permissao para criar sites nesta organizacao' }, 403);
    }
    
    // Verificar limite de sites
    const org = await c.env.DB.prepare(
      'SELECT max_sites FROM organizations WHERE id = ?'
    ).bind(organization_id).first();
    
    const siteCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM sites WHERE organization_id = ?'
    ).bind(organization_id).first();
    
    if (org && siteCount && (siteCount.count as number) >= (org.max_sites as number)) {
      return c.json({ error: 'Limite de sites atingido para esta organizacao' }, 400);
    }
    
    // Verificar se slug ja existe na organizacao
    const existingSlug = await c.env.DB.prepare(
      'SELECT id FROM sites WHERE organization_id = ? AND slug = ?'
    ).bind(organization_id, slug).first();
    
    if (existingSlug) {
      return c.json({ error: 'Slug ja existe nesta organizacao' }, 400);
    }
    
    // Verificar se dominio ja existe (globalmente)
    if (domain) {
      const existingDomain = await c.env.DB.prepare(
        'SELECT id FROM sites WHERE domain = ?'
      ).bind(domain).first();
      
      if (existingDomain) {
        return c.json({ error: 'Dominio ja esta em uso' }, 400);
      }
    }
    
    // Verificar se subdominio ja existe (globalmente)
    if (subdomain) {
      const existingSubdomain = await c.env.DB.prepare(
        'SELECT id FROM sites WHERE subdomain = ?'
      ).bind(subdomain).first();
      
      if (existingSubdomain) {
        return c.json({ error: 'Subdominio ja esta em uso' }, 400);
      }
    }
    
    const id = `site_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const verificationToken = crypto.randomUUID();
    
    // Criar site
    await c.env.DB.prepare(`
      INSERT INTO sites (
        id, organization_id, name, slug, domain, subdomain,
        domain_status, domain_verification_token, logo_url, favicon_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, organization_id, name, slug,
      domain || null, subdomain || `${slug}.cms-site.com`,
      domain ? 'pending' : 'active',
      domain ? verificationToken : null,
      logo_url || null, favicon_url || null
    ).run();
    
    // Adicionar usuario como owner do site
    const suId = `su_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    await c.env.DB.prepare(`
      INSERT INTO site_users (id, site_id, user_id, role)
      VALUES (?, ?, ?, 'owner')
    `).bind(suId, id, user.sub).run();
    
    // Criar configuracoes padrao para o site
    const defaultSettings = [
      { key: 'site_name', value: name, type: 'string', group_name: 'general' },
      { key: 'site_tagline', value: '', type: 'string', group_name: 'general' },
      { key: 'default_meta_description', value: '', type: 'string', group_name: 'seo' },
      { key: 'site_url', value: subdomain ? `https://${subdomain}` : '', type: 'string', group_name: 'general' },
    ];
    
    for (const setting of defaultSettings) {
      const settingId = `set_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
      await c.env.DB.prepare(`
        INSERT INTO settings (id, site_id, key, value, type, group_name)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(settingId, id, setting.key, setting.value, setting.type, setting.group_name).run();
    }
    
    // Criar tema padrao para o site
    const themeId = `theme_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    await c.env.DB.prepare(`
      INSERT INTO themes (id, site_id, name, slug, colors, is_active)
      VALUES (?, ?, 'Default', 'default', ?, 1)
    `).bind(
      themeId, id,
      JSON.stringify({
        primary_color: '#AA000E',
        secondary_color: '#1a1a1a',
        heading_font: 'Inter',
        body_font: 'Inter'
      })
    ).run();
    
    return c.json({
      success: true,
      data: {
        id,
        slug,
        subdomain: subdomain || `${slug}.cms-site.com`,
        domain_verification_token: domain ? verificationToken : null
      }
    }, 201);
  } catch (error) {
    console.error('Create site error:', error);
    return c.json({ error: 'Erro ao criar site' }, 500);
  }
});

// Atualizar site
sitesRoutes.put('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const data = await c.req.json();
    
    // Verificar acesso
    const access = await c.env.DB.prepare(`
      SELECT COALESCE(su.role, ou.role) as role
      FROM sites s
      LEFT JOIN site_users su ON s.id = su.site_id AND su.user_id = ?
      LEFT JOIN organization_users ou ON s.organization_id = ou.organization_id AND ou.user_id = ?
      WHERE s.id = ? AND (su.user_id IS NOT NULL OR ou.user_id IS NOT NULL)
    `).bind(user.sub, user.sub, id).first();
    
    if (!access || !['owner', 'admin'].includes(access.role as string)) {
      return c.json({ error: 'Sem permissao' }, 403);
    }
    
    const { name, slug, logo_url, favicon_url, is_active, settings } = data;
    
    // Verificar se novo slug ja existe
    if (slug) {
      const site = await c.env.DB.prepare('SELECT organization_id, slug FROM sites WHERE id = ?').bind(id).first();
      if (slug !== site?.slug) {
        const existing = await c.env.DB.prepare(
          'SELECT id FROM sites WHERE organization_id = ? AND slug = ? AND id != ?'
        ).bind(site?.organization_id, slug, id).first();
        
        if (existing) {
          return c.json({ error: 'Slug ja existe nesta organizacao' }, 400);
        }
      }
    }
    
    await c.env.DB.prepare(`
      UPDATE sites SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        logo_url = ?,
        favicon_url = ?,
        is_active = COALESCE(?, is_active),
        settings = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      name, slug, logo_url, favicon_url,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      settings ? JSON.stringify(settings) : null,
      id
    ).run();
    
    // Invalidar cache
    await c.env.CACHE.delete(`site:${id}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Update site error:', error);
    return c.json({ error: 'Erro ao atualizar site' }, 500);
  }
});

// Deletar site
sitesRoutes.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    
    // Verificar se usuario e owner do site ou da organizacao
    const access = await c.env.DB.prepare(`
      SELECT su.role as site_role, ou.role as org_role
      FROM sites s
      LEFT JOIN site_users su ON s.id = su.site_id AND su.user_id = ?
      LEFT JOIN organization_users ou ON s.organization_id = ou.organization_id AND ou.user_id = ?
      WHERE s.id = ?
    `).bind(user.sub, user.sub, id).first();
    
    if (!access || (access.site_role !== 'owner' && access.org_role !== 'owner')) {
      return c.json({ error: 'Apenas o owner pode deletar o site' }, 403);
    }
    
    // Deletar todos os dados do site
    await c.env.DB.prepare('DELETE FROM page_sections WHERE site_id = ?').bind(id).run();
    await c.env.DB.prepare('DELETE FROM pages WHERE site_id = ?').bind(id).run();
    await c.env.DB.prepare('DELETE FROM menus WHERE site_id = ?').bind(id).run();
    await c.env.DB.prepare('DELETE FROM posts WHERE site_id = ?').bind(id).run();
    await c.env.DB.prepare('DELETE FROM categories WHERE site_id = ?').bind(id).run();
    await c.env.DB.prepare('DELETE FROM contacts WHERE site_id = ?').bind(id).run();
    await c.env.DB.prepare('DELETE FROM themes WHERE site_id = ?').bind(id).run();
    await c.env.DB.prepare('DELETE FROM settings WHERE site_id = ?').bind(id).run();
    await c.env.DB.prepare('DELETE FROM site_users WHERE site_id = ?').bind(id).run();
    
    // Deletar media do R2 (opcional - pode ser feito em background)
    const media = await c.env.DB.prepare('SELECT file_name FROM media WHERE site_id = ?').bind(id).all();
    for (const m of media.results as any[]) {
      try {
        await c.env.MEDIA.delete(m.file_name);
      } catch {}
    }
    await c.env.DB.prepare('DELETE FROM media WHERE site_id = ?').bind(id).run();
    
    // Deletar site
    await c.env.DB.prepare('DELETE FROM sites WHERE id = ?').bind(id).run();
    
    // Invalidar cache
    await c.env.CACHE.delete(`site:${id}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete site error:', error);
    return c.json({ error: 'Erro ao deletar site' }, 500);
  }
});

// Configurar dominio customizado
sitesRoutes.post('/:id/domain', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const data = await c.req.json();
    const { domain } = data;
    
    if (!domain) {
      return c.json({ error: 'Dominio e obrigatorio' }, 400);
    }
    
    // Verificar acesso
    const access = await c.env.DB.prepare(`
      SELECT COALESCE(su.role, ou.role) as role
      FROM sites s
      LEFT JOIN site_users su ON s.id = su.site_id AND su.user_id = ?
      LEFT JOIN organization_users ou ON s.organization_id = ou.organization_id AND ou.user_id = ?
      WHERE s.id = ? AND (su.user_id IS NOT NULL OR ou.user_id IS NOT NULL)
    `).bind(user.sub, user.sub, id).first();
    
    if (!access || !['owner', 'admin'].includes(access.role as string)) {
      return c.json({ error: 'Sem permissao' }, 403);
    }
    
    // Verificar se dominio ja existe
    const existingDomain = await c.env.DB.prepare(
      'SELECT id FROM sites WHERE domain = ? AND id != ?'
    ).bind(domain, id).first();
    
    if (existingDomain) {
      return c.json({ error: 'Dominio ja esta em uso' }, 400);
    }
    
    const verificationToken = crypto.randomUUID();
    
    await c.env.DB.prepare(`
      UPDATE sites SET
        domain = ?,
        domain_status = 'pending',
        domain_verification_token = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(domain, verificationToken, id).run();
    
    // TODO: Criar Custom Hostname no Cloudflare for SaaS
    // Isso requer chamada a API do Cloudflare
    
    return c.json({
      success: true,
      data: {
        domain,
        status: 'pending',
        verification_token: verificationToken,
        instructions: {
          cname: {
            name: domain,
            value: 'cms-site.pages.dev' // Fallback origin
          },
          txt: {
            name: `_cf-custom-hostname.${domain}`,
            value: verificationToken
          }
        }
      }
    });
  } catch (error) {
    console.error('Set domain error:', error);
    return c.json({ error: 'Erro ao configurar dominio' }, 500);
  }
});

// Verificar status do dominio
sitesRoutes.get('/:id/domain/status', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    
    // Verificar acesso
    const site = await c.env.DB.prepare(`
      SELECT s.domain, s.domain_status, s.domain_verification_token
      FROM sites s
      LEFT JOIN site_users su ON s.id = su.site_id AND su.user_id = ?
      LEFT JOIN organization_users ou ON s.organization_id = ou.organization_id AND ou.user_id = ?
      WHERE s.id = ? AND (su.user_id IS NOT NULL OR ou.user_id IS NOT NULL)
    `).bind(user.sub, user.sub, id).first();
    
    if (!site) {
      return c.json({ error: 'Site nao encontrado ou sem permissao' }, 404);
    }
    
    if (!site.domain) {
      return c.json({ error: 'Nenhum dominio configurado' }, 400);
    }
    
    // TODO: Verificar status real no Cloudflare for SaaS
    // Por enquanto, retorna o status do banco
    
    return c.json({
      success: true,
      data: {
        domain: site.domain,
        status: site.domain_status,
        instructions: site.domain_status === 'pending' ? {
          cname: {
            name: site.domain,
            value: 'cms-site.pages.dev'
          },
          txt: {
            name: `_cf-custom-hostname.${site.domain}`,
            value: site.domain_verification_token
          }
        } : null
      }
    });
  } catch (error) {
    console.error('Get domain status error:', error);
    return c.json({ error: 'Erro ao verificar status do dominio' }, 500);
  }
});

// Remover dominio customizado
sitesRoutes.delete('/:id/domain', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    
    // Verificar acesso
    const access = await c.env.DB.prepare(`
      SELECT COALESCE(su.role, ou.role) as role
      FROM sites s
      LEFT JOIN site_users su ON s.id = su.site_id AND su.user_id = ?
      LEFT JOIN organization_users ou ON s.organization_id = ou.organization_id AND ou.user_id = ?
      WHERE s.id = ? AND (su.user_id IS NOT NULL OR ou.user_id IS NOT NULL)
    `).bind(user.sub, user.sub, id).first();
    
    if (!access || !['owner', 'admin'].includes(access.role as string)) {
      return c.json({ error: 'Sem permissao' }, 403);
    }
    
    // TODO: Remover Custom Hostname do Cloudflare for SaaS
    
    await c.env.DB.prepare(`
      UPDATE sites SET
        domain = NULL,
        domain_status = 'pending',
        domain_verification_token = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(id).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Remove domain error:', error);
    return c.json({ error: 'Erro ao remover dominio' }, 500);
  }
});

// Listar usuarios do site
sitesRoutes.get('/:id/users', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    
    // Verificar acesso
    const access = await c.env.DB.prepare(`
      SELECT COALESCE(su.role, ou.role) as role
      FROM sites s
      LEFT JOIN site_users su ON s.id = su.site_id AND su.user_id = ?
      LEFT JOIN organization_users ou ON s.organization_id = ou.organization_id AND ou.user_id = ?
      WHERE s.id = ? AND (su.user_id IS NOT NULL OR ou.user_id IS NOT NULL)
    `).bind(user.sub, user.sub, id).first();
    
    if (!access) {
      return c.json({ error: 'Sem permissao' }, 403);
    }
    
    const result = await c.env.DB.prepare(`
      SELECT u.id, u.email, u.name, u.avatar_url, su.role, su.created_at as joined_at
      FROM users u
      INNER JOIN site_users su ON u.id = su.user_id
      WHERE su.site_id = ?
      ORDER BY su.role ASC, u.name ASC
    `).bind(id).all();
    
    return c.json({ success: true, data: result.results });
  } catch (error) {
    console.error('List site users error:', error);
    return c.json({ error: 'Erro ao listar usuarios' }, 500);
  }
});

// Adicionar usuario ao site
sitesRoutes.post('/:id/users', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const data = await c.req.json();
    const { email, role } = data;
    
    // Verificar acesso
    const access = await c.env.DB.prepare(`
      SELECT COALESCE(su.role, ou.role) as role
      FROM sites s
      LEFT JOIN site_users su ON s.id = su.site_id AND su.user_id = ?
      LEFT JOIN organization_users ou ON s.organization_id = ou.organization_id AND ou.user_id = ?
      WHERE s.id = ? AND (su.user_id IS NOT NULL OR ou.user_id IS NOT NULL)
    `).bind(user.sub, user.sub, id).first();
    
    if (!access || !['owner', 'admin'].includes(access.role as string)) {
      return c.json({ error: 'Sem permissao' }, 403);
    }
    
    // Buscar usuario por email
    const targetUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first();
    
    if (!targetUser) {
      return c.json({ error: 'Usuario nao encontrado' }, 404);
    }
    
    // Verificar se ja tem acesso
    const existing = await c.env.DB.prepare(
      'SELECT id FROM site_users WHERE site_id = ? AND user_id = ?'
    ).bind(id, targetUser.id).first();
    
    if (existing) {
      return c.json({ error: 'Usuario ja tem acesso ao site' }, 400);
    }
    
    // Adicionar usuario
    const suId = `su_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    await c.env.DB.prepare(`
      INSERT INTO site_users (id, site_id, user_id, role)
      VALUES (?, ?, ?, ?)
    `).bind(suId, id, targetUser.id, role || 'editor').run();
    
    return c.json({ success: true }, 201);
  } catch (error) {
    console.error('Add site user error:', error);
    return c.json({ error: 'Erro ao adicionar usuario' }, 500);
  }
});

// Remover usuario do site
sitesRoutes.delete('/:id/users/:userId', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const userId = c.req.param('userId');
    
    // Verificar acesso
    const access = await c.env.DB.prepare(`
      SELECT COALESCE(su.role, ou.role) as role
      FROM sites s
      LEFT JOIN site_users su ON s.id = su.site_id AND su.user_id = ?
      LEFT JOIN organization_users ou ON s.organization_id = ou.organization_id AND ou.user_id = ?
      WHERE s.id = ? AND (su.user_id IS NOT NULL OR ou.user_id IS NOT NULL)
    `).bind(user.sub, user.sub, id).first();
    
    if (!access || !['owner', 'admin'].includes(access.role as string)) {
      return c.json({ error: 'Sem permissao' }, 403);
    }
    
    // Nao pode remover o owner
    const targetAccess = await c.env.DB.prepare(
      'SELECT role FROM site_users WHERE site_id = ? AND user_id = ?'
    ).bind(id, userId).first();
    
    if (targetAccess?.role === 'owner') {
      return c.json({ error: 'Nao e possivel remover o owner' }, 400);
    }
    
    await c.env.DB.prepare(
      'DELETE FROM site_users WHERE site_id = ? AND user_id = ?'
    ).bind(id, userId).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Remove site user error:', error);
    return c.json({ error: 'Erro ao remover usuario' }, 500);
  }
});
