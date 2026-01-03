/**
 * CMS Site API
 * Worker principal que gerencia todas as rotas da API
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';

// Rotas
import { authRoutes } from './routes/auth';
import { pagesRoutes } from './routes/pages';
import { menusRoutes } from './routes/menus';
import { mediaRoutes } from './routes/media';
import { settingsRoutes } from './routes/settings';
import { themesRoutes } from './routes/themes';
import { contactsRoutes } from './routes/contacts';
import { publicRoutes } from './routes/public';

// Types
export interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  CACHE: KVNamespace;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
  ADMIN_ORIGIN: string;
  SITE_ORIGIN: string;
}

// App
const app = new Hono<{ Bindings: Env }>();

// Middlewares globais
app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', cors({
  origin: (origin, c) => {
    const allowedOrigins = [
      c.env.ADMIN_ORIGIN,
      c.env.SITE_ORIGIN,
      'http://localhost:3000',
      'http://localhost:5173',
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      return origin || '*';
    }
    return null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Rotas públicas (site)
app.route('/api/public', publicRoutes);

// Rotas autenticadas (admin)
app.route('/api/auth', authRoutes);
app.route('/api/pages', pagesRoutes);
app.route('/api/menus', menusRoutes);
app.route('/api/media', mediaRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/themes', themesRoutes);
app.route('/api/contacts', contactsRoutes);

// Rota de imagens otimizadas
app.get('/images/:id', async (c) => {
  const id = c.req.param('id');
  const width = c.req.query('w') || c.req.query('width');
  const quality = c.req.query('q') || c.req.query('quality') || '85';
  const format = c.req.query('f') || c.req.query('format') || 'auto';
  
  // Buscar imagem do R2
  const object = await c.env.MEDIA.get(id);
  
  if (!object) {
    return c.json({ error: 'Image not found' }, 404);
  }
  
  // Retornar com headers de cache
  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('CDN-Cache-Control', 'public, max-age=31536000');
  
  // Se width especificado, usar Cloudflare Image Resizing
  if (width) {
    const imageUrl = `${c.req.url.split('/images/')[0]}/raw/${id}`;
    return c.redirect(`/cdn-cgi/image/width=${width},quality=${quality},format=${format}/${imageUrl}`);
  }
  
  return new Response(object.body, { headers });
});

// Rota raw para servir imagem original (usado pelo Image Resizing)
app.get('/raw/:id', async (c) => {
  const id = c.req.param('id');
  const object = await c.env.MEDIA.get(id);
  
  if (!object) {
    return c.json({ error: 'Image not found' }, 404);
  }
  
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
});

// 404
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Internal server error', message: err.message }, 500);
});

export default app;
