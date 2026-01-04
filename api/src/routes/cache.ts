/**
 * Rotas de Cache
 * Gerenciamento de cache via Durable Objects
 */

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { getCookie } from 'hono/cookie';
import type { Env } from '../index';

interface CacheEnv extends Env {
  CACHE_COORDINATOR: DurableObjectNamespace;
}

export const cacheRoutes = new Hono<{ Bindings: CacheEnv }>();

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

cacheRoutes.use('*', authMiddleware);

cacheRoutes.post('/invalidate', async (c) => {
  try {
    const { siteId, keys } = await c.req.json();
    const siteIdHeader = c.req.header('X-Site-Id');
    const finalSiteId = siteId || siteIdHeader;

    if (!finalSiteId) {
      return c.json({ error: 'siteId é obrigatório' }, 400);
    }

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return c.json({ error: 'keys deve ser um array não vazio' }, 400);
    }

    if (c.env.CACHE_COORDINATOR) {
      const id = c.env.CACHE_COORDINATOR.idFromName('global');
      const stub = c.env.CACHE_COORDINATOR.get(id);

      const response = await stub.fetch(new Request('https://cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: finalSiteId, keys }),
      }));

      const result = await response.json();
      return c.json(result);
    }

    let invalidated = 0;
    for (const key of keys) {
      try {
        await c.env.CACHE.delete(`${finalSiteId}:${key}`);
        invalidated++;
      } catch (e) {
        console.error(`Failed to invalidate ${key}:`, e);
      }
    }

    return c.json({
      success: true,
      invalidated,
      message: 'Cache invalidado (fallback sem DO)',
    });
  } catch (error) {
    console.error('Cache invalidate error:', error);
    return c.json({ error: 'Erro ao invalidar cache' }, 500);
  }
});

cacheRoutes.post('/invalidate-page', async (c) => {
  try {
    const { siteId, slug } = await c.req.json();
    const siteIdHeader = c.req.header('X-Site-Id');
    const finalSiteId = siteId || siteIdHeader;

    if (!finalSiteId || !slug) {
      return c.json({ error: 'siteId e slug são obrigatórios' }, 400);
    }

    if (c.env.CACHE_COORDINATOR) {
      const id = c.env.CACHE_COORDINATOR.idFromName('global');
      const stub = c.env.CACHE_COORDINATOR.get(id);

      const response = await stub.fetch(new Request('https://cache/invalidate-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: finalSiteId, slug }),
      }));

      const result = await response.json();
      return c.json(result);
    }

    const keysToInvalidate = [
      `page:${slug}`,
      `html:${slug}`,
      `meta:${slug}`,
    ];

    for (const key of keysToInvalidate) {
      try {
        await c.env.CACHE.delete(`${finalSiteId}:${key}`);
      } catch (e) {
        console.error(`Failed to invalidate ${key}:`, e);
      }
    }

    return c.json({
      success: true,
      slug,
      message: 'Cache da página invalidado',
    });
  } catch (error) {
    console.error('Cache invalidate-page error:', error);
    return c.json({ error: 'Erro ao invalidar cache da página' }, 500);
  }
});

cacheRoutes.post('/invalidate-site', async (c) => {
  try {
    const { siteId } = await c.req.json();
    const siteIdHeader = c.req.header('X-Site-Id');
    const finalSiteId = siteId || siteIdHeader;

    if (!finalSiteId) {
      return c.json({ error: 'siteId é obrigatório' }, 400);
    }

    if (c.env.CACHE_COORDINATOR) {
      const id = c.env.CACHE_COORDINATOR.idFromName('global');
      const stub = c.env.CACHE_COORDINATOR.get(id);

      const response = await stub.fetch(new Request('https://cache/invalidate-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: finalSiteId }),
      }));

      const result = await response.json();
      return c.json(result);
    }

    const listResult = await c.env.CACHE.list({ prefix: `${finalSiteId}:` });
    let deleted = 0;

    for (const key of listResult.keys) {
      try {
        await c.env.CACHE.delete(key.name);
        deleted++;
      } catch (e) {
        console.error(`Failed to delete ${key.name}:`, e);
      }
    }

    return c.json({
      success: true,
      deleted,
      siteId: finalSiteId,
      message: 'Cache do site invalidado',
    });
  } catch (error) {
    console.error('Cache invalidate-site error:', error);
    return c.json({ error: 'Erro ao invalidar cache do site' }, 500);
  }
});

cacheRoutes.get('/status', async (c) => {
  try {
    const siteId = c.req.header('X-Site-Id');

    if (c.env.CACHE_COORDINATOR) {
      const id = c.env.CACHE_COORDINATOR.idFromName('global');
      const stub = c.env.CACHE_COORDINATOR.get(id);

      const response = await stub.fetch(new Request('https://cache/status', {
        method: 'GET',
      }));

      const result = await response.json();
      return c.json(result);
    }

    let cacheKeys = 0;
    if (siteId) {
      const listResult = await c.env.CACHE.list({ prefix: `${siteId}:`, limit: 1000 });
      cacheKeys = listResult.keys.length;
    }

    return c.json({
      status: 'healthy',
      durableObjects: false,
      cacheKeys,
      message: 'Cache funcionando (sem Durable Objects)',
    });
  } catch (error) {
    console.error('Cache status error:', error);
    return c.json({ error: 'Erro ao verificar status do cache' }, 500);
  }
});

export default cacheRoutes;
