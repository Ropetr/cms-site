/**
 * Rotas Públicas (Site Frontend)
 * Endpoints acessíveis sem autenticação
 */

import { Hono } from 'hono';
import type { Env } from '../index';

export const publicRoutes = new Hono<{ Bindings: Env }>();

// Cache helper
async function getFromCache<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const cached = await kv.get(key);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }
  return null;
}

async function setCache(kv: KVNamespace, key: string, value: any, ttl: number = 300): Promise<void> {
  await kv.put(key, JSON.stringify(value), { expirationTtl: ttl });
}

// ==================== CONFIGURAÇÕES ====================

// Configurações do site (logo, contato, redes sociais)
publicRoutes.get('/settings', async (c) => {
  try {
    // Tentar cache primeiro
    const cached = await getFromCache(c.env.CACHE, 'public:settings');
    if (cached) {
      return c.json({ success: true, data: cached });
    }
    
    const result = await c.env.DB.prepare(
      'SELECT key, value, type FROM settings'
    ).all();
    
    // Converter para objeto
    const settings: Record<string, any> = {};
    for (const row of result.results as any[]) {
      let value = row.value;
      if (row.type === 'json' && value) {
        try { value = JSON.parse(value); } catch {}
      } else if (row.type === 'boolean') {
        value = value === 'true';
      } else if (row.type === 'number') {
        value = Number(value);
      }
      settings[row.key] = value;
    }
    
    // Cache por 5 minutos
    await setCache(c.env.CACHE, 'public:settings', settings, 300);
    
    return c.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get public settings error:', error);
    return c.json({ error: 'Erro ao buscar configurações' }, 500);
  }
});

// ==================== TEMA ====================

// Tema ativo
publicRoutes.get('/theme', async (c) => {
  try {
    const cached = await getFromCache(c.env.CACHE, 'public:theme');
    if (cached) {
      return c.json({ success: true, data: cached });
    }
    
    const theme = await c.env.DB.prepare(
      'SELECT colors, fonts FROM themes WHERE is_active = 1'
    ).first();
    
    if (!theme) {
      return c.json({ error: 'Nenhum tema ativo' }, 404);
    }
    
    const data = {
      colors: JSON.parse(theme.colors as string || '{}'),
      fonts: theme.fonts ? JSON.parse(theme.fonts as string) : null,
    };
    
    await setCache(c.env.CACHE, 'public:theme', data, 300);
    
    return c.json({ success: true, data });
  } catch (error) {
    console.error('Get public theme error:', error);
    return c.json({ error: 'Erro ao buscar tema' }, 500);
  }
});

// ==================== NAVEGAÇÃO ====================

// Menu de navegação completo
publicRoutes.get('/navigation', async (c) => {
  try {
    const cached = await getFromCache(c.env.CACHE, 'public:navigation');
    if (cached) {
      return c.json({ success: true, data: cached });
    }
    
    // Buscar menus visíveis
    const menusResult = await c.env.DB.prepare(
      'SELECT id, name, slug, icon, parent_id FROM menus WHERE is_visible = 1 ORDER BY position ASC'
    ).all();
    
    // Buscar páginas publicadas
    const pagesResult = await c.env.DB.prepare(
      'SELECT id, title, slug, menu_id FROM pages WHERE status = ? AND menu_id IS NOT NULL ORDER BY position ASC'
    ).bind('published').all();
    
    const menus = menusResult.results as any[];
    const pages = pagesResult.results as any[];
    
    // Montar estrutura hierárquica
    const menuMap = new Map();
    menus.forEach(menu => {
      menuMap.set(menu.id, { 
        ...menu, 
        children: [],
        pages: pages.filter(p => p.menu_id === menu.id)
      });
    });
    
    const navigation: any[] = [];
    menus.forEach(menu => {
      const menuItem = menuMap.get(menu.id);
      if (menu.parent_id) {
        const parent = menuMap.get(menu.parent_id);
        if (parent) {
          parent.children.push(menuItem);
        }
      } else {
        navigation.push(menuItem);
      }
    });
    
    await setCache(c.env.CACHE, 'public:navigation', navigation, 300);
    
    return c.json({ success: true, data: navigation });
  } catch (error) {
    console.error('Get navigation error:', error);
    return c.json({ error: 'Erro ao buscar navegação' }, 500);
  }
});

