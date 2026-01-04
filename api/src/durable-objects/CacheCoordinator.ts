/**
 * Durable Object: CacheCoordinator
 * Coordena invalidação de cache entre múltiplas instâncias do Worker
 * Garante consistência de cache em ambiente multi-tenant
 */

export interface Env {
  CACHE: KVNamespace;
}

interface CacheInvalidation {
  siteId: string;
  patterns: string[];
  timestamp: number;
}

export class CacheCoordinator {
  private state: DurableObjectState;
  private env: Env;
  private pendingInvalidations: Map<string, CacheInvalidation>;
  private lastCleanup: number;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.pendingInvalidations = new Map();
    this.lastCleanup = Date.now();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (request.method === 'POST' && path === '/invalidate') {
        return await this.handleInvalidate(request);
      }

      if (request.method === 'POST' && path === '/invalidate-page') {
        return await this.handleInvalidatePage(request);
      }

      if (request.method === 'POST' && path === '/invalidate-site') {
        return await this.handleInvalidateSite(request);
      }

      if (request.method === 'GET' && path === '/status') {
        return await this.handleStatus();
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('CacheCoordinator error:', error);
      return new Response('Internal Error', { status: 500 });
    }
  }

  private async handleInvalidate(request: Request): Promise<Response> {
    const { siteId, keys } = await request.json() as { siteId: string; keys: string[] };

    if (!siteId || !keys || !Array.isArray(keys)) {
      return new Response(JSON.stringify({ error: 'siteId and keys are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const invalidated: string[] = [];
    const errors: string[] = [];

    for (const key of keys) {
      try {
        const fullKey = `${siteId}:${key}`;
        await this.env.CACHE.delete(fullKey);
        invalidated.push(fullKey);
      } catch (e) {
        errors.push(key);
      }
    }

    this.pendingInvalidations.set(`${siteId}-${Date.now()}`, {
      siteId,
      patterns: keys,
      timestamp: Date.now(),
    });

    await this.cleanupOldInvalidations();

    return new Response(JSON.stringify({
      success: true,
      invalidated: invalidated.length,
      errors: errors.length,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleInvalidatePage(request: Request): Promise<Response> {
    const { siteId, slug } = await request.json() as { siteId: string; slug: string };

    if (!siteId || !slug) {
      return new Response(JSON.stringify({ error: 'siteId and slug are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const keysToInvalidate = [
      `page:${slug}`,
      `html:${slug}`,
      `meta:${slug}`,
    ];

    const invalidated: string[] = [];

    for (const key of keysToInvalidate) {
      try {
        const fullKey = `${siteId}:${key}`;
        await this.env.CACHE.delete(fullKey);
        invalidated.push(fullKey);
      } catch (e) {
        console.error(`Failed to invalidate ${key}:`, e);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      invalidated,
      slug,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleInvalidateSite(request: Request): Promise<Response> {
    const { siteId } = await request.json() as { siteId: string };

    if (!siteId) {
      return new Response(JSON.stringify({ error: 'siteId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const listResult = await this.env.CACHE.list({ prefix: `${siteId}:` });
    const keysToDelete = listResult.keys.map(k => k.name);
    
    let deleted = 0;
    for (const key of keysToDelete) {
      try {
        await this.env.CACHE.delete(key);
        deleted++;
      } catch (e) {
        console.error(`Failed to delete ${key}:`, e);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      deleted,
      siteId,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleStatus(): Promise<Response> {
    const recentInvalidations = Array.from(this.pendingInvalidations.values())
      .slice(-10)
      .map(inv => ({
        siteId: inv.siteId,
        patterns: inv.patterns.length,
        timestamp: new Date(inv.timestamp).toISOString(),
      }));

    return new Response(JSON.stringify({
      status: 'healthy',
      pendingInvalidations: this.pendingInvalidations.size,
      recentInvalidations,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async cleanupOldInvalidations(): Promise<void> {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    if (now - this.lastCleanup < 5 * 60 * 1000) {
      return;
    }

    for (const [key, inv] of this.pendingInvalidations) {
      if (inv.timestamp < oneHourAgo) {
        this.pendingInvalidations.delete(key);
      }
    }

    this.lastCleanup = now;
  }
}
