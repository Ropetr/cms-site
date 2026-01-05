/**
 * CMS Site API
 * Worker principal que gerencia todas as rotas da API
 * 
 * CORREÇÕES DE SEGURANÇA:
 * - CORS não permite localhost em produção
 * - Error handler não expõe mensagens internas
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';

// Rotas
import { authRoutes } from './routes/auth';
import { pagesRoutes } from './routes/pages';
import { menusRoutes } from './routes/menus';
import { menuItemsRoutes } from './routes/menu-items';
import { mediaRoutes } from './routes/media';
import { settingsRoutes } from './routes/settings';
import { themesRoutes } from './routes/themes';
import { contactsRoutes } from './routes/contacts';
import { postsRoutes } from './routes/posts';
import { categoriesRoutes } from './routes/categories';
import { publicRoutes } from './routes/public';
import { aiRoutes } from './routes/ai';
import { seoRoutes } from './routes/seo';
import { organizationsRoutes } from './routes/organizations';
import { sitesRoutes } from './routes/sites';
import auditRoutes from './routes/audit';
import cacheRoutes from './routes/cache';
import queueRoutes from './routes/queue';

// Types
export interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  CACHE: KVNamespace;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
  ADMIN_ORIGIN: string;
  SITE_ORIGIN: string;
  ENVIRONMENT?: string;
  AI: any; // Workers AI binding
  IMAGES: any; // Cloudflare Images binding
}

// Presets de imagem (whitelist)
const IMAGE_PRESETS: Record<string, { w: number; h: number; fit: string; q: number }> = {
  // Banners
  banner_desktop: { w: 1920, h: 710, fit: 'cover', q: 85 },
  banner_tablet: { w: 1200, h: 500, fit: 'cover', q: 80 },
  banner_mobile: { w: 768, h: 540, fit: 'cover', q: 75 },
  
  // Produtos
  product_large: { w: 1200, h: 1200, fit: 'cover', q: 85 },
  product_card: { w: 800, h: 800, fit: 'cover', q: 80 },
  product_thumb: { w: 400, h: 400, fit: 'cover', q: 75 },
  
  // Galeria
  gallery_large: { w: 1600, h: 1000, fit: 'cover', q: 85 },
  gallery_medium: { w: 800, h: 500, fit: 'cover', q: 80 },
  gallery_thumb: { w: 400, h: 300, fit: 'cover', q: 75 },
  
  // Social/SEO
  og_image: { w: 1200, h: 630, fit: 'cover', q: 80 },
  
  // Avatars/Team
  avatar_large: { w: 200, h: 200, fit: 'cover', q: 80 },
  avatar_small: { w: 80, h: 80, fit: 'cover', q: 75 },
  team_photo: { w: 400, h: 400, fit: 'cover', q: 80 },
  
  // Blog
  blog_featured: { w: 1200, h: 630, fit: 'cover', q: 85 },
  blog_card: { w: 600, h: 400, fit: 'cover', q: 80 },
  blog_thumb: { w: 300, h: 200, fit: 'cover', q: 75 },
  
  // Thumbnails genéricos
  thumb_small: { w: 150, h: 150, fit: 'cover', q: 70 },
  thumb_medium: { w: 300, h: 300, fit: 'cover', q: 75 },
  thumb_large: { w: 600, h: 600, fit: 'cover', q: 80 },
};

// App
const app = new Hono<{ Bindings: Env }>();

// Middlewares globais
app.use('*', logger());
app.use('*', secureHeaders());

// CORS - SEGURO: não permite localhost em produção
app.use('*', cors({
  origin: (origin, c) => {
    const isProduction = c.env.ENVIRONMENT === 'production' || 
                         !c.env.ADMIN_ORIGIN?.includes('localhost');
    
    // Origens permitidas
    const allowedOrigins = [
      c.env.ADMIN_ORIGIN,
      c.env.SITE_ORIGIN,
    ].filter(Boolean);
    
    // Adicionar localhost APENAS em desenvolvimento
    if (!isProduction) {
      allowedOrigins.push(
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:4321'
      );
    }
    
    if (!origin || allowedOrigins.includes(origin)) {
      return origin || (isProduction ? null : '*');
    }
    return null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Site-Id'],
  credentials: true,
  maxAge: 86400,
}));

// Health check
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.1.0'
  });
});

// Rotas públicas (sem autenticação)
app.route('/api/public', publicRoutes);

// Rotas autenticadas (admin)
app.route('/api/auth', authRoutes);
app.route('/api/pages', pagesRoutes);
app.route('/api/menus', menusRoutes);
app.route('/api/menu-items', menuItemsRoutes);
app.route('/api/media', mediaRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/themes', themesRoutes);
app.route('/api/contacts', contactsRoutes);
app.route('/api/posts', postsRoutes);
app.route('/api/categories', categoriesRoutes);
app.route('/api/ai', aiRoutes);
app.route('/api/organizations', organizationsRoutes);
app.route('/api/sites', sitesRoutes);
app.route('/api/audit', auditRoutes);
app.route('/api/cache', cacheRoutes);
app.route('/api/queue', queueRoutes);

// SEO routes (sitemap.xml, robots.txt)
app.route('', seoRoutes);

// =============================================
// ROTA DE IMAGENS OTIMIZADAS
// =============================================

app.get('/images/*', async (c) => {
  try {
    // Extrair o path completo após /images/
    const url = new URL(c.req.url);
    const fullPath = url.pathname.replace('/images/', '');
    const preset = c.req.query('preset');
    
    if (!fullPath) {
      return c.json({ error: 'Path inválido' }, 400);
    }
    
    // Buscar imagem do R2
    const object = await c.env.MEDIA.get(fullPath);
    
    if (!object) {
      return c.json({ error: 'Imagem não encontrada' }, 404);
    }
    
    // Se não tem preset, retorna original
    if (!preset || !IMAGE_PRESETS[preset]) {
      const headers = new Headers();
      headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      headers.set('ETag', object.etag);
      
      return new Response(object.body, { headers });
    }
    
    // Aplicar transformação via Cloudflare Images
    const config = IMAGE_PRESETS[preset];
    const imageUrl = `https://cms-site-api.planacacabamentos.workers.dev/images/${fullPath}`;
    
    // Usar fetch com cf.image para transformação
    const transformedResponse = await fetch(imageUrl, {
      cf: {
        image: {
          width: config.w,
          height: config.h,
          fit: config.fit as any,
          quality: config.q,
          format: 'auto'
        }
      }
    });
    
    if (!transformedResponse.ok) {
      // Fallback para original se transformação falhar
      const headers = new Headers();
      headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      return new Response(object.body, { headers });
    }
    
    // Adicionar headers de cache
    const headers = new Headers(transformedResponse.headers);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('Vary', 'Accept');
    
    return new Response(transformedResponse.body, { 
      headers,
      status: transformedResponse.status 
    });
    
  } catch (error) {
    console.error('Image serve error:', error);
    return c.json({ error: 'Erro ao servir imagem' }, 500);
  }
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler - SEGURO: não expõe mensagens internas
app.onError((err, c) => {
  // Log completo para debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: c.req.url,
    method: c.req.method,
  });
  
  // Resposta genérica para o cliente (não expõe detalhes internos)
  const isProduction = c.env.ENVIRONMENT === 'production' || 
                       !c.env.ADMIN_ORIGIN?.includes('localhost');
  
  if (isProduction) {
    return c.json({ error: 'Internal server error' }, 500);
  }
  
  // Em desenvolvimento, mostrar mais detalhes
  return c.json({ 
    error: 'Internal server error',
    details: err.message 
  }, 500);
});

export default app;
