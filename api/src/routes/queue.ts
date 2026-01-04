/**
 * Rotas de Queue
 * Enfileiramento de tarefas assíncronas
 */

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { getCookie } from 'hono/cookie';
import type { Env } from '../index';

interface QueueEnv extends Env {
  TASKS_QUEUE?: Queue;
}

export const queueRoutes = new Hono<{ Bindings: QueueEnv }>();

const authMiddleware = async (c: any, next: any) => {
  try {
    const token = getCookie(c, 'auth_token') || c.req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return c.json({ error: 'Não autenticado' }, 401);
    const payload = await verify(token, c.env.JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch {
    return c.json({ error: 'Token inválido' }, 401);
  }
};

queueRoutes.use('*', authMiddleware);

queueRoutes.post('/sitemap', async (c) => {
  try {
    const siteId = c.req.header('X-Site-Id');
    const { domain } = await c.req.json();

    if (!siteId) {
      return c.json({ error: 'X-Site-Id header é obrigatório' }, 400);
    }

    if (!domain) {
      return c.json({ error: 'domain é obrigatório' }, 400);
    }

    const message = {
      type: 'sitemap:generate',
      payload: { siteId, domain },
      timestamp: Date.now(),
    };

    if (c.env.TASKS_QUEUE) {
      await c.env.TASKS_QUEUE.send(message);
      return c.json({
        success: true,
        message: 'Geração de sitemap enfileirada',
        queued: true,
      });
    }

    const pages = await c.env.DB.prepare(`
      SELECT slug, updated_at FROM pages 
      WHERE site_id = ? AND status = 'published'
      ORDER BY updated_at DESC
    `).bind(siteId).all();

    const posts = await c.env.DB.prepare(`
      SELECT slug, updated_at FROM posts 
      WHERE site_id = ? AND status = 'published'
      ORDER BY updated_at DESC
    `).bind(siteId).all();

    const urls: string[] = [];
    urls.push(`<url><loc>https://${domain}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`);

    for (const page of pages.results || []) {
      const slug = page.slug as string;
      const updatedAt = page.updated_at as string;
      urls.push(`<url><loc>https://${domain}/${slug}</loc><lastmod>${updatedAt}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
    }

    for (const post of posts.results || []) {
      const slug = post.slug as string;
      const updatedAt = post.updated_at as string;
      urls.push(`<url><loc>https://${domain}/blog/${slug}</loc><lastmod>${updatedAt}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`);
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    await c.env.CACHE.put(`${siteId}:sitemap.xml`, sitemap, {
      expirationTtl: 86400,
    });

    return c.json({
      success: true,
      message: 'Sitemap gerado com sucesso',
      urls: urls.length,
      queued: false,
    });
  } catch (error) {
    console.error('Queue sitemap error:', error);
    return c.json({ error: 'Erro ao gerar sitemap' }, 500);
  }
});

queueRoutes.post('/process-image', async (c) => {
  try {
    const siteId = c.req.header('X-Site-Id');
    const { mediaId, filename, operations } = await c.req.json();

    if (!siteId) {
      return c.json({ error: 'X-Site-Id header é obrigatório' }, 400);
    }

    if (!mediaId || !filename) {
      return c.json({ error: 'mediaId e filename são obrigatórios' }, 400);
    }

    const message = {
      type: 'image:process',
      payload: { siteId, mediaId, filename, operations: operations || ['optimize'] },
      timestamp: Date.now(),
    };

    if (c.env.TASKS_QUEUE) {
      await c.env.TASKS_QUEUE.send(message);
      return c.json({
        success: true,
        message: 'Processamento de imagem enfileirado',
        queued: true,
      });
    }

    return c.json({
      success: true,
      message: 'Processamento de imagem registrado (sem queue)',
      queued: false,
    });
  } catch (error) {
    console.error('Queue process-image error:', error);
    return c.json({ error: 'Erro ao enfileirar processamento de imagem' }, 500);
  }
});

queueRoutes.post('/bulk-import', async (c) => {
  try {
    const siteId = c.req.header('X-Site-Id');
    const user = c.get('user' as never) as { sub: string } | undefined;
    const { type, items } = await c.req.json();

    if (!siteId) {
      return c.json({ error: 'X-Site-Id header é obrigatório' }, 400);
    }

    if (!type || !items || !Array.isArray(items)) {
      return c.json({ error: 'type e items são obrigatórios' }, 400);
    }

    if (!['pages', 'posts', 'media'].includes(type)) {
      return c.json({ error: 'type deve ser pages, posts ou media' }, 400);
    }

    const message = {
      type: 'import:bulk',
      payload: { siteId, type, items, userId: user?.sub || 'unknown' },
      timestamp: Date.now(),
    };

    if (c.env.TASKS_QUEUE) {
      await c.env.TASKS_QUEUE.send(message);
      return c.json({
        success: true,
        message: `Import de ${items.length} ${type} enfileirado`,
        queued: true,
        count: items.length,
      });
    }

    let imported = 0;
    let failed = 0;

    for (const item of items) {
      try {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        if (type === 'pages') {
          await c.env.DB.prepare(`
            INSERT INTO pages (id, site_id, title, slug, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'draft', ?, ?)
          `).bind(id, siteId, item.title, item.slug, now, now).run();
        } else if (type === 'posts') {
          await c.env.DB.prepare(`
            INSERT INTO posts (id, site_id, title, slug, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'draft', ?, ?)
          `).bind(id, siteId, item.title, item.slug, now, now).run();
        }

        imported++;
      } catch (e) {
        failed++;
        console.error(`Failed to import item:`, e);
      }
    }

    return c.json({
      success: true,
      message: `Import concluído: ${imported} importados, ${failed} falharam`,
      queued: false,
      imported,
      failed,
    });
  } catch (error) {
    console.error('Queue bulk-import error:', error);
    return c.json({ error: 'Erro ao processar import em massa' }, 500);
  }
});

queueRoutes.post('/ai-generate', async (c) => {
  try {
    const siteId = c.req.header('X-Site-Id');
    const { pageId, prompt, type } = await c.req.json();

    if (!siteId) {
      return c.json({ error: 'X-Site-Id header é obrigatório' }, 400);
    }

    if (!pageId || !prompt) {
      return c.json({ error: 'pageId e prompt são obrigatórios' }, 400);
    }

    const message = {
      type: 'ai:generate',
      payload: { siteId, pageId, prompt, type: type || 'content' },
      timestamp: Date.now(),
    };

    if (c.env.TASKS_QUEUE) {
      await c.env.TASKS_QUEUE.send(message);
      return c.json({
        success: true,
        message: 'Geração de conteúdo AI enfileirada',
        queued: true,
      });
    }

    return c.json({
      success: true,
      message: 'Use /api/ai/* para geração síncrona',
      queued: false,
    });
  } catch (error) {
    console.error('Queue ai-generate error:', error);
    return c.json({ error: 'Erro ao enfileirar geração AI' }, 500);
  }
});

queueRoutes.get('/status', async (c) => {
  try {
    const hasQueue = !!c.env.TASKS_QUEUE;

    return c.json({
      status: 'healthy',
      queueEnabled: hasQueue,
      message: hasQueue 
        ? 'Queue habilitada e funcionando' 
        : 'Queue não configurada (processamento síncrono)',
    });
  } catch (error) {
    console.error('Queue status error:', error);
    return c.json({ error: 'Erro ao verificar status da queue' }, 500);
  }
});

export default queueRoutes;
