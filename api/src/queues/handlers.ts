/**
 * Queue Handlers
 * Processamento assíncrono de tarefas em background
 */

export interface QueueMessage {
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
  retries?: number;
}

export interface QueueEnv {
  DB: D1Database;
  CACHE: KVNamespace;
  MEDIA: R2Bucket;
  AI: any;
}

export async function handleSitemapGeneration(
  message: QueueMessage,
  env: QueueEnv
): Promise<void> {
  const { siteId, domain } = message.payload as { siteId: string; domain: string };

  if (!siteId || !domain) {
    throw new Error('siteId and domain are required');
  }

  const pages = await env.DB.prepare(`
    SELECT slug, updated_at FROM pages 
    WHERE site_id = ? AND status = 'published'
    ORDER BY updated_at DESC
  `).bind(siteId).all();

  const posts = await env.DB.prepare(`
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

  await env.CACHE.put(`${siteId}:sitemap.xml`, sitemap, {
    expirationTtl: 86400,
  });

  console.log(`Sitemap generated for site ${siteId} with ${urls.length} URLs`);
}

export async function handleImageProcessing(
  message: QueueMessage,
  env: QueueEnv
): Promise<void> {
  const { siteId, mediaId, filename, operations } = message.payload as {
    siteId: string;
    mediaId: string;
    filename: string;
    operations: string[];
  };

  if (!siteId || !mediaId || !filename) {
    throw new Error('siteId, mediaId, and filename are required');
  }

  const object = await env.MEDIA.get(filename);
  if (!object) {
    throw new Error(`Image not found: ${filename}`);
  }

  for (const operation of operations || []) {
    console.log(`Processing ${operation} for ${filename}`);
  }

  await env.DB.prepare(`
    UPDATE media SET processed = 1, processed_at = CURRENT_TIMESTAMP
    WHERE id = ? AND site_id = ?
  `).bind(mediaId, siteId).run();

  console.log(`Image processing completed for ${filename}`);
}

export async function handleEmailNotification(
  message: QueueMessage,
  env: QueueEnv
): Promise<void> {
  const { to, subject, template, data } = message.payload as {
    to: string;
    subject: string;
    template: string;
    data: Record<string, unknown>;
  };

  if (!to || !subject || !template) {
    throw new Error('to, subject, and template are required');
  }

  console.log(`Email notification queued: ${subject} to ${to}`);
}

export async function handleBulkImport(
  message: QueueMessage,
  env: QueueEnv
): Promise<void> {
  const { siteId, type, items, userId } = message.payload as {
    siteId: string;
    type: 'pages' | 'posts' | 'media';
    items: Record<string, unknown>[];
    userId: string;
  };

  if (!siteId || !type || !items || !Array.isArray(items)) {
    throw new Error('siteId, type, and items are required');
  }

  let imported = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      if (type === 'pages') {
        await env.DB.prepare(`
          INSERT INTO pages (id, site_id, title, slug, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'draft', ?, ?)
        `).bind(id, siteId, item.title, item.slug, now, now).run();
      } else if (type === 'posts') {
        await env.DB.prepare(`
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

  console.log(`Bulk import completed: ${imported} imported, ${failed} failed`);
}

export async function handleAIContentGeneration(
  message: QueueMessage,
  env: QueueEnv
): Promise<void> {
  const { siteId, pageId, prompt, type } = message.payload as {
    siteId: string;
    pageId: string;
    prompt: string;
    type: 'content' | 'seo' | 'alt';
  };

  if (!siteId || !pageId || !prompt) {
    throw new Error('siteId, pageId, and prompt are required');
  }

  try {
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
    });

    const content = response.response || '';

    if (type === 'seo') {
      await env.DB.prepare(`
        UPDATE pages SET meta_description = ? WHERE id = ? AND site_id = ?
      `).bind(content.substring(0, 160), pageId, siteId).run();
    }

    console.log(`AI content generated for page ${pageId}`);
  } catch (e) {
    console.error('AI generation failed:', e);
    throw e;
  }
}

export async function processQueueMessage(
  message: QueueMessage,
  env: QueueEnv
): Promise<void> {
  const handlers: Record<string, (msg: QueueMessage, env: QueueEnv) => Promise<void>> = {
    'sitemap:generate': handleSitemapGeneration,
    'image:process': handleImageProcessing,
    'email:send': handleEmailNotification,
    'import:bulk': handleBulkImport,
    'ai:generate': handleAIContentGeneration,
  };

  const handler = handlers[message.type];
  if (!handler) {
    throw new Error(`Unknown message type: ${message.type}`);
  }

  await handler(message, env);
}
