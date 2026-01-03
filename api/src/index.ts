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
import { postsRoutes } from './routes/posts';
import { categoriesRoutes } from './routes/categories';
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
app.use('*', cors({
  origin: (origin, c) => {
    const allowedOrigins = [
      c.env.ADMIN_ORIGIN,
      c.env.SITE_ORIGIN,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4321', // Astro dev
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
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

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
app.route('/api/posts', postsRoutes);
app.route('/api/categories', categoriesRoutes);

// =============================================
// ROTA DE IMAGENS OTIMIZADAS
// =============================================

/**
 * GET /images/:filename
 * 
 * Serve imagens do R2 com otimização opcional via Cloudflare Image Resizing
 * 
 * Query params:
 * - preset: Nome do preset (ex: banner_desktop, product_card)
 * - w / width: Largura customizada
 * - h / height: Altura customizada
 * - q / quality: Qualidade (1-100, default: 85)
 * - f / format: Formato (auto, webp, avif, original)
 * - fit: cover, contain, scale-down, crop
 * - focal: Ponto focal no formato "x,y" (0-1)
 * 
 * Exemplos:
 * - /images/photo.jpg?preset=banner_desktop
 * - /images/photo.jpg?w=800&h=600&q=80
 * - /images/photo.jpg?preset=product_card&focal=0.7,0.3
 */
app.get('/images/:filename', async (c) => {
  const filename = c.req.param('filename');
  const url = new URL(c.req.url);
  
  // Parâmetros
  const preset = url.searchParams.get('preset');
  const width = url.searchParams.get('w') || url.searchParams.get('width');
  const height = url.searchParams.get('h') || url.searchParams.get('height');
  const quality = url.searchParams.get('q') || url.searchParams.get('quality');
  const format = url.searchParams.get('f') || url.searchParams.get('format') || 'auto';
  const fit = url.searchParams.get('fit') || 'cover';
  const focal = url.searchParams.get('focal');
  
  // Buscar imagem do R2
  const object = await c.env.MEDIA.get(filename);
  
  if (!object) {
    return c.json({ error: 'Image not found' }, 404);
  }
  
  // Buscar metadados de ponto focal do banco se não especificado
  let focalX = 0.5;
  let focalY = 0.5;
  
  if (focal) {
    const [fx, fy] = focal.split(',').map(Number);
    focalX = fx || 0.5;
    focalY = fy || 0.5;
  } else {
    // Tentar buscar do banco
    try {
      const mediaRecord = await c.env.DB.prepare(
        'SELECT focal_x, focal_y FROM media WHERE file_name = ?'
      ).bind(filename).first();
      
      if (mediaRecord) {
        focalX = (mediaRecord.focal_x as number) || 0.5;
        focalY = (mediaRecord.focal_y as number) || 0.5;
      }
    } catch (e) {
      // Ignora erro e usa padrão
    }
  }
  
  // Determinar dimensões finais
  let finalWidth: number | undefined;
  let finalHeight: number | undefined;
  let finalQuality = 85;
  
  if (preset && IMAGE_PRESETS[preset]) {
    const presetConfig = IMAGE_PRESETS[preset];
    finalWidth = presetConfig.w;
    finalHeight = presetConfig.h;
    finalQuality = presetConfig.q;
  }
  
  // Override com parâmetros customizados
  if (width) finalWidth = parseInt(width);
  if (height) finalHeight = parseInt(height);
  if (quality) finalQuality = parseInt(quality);
  
  // Se não há redimensionamento, retornar original
  if (!finalWidth && !finalHeight) {
    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('CDN-Cache-Control', 'public, max-age=31536000');
    
    return new Response(object.body, { headers });
  }
  
  // Usar Cloudflare Image Resizing
  // Construir URL de origem
  const originUrl = `${url.origin}/raw/${filename}`;
  
  // Construir parâmetros de transformação
  const transformParams: string[] = [];
  
  if (finalWidth) transformParams.push(`width=${finalWidth}`);
  if (finalHeight) transformParams.push(`height=${finalHeight}`);
  transformParams.push(`quality=${finalQuality}`);
  transformParams.push(`fit=${fit}`);
  
  // Formato: auto detecta WebP/AVIF baseado no Accept header
  if (format === 'auto') {
    transformParams.push('format=auto');
  } else if (format !== 'original') {
    transformParams.push(`format=${format}`);
  }
  
  // Gravity baseado no ponto focal
  // Cloudflare usa gravity como coordenadas relativas
  transformParams.push(`gravity=${focalX}x${focalY}`);
  
  // URL final com Image Resizing
  const transformUrl = `/cdn-cgi/image/${transformParams.join(',')}/${originUrl}`;
  
  // Redirecionar para a URL transformada
  return c.redirect(transformUrl, 302);
});

// Rota raw para servir imagem original (usado pelo Image Resizing)
app.get('/raw/:filename', async (c) => {
  const filename = c.req.param('filename');
  const object = await c.env.MEDIA.get(filename);
  
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

// Endpoint para listar presets disponíveis
app.get('/api/image-presets', (c) => {
  return c.json({
    presets: Object.entries(IMAGE_PRESETS).map(([name, config]) => ({
      name,
      ...config,
    })),
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