// ==================== PÁGINAS ====================

// Listar páginas publicadas
publicRoutes.get('/pages', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT 
        p.id, p.title, p.slug, p.page_type, p.excerpt, p.banner_image,
        p.meta_title, p.meta_description, p.is_featured,
        m.name as menu_name, m.slug as menu_slug
      FROM pages p
      LEFT JOIN menus m ON p.menu_id = m.id
      WHERE p.status = 'published'
      ORDER BY p.is_featured DESC, p.position ASC
    `).all();
    
    return c.json({ success: true, data: result.results });
  } catch (error) {
    console.error('Get public pages error:', error);
    return c.json({ error: 'Erro ao buscar páginas' }, 500);
  }
});

// Buscar página por slug
publicRoutes.get('/pages/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    
    // Tentar cache
    const cached = await getFromCache(c.env.CACHE, `public:page:${slug}`);
    if (cached) {
      return c.json({ success: true, data: cached });
    }
    
    const page = await c.env.DB.prepare(`
      SELECT 
        p.*,
        m.name as menu_name, m.slug as menu_slug
      FROM pages p
      LEFT JOIN menus m ON p.menu_id = m.id
      WHERE p.slug = ? AND p.status = 'published'
    `).bind(slug).first();
    
    if (!page) {
      return c.json({ error: 'Página não encontrada' }, 404);
    }
    
    // Buscar seções
    const sections = await c.env.DB.prepare(
      'SELECT * FROM page_sections WHERE page_id = ? AND is_visible = 1 ORDER BY position ASC'
    ).bind(page.id).all();
    
    // Parsear conteúdo das seções
    const parsedSections = sections.results.map((section: any) => ({
      ...section,
      content: section.content ? JSON.parse(section.content) : null,
    }));
    
    const data = { ...page, sections: parsedSections };
    
    // Cache por 5 minutos
    await setCache(c.env.CACHE, `public:page:${slug}`, data, 300);
    
    return c.json({ success: true, data });
  } catch (error) {
    console.error('Get public page error:', error);
    return c.json({ error: 'Erro ao buscar página' }, 500);
  }
});

// Preview de página (funciona para draft e published)
// Não usa cache para sempre mostrar dados atualizados
publicRoutes.get('/preview/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    
    // Buscar página sem filtrar por status (permite draft e published)
    const page = await c.env.DB.prepare(`
      SELECT 
        p.*,
        m.name as menu_name, m.slug as menu_slug
      FROM pages p
      LEFT JOIN menus m ON p.menu_id = m.id
      WHERE p.slug = ?
    `).bind(slug).first();
    
    if (!page) {
      return c.json({ error: 'Página não encontrada' }, 404);
    }
    
    // Buscar seções (incluindo não visíveis para preview completo)
    const sections = await c.env.DB.prepare(
      'SELECT * FROM page_sections WHERE page_id = ? ORDER BY position ASC'
    ).bind(page.id).all();
    
    // Parsear conteúdo das seções
    const parsedSections = sections.results.map((section: any) => ({
      ...section,
      content: section.content ? JSON.parse(section.content) : null,
    }));
    
    const data = { ...page, sections: parsedSections, isPreview: true };
    
    return c.json({ success: true, data });
  } catch (error) {
    console.error('Get preview page error:', error);
    return c.json({ error: 'Erro ao buscar página para preview' }, 500);
  }
});

// Página inicial
publicRoutes.get('/home', async (c) => {
  try {
    const cached = await getFromCache(c.env.CACHE, 'public:home');
    if (cached) {
      return c.json({ success: true, data: cached });
    }
    
    const page = await c.env.DB.prepare(`
      SELECT * FROM pages WHERE page_type = 'home' AND status = 'published' LIMIT 1
    `).first();
    
    if (!page) {
      return c.json({ error: 'Página inicial não encontrada' }, 404);
    }
    
    const sections = await c.env.DB.prepare(
      'SELECT * FROM page_sections WHERE page_id = ? AND is_visible = 1 ORDER BY position ASC'
    ).bind(page.id).all();
    
    const data = {
      ...page,
      sections: sections.results.map((s: any) => ({
        ...s,
        content: s.content ? JSON.parse(s.content) : null,
      })),
    };
    
    await setCache(c.env.CACHE, 'public:home', data, 300);
    
    return c.json({ success: true, data });
  } catch (error) {
    console.error('Get home page error:', error);
    return c.json({ error: 'Erro ao buscar página inicial' }, 500);
  }
});

// ==================== CONTATO ====================

// Enviar formulário de contato
publicRoutes.post('/contact', async (c) => {
  try {
    const data = await c.req.json();
    const { name, email, phone, city, project_type, message, source_page } = data;
    
    // Validações
    if (!name || !email) {
      return c.json({ error: 'Nome e email são obrigatórios' }, 400);
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Email inválido' }, 400);
    }
    
    const id = `contact_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    
    await c.env.DB.prepare(`
      INSERT INTO contacts (id, name, email, phone, city, project_type, message, source_page, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')
    `).bind(id, name, email, phone, city, project_type, message, source_page).run();
    
    return c.json({ 
      success: true, 
      message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.' 
    }, 201);
  } catch (error) {
    console.error('Submit contact error:', error);
    return c.json({ error: 'Erro ao enviar mensagem' }, 500);
  }
});

