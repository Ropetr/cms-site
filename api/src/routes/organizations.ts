/**
 * Rotas de Organizacoes (Agencias)
 */

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { getCookie } from 'hono/cookie';
import type { Env } from '../index';

export const organizationsRoutes = new Hono<{ Bindings: Env }>();

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

organizationsRoutes.use('*', authMiddleware);

// Listar organizacoes do usuario
organizationsRoutes.get('/', async (c) => {
  try {
    const user = c.get('user');
    
    const result = await c.env.DB.prepare(`
      SELECT o.*, ou.role as user_role
      FROM organizations o
      INNER JOIN organization_users ou ON o.id = ou.organization_id
      WHERE ou.user_id = ?
      ORDER BY o.name ASC
    `).bind(user.sub).all();
    
    return c.json({ success: true, data: result.results });
  } catch (error) {
    console.error('List organizations error:', error);
    return c.json({ error: 'Erro ao listar organizacoes' }, 500);
  }
});

// Buscar organizacao por ID
organizationsRoutes.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    
    // Verificar se usuario tem acesso
    const access = await c.env.DB.prepare(
      'SELECT role FROM organization_users WHERE organization_id = ? AND user_id = ?'
    ).bind(id, user.sub).first();
    
    if (!access) {
      return c.json({ error: 'Sem permissao' }, 403);
    }
    
    const org = await c.env.DB.prepare(
      'SELECT * FROM organizations WHERE id = ?'
    ).bind(id).first();
    
    if (!org) {
      return c.json({ error: 'Organizacao nao encontrada' }, 404);
    }
    
    // Contar sites e usuarios
    const stats = await c.env.DB.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM sites WHERE organization_id = ?) as sites_count,
        (SELECT COUNT(*) FROM organization_users WHERE organization_id = ?) as users_count
    `).bind(id, id).first();
    
    return c.json({
      success: true,
      data: {
        ...org,
        user_role: access.role,
        sites_count: stats?.sites_count || 0,
        users_count: stats?.users_count || 0
      }
    });
  } catch (error) {
    console.error('Get organization error:', error);
    return c.json({ error: 'Erro ao buscar organizacao' }, 500);
  }
});

// Criar organizacao
organizationsRoutes.post('/', async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    const { name, slug, logo_url, plan } = data;
    
    if (!name || !slug) {
      return c.json({ error: 'Nome e slug sao obrigatorios' }, 400);
    }
    
    // Verificar se slug ja existe
    const existing = await c.env.DB.prepare(
      'SELECT id FROM organizations WHERE slug = ?'
    ).bind(slug).first();
    
    if (existing) {
      return c.json({ error: 'Slug ja existe' }, 400);
    }
    
    const id = `org_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    
    // Criar organizacao
    await c.env.DB.prepare(`
      INSERT INTO organizations (id, name, slug, logo_url, plan)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, name, slug, logo_url || null, plan || 'free').run();
    
    // Adicionar usuario como owner
    const ouId = `ou_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    await c.env.DB.prepare(`
      INSERT INTO organization_users (id, organization_id, user_id, role)
      VALUES (?, ?, ?, 'owner')
    `).bind(ouId, id, user.sub).run();
    
    // Atualizar organization_id do usuario se nao tiver
    await c.env.DB.prepare(`
      UPDATE users SET organization_id = COALESCE(organization_id, ?) WHERE id = ?
    `).bind(id, user.sub).run();
    
    return c.json({ success: true, data: { id, slug } }, 201);
  } catch (error) {
    console.error('Create organization error:', error);
    return c.json({ error: 'Erro ao criar organizacao' }, 500);
  }
});

