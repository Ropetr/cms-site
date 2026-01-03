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