// ==================== SITEMAP ====================

// Gerar sitemap.xml
publicRoutes.get('/sitemap.xml', async (c) => {
  try {
    const cached = await c.env.CACHE.get('public:sitemap');
    if (cached) {
      return new Response(cached, {
        headers: { 'Content-Type': 'application/xml' },
      });
    }
    
    const baseUrl = c.req.header('X-Forwarded-Host') 
      ? `https://${c.req.header('X-Forwarded-Host')}`
      : new URL(c.req.url).origin;
    
    const pages = await c.env.DB.prepare(
      "SELECT slug, updated_at FROM pages WHERE status = 'published'"
    ).all();
    
    const urls = pages.results.map((page: any) => `
  <url>
    <loc>${baseUrl}/${page.slug}</loc>
    <lastmod>${page.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.slug === 'home' ? '1.0' : '0.8'}</priority>
  </url>`).join('');
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>${urls}
</urlset>`;
    
    // Cache por 1 hora
    await c.env.CACHE.put('public:sitemap', sitemap, { expirationTtl: 3600 });
    
    return new Response(sitemap, {
      headers: { 'Content-Type': 'application/xml' },
    });
  } catch (error) {
    console.error('Generate sitemap error:', error);
    return c.json({ error: 'Erro ao gerar sitemap' }, 500);
  }
});

// ==================== BUSCA ====================

// Buscar no site
publicRoutes.get('/search', async (c) => {
  try {
    const query = c.req.query('q');
    
    if (!query || query.length < 2) {
      return c.json({ error: 'Termo de busca muito curto' }, 400);
    }
    
    const result = await c.env.DB.prepare(`
      SELECT id, title, slug, excerpt, page_type
      FROM pages
      WHERE status = 'published'
        AND (title LIKE ? OR content LIKE ? OR excerpt LIKE ?)
      ORDER BY is_featured DESC, title ASC
      LIMIT 20
    `).bind(`%${query}%`, `%${query}%`, `%${query}%`).all();
    
    return c.json({ success: true, data: result.results });
  } catch (error) {
    console.error('Search error:', error);
    return c.json({ error: 'Erro na busca' }, 500);
  }
});

// ==================== BLOG ====================

// Listar posts publicados
publicRoutes.get('/posts', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = parseInt(c.req.query('offset') || '0');
    const category = c.req.query('category');
    const featured = c.req.query('featured');
    const source = c.req.query('source'); // 'latest' ou 'featured'

    let query = `
      SELECT p.id, p.title, p.slug, p.excerpt, p.featured_image, p.published_at, p.views,
             c.name as category_name, c.slug as category_slug, c.color as category_color,
             u.name as author_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.status = 'published'
    `;
    const params: any[] = [];

    if (category) {
      query += ' AND c.slug = ?';
      params.push(category);
    }

    if (featured === 'true' || source === 'featured') {
      query += ' AND p.is_featured = 1';
    }

    query += ' ORDER BY p.published_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await c.env.DB.prepare(query).bind(...params).all();

    // Total count
    let countQuery = 'SELECT COUNT(*) as total FROM posts WHERE status = ?';
    const countParams: any[] = ['published'];
    if (category) {
      countQuery = `SELECT COUNT(*) as total FROM posts p LEFT JOIN categories c ON p.category_id = c.id WHERE p.status = ? AND c.slug = ?`;
      countParams.push(category);
    }
    const count = await c.env.DB.prepare(countQuery).bind(...countParams).first();

    return c.json({
      success: true,
      data: result.results,
      pagination: { total: count?.total || 0, limit, offset }
    });
  } catch (error) {
    console.error('List public posts error:', error);
    return c.json({ error: 'Erro ao listar posts' }, 500);
  }
});

// Buscar post por slug
publicRoutes.get('/posts/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');

    const post = await c.env.DB.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
             u.name as author_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.slug = ? AND p.status = 'published'
    `).bind(slug).first();

    if (!post) {
      return c.json({ error: 'Post não encontrado' }, 404);
    }

    // Incrementar views
    await c.env.DB.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').bind(post.id).run();

    // Posts relacionados (mesma categoria)
    let related: any[] = [];
    if (post.category_id) {
      const relatedResult = await c.env.DB.prepare(`
        SELECT id, title, slug, excerpt, featured_image, published_at
        FROM posts
        WHERE category_id = ? AND id != ? AND status = 'published'
        ORDER BY published_at DESC
        LIMIT 3
      `).bind(post.category_id, post.id).all();
      related = relatedResult.results;
    }

    return c.json({ success: true, data: { ...post, related } });
  } catch (error) {
    console.error('Get public post error:', error);
    return c.json({ error: 'Erro ao buscar post' }, 500);
  }
});