// Atualizar organizacao
organizationsRoutes.put('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const data = await c.req.json();
    
    // Verificar se usuario e owner ou admin
    const access = await c.env.DB.prepare(
      'SELECT role FROM organization_users WHERE organization_id = ? AND user_id = ?'
    ).bind(id, user.sub).first();
    
    if (!access || !['owner', 'admin'].includes(access.role as string)) {
      return c.json({ error: 'Sem permissao' }, 403);
    }
    
    const { name, slug, logo_url, plan, max_sites, max_users, max_storage_mb, settings } = data;
    
    // Verificar se novo slug ja existe
    if (slug) {
      const existing = await c.env.DB.prepare(
        'SELECT id FROM organizations WHERE slug = ? AND id != ?'
      ).bind(slug, id).first();
      
      if (existing) {
        return c.json({ error: 'Slug ja existe' }, 400);
      }
    }
    
    await c.env.DB.prepare(`
      UPDATE organizations SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        logo_url = ?,
        plan = COALESCE(?, plan),
        max_sites = COALESCE(?, max_sites),
        max_users = COALESCE(?, max_users),
        max_storage_mb = COALESCE(?, max_storage_mb),
        settings = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      name, slug, logo_url,
      plan, max_sites, max_users, max_storage_mb,
      settings ? JSON.stringify(settings) : null,
      id
    ).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Update organization error:', error);
    return c.json({ error: 'Erro ao atualizar organizacao' }, 500);
  }
});

// Deletar organizacao
organizationsRoutes.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    
    // Verificar se usuario e owner
    const access = await c.env.DB.prepare(
      'SELECT role FROM organization_users WHERE organization_id = ? AND user_id = ?'
    ).bind(id, user.sub).first();
    
    if (!access || access.role !== 'owner') {
      return c.json({ error: 'Apenas o owner pode deletar a organizacao' }, 403);
    }
    
    // Verificar se tem sites
    const sites = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM sites WHERE organization_id = ?'
    ).bind(id).first();
    
    if (sites && (sites.count as number) > 0) {
      return c.json({ error: 'Delete todos os sites antes de deletar a organizacao' }, 400);
    }
    
    // Deletar organization_users
    await c.env.DB.prepare('DELETE FROM organization_users WHERE organization_id = ?').bind(id).run();
    
    // Deletar organizacao
    await c.env.DB.prepare('DELETE FROM organizations WHERE id = ?').bind(id).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete organization error:', error);
    return c.json({ error: 'Erro ao deletar organizacao' }, 500);
  }
});

// Listar usuarios da organizacao
organizationsRoutes.get('/:id/users', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    
    // Verificar acesso
    const access = await c.env.DB.prepare(
      'SELECT role FROM organization_users WHERE organization_id = ? AND user_id = ?'
    ).bind(id, user.sub).first();
    
    if (!access) {
      return c.json({ error: 'Sem permissao' }, 403);
    }
    
    const result = await c.env.DB.prepare(`
      SELECT u.id, u.email, u.name, u.avatar_url, ou.role, ou.created_at as joined_at
      FROM users u
      INNER JOIN organization_users ou ON u.id = ou.user_id
      WHERE ou.organization_id = ?
      ORDER BY ou.role ASC, u.name ASC
    `).bind(id).all();
    
    return c.json({ success: true, data: result.results });
  } catch (error) {
    console.error('List organization users error:', error);
    return c.json({ error: 'Erro ao listar usuarios' }, 500);
  }
});

// Adicionar usuario a organizacao
organizationsRoutes.post('/:id/users', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const data = await c.req.json();
    const { email, role } = data;
    
    // Verificar se usuario e owner ou admin
    const access = await c.env.DB.prepare(
      'SELECT role FROM organization_users WHERE organization_id = ? AND user_id = ?'
    ).bind(id, user.sub).first();
    
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
    
    // Verificar se ja e membro
    const existing = await c.env.DB.prepare(
      'SELECT id FROM organization_users WHERE organization_id = ? AND user_id = ?'
    ).bind(id, targetUser.id).first();
    
    if (existing) {
      return c.json({ error: 'Usuario ja e membro da organizacao' }, 400);
    }
    
    // Verificar limite de usuarios
    const org = await c.env.DB.prepare(
      'SELECT max_users FROM organizations WHERE id = ?'
    ).bind(id).first();
    
    const userCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM organization_users WHERE organization_id = ?'
    ).bind(id).first();
    
    if (org && userCount && (userCount.count as number) >= (org.max_users as number)) {
      return c.json({ error: 'Limite de usuarios atingido' }, 400);
    }
    
    // Adicionar usuario
    const ouId = `ou_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    await c.env.DB.prepare(`
      INSERT INTO organization_users (id, organization_id, user_id, role)
      VALUES (?, ?, ?, ?)
    `).bind(ouId, id, targetUser.id, role || 'member').run();
    
    return c.json({ success: true }, 201);
  } catch (error) {
    console.error('Add organization user error:', error);
    return c.json({ error: 'Erro ao adicionar usuario' }, 500);
  }
});

// Remover usuario da organizacao
organizationsRoutes.delete('/:id/users/:userId', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const userId = c.req.param('userId');
    
    // Verificar se usuario e owner ou admin
    const access = await c.env.DB.prepare(
      'SELECT role FROM organization_users WHERE organization_id = ? AND user_id = ?'
    ).bind(id, user.sub).first();
    
    if (!access || !['owner', 'admin'].includes(access.role as string)) {
      return c.json({ error: 'Sem permissao' }, 403);
    }
    
    // Nao pode remover o owner
    const targetAccess = await c.env.DB.prepare(
      'SELECT role FROM organization_users WHERE organization_id = ? AND user_id = ?'
    ).bind(id, userId).first();
    
    if (targetAccess?.role === 'owner') {
      return c.json({ error: 'Nao e possivel remover o owner' }, 400);
    }
    
    // Remover de site_users tambem
    await c.env.DB.prepare(`
      DELETE FROM site_users 
      WHERE user_id = ? AND site_id IN (SELECT id FROM sites WHERE organization_id = ?)
    `).bind(userId, id).run();
    
    // Remover da organizacao
    await c.env.DB.prepare(
      'DELETE FROM organization_users WHERE organization_id = ? AND user_id = ?'
    ).bind(id, userId).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Remove organization user error:', error);
    return c.json({ error: 'Erro ao remover usuario' }, 500);
  }
});

// Listar sites da organizacao
organizationsRoutes.get('/:id/sites', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    
    // Verificar acesso
    const access = await c.env.DB.prepare(
      'SELECT role FROM organization_users WHERE organization_id = ? AND user_id = ?'
    ).bind(id, user.sub).first();
    
    if (!access) {
      return c.json({ error: 'Sem permissao' }, 403);
    }
    
    const result = await c.env.DB.prepare(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM pages WHERE site_id = s.id) as pages_count,
        (SELECT COUNT(*) FROM posts WHERE site_id = s.id) as posts_count
      FROM sites s
      WHERE s.organization_id = ?
      ORDER BY s.name ASC
    `).bind(id).all();
    
    return c.json({ success: true, data: result.results });
  } catch (error) {
    console.error('List organization sites error:', error);
    return c.json({ error: 'Erro ao listar sites' }, 500);
  }
});