// Listar categorias (pública)
publicRoutes.get('/categories', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT c.id, c.name, c.slug, c.description, c.color, COUNT(p.id) as posts_count
      FROM categories c
      LEFT JOIN posts p ON p.category_id = c.id AND p.status = 'published'
      GROUP BY c.id
      HAVING posts_count > 0 OR 1=1
      ORDER BY c.name ASC
    `).all();

    return c.json({ success: true, data: result.results });
  } catch (error) {
    console.error('List public categories error:', error);
    return c.json({ error: 'Erro ao listar categorias' }, 500);
  }
});

// ==================== TENANT RESOLUTION ====================

// Resolver tenant por host (domínio ou subdomínio)
publicRoutes.get('/resolve-tenant', async (c) => {
  try {
    const host = c.req.query('host');
    
    if (!host) {
      return c.json({ error: 'Host parameter is required' }, 400);
    }
    
    // Remove port if present
    const cleanHost = host.split(':')[0];
    
    // Try to find site by custom domain first
    let site = await c.env.DB.prepare(`
      SELECT id, name, slug, domain, subdomain, organization_id
      FROM sites
      WHERE domain = ? AND status = 'active'
    `).bind(cleanHost).first();
    
    // If not found by domain, try subdomain pattern (e.g., cliente.fiosites.com)
    if (!site) {
      const parts = cleanHost.split('.');
      if (parts.length >= 3) {
        const subdomain = parts[0];
        site = await c.env.DB.prepare(`
          SELECT id, name, slug, domain, subdomain, organization_id
          FROM sites
          WHERE subdomain = ? AND status = 'active'
        `).bind(subdomain).first();
      }
    }
    
    // If still not found, return default site (id = 1)
    if (!site) {
      site = await c.env.DB.prepare(`
        SELECT id, name, slug, domain, subdomain, organization_id
        FROM sites
        WHERE id = 1
      `).first();
    }
    
    if (!site) {
      return c.json({ error: 'Site not found' }, 404);
    }
    
    return c.json({ success: true, data: site });
  } catch (error) {
    console.error('Resolve tenant error:', error);
    return c.json({ error: 'Erro ao resolver tenant' }, 500);
  }
});
