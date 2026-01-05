/**
 * Rotas de Mídia (Upload de Imagens) - OTIMIZADO COM CLOUDFLARE IMAGES BINDING
 * Multi-tenant: todas as queries filtram por site_id
 * 
 * Features:
 * - Upload com geração automática de thumbnail via Images Binding
 * - Conversão automática para WebP (melhor compressão)
 * - Extração de dimensões (width/height)
 * - Focal point para crops inteligentes
 * - Otimização on-the-fly na entrega
 */

import { Hono } from 'hono';
import type { Env } from '../index';
import { tenantMiddleware, getSiteId } from '../middleware/tenant';

export const mediaRoutes = new Hono<{ Bindings: Env }>();

// Aplicar middleware de tenant em todas as rotas
mediaRoutes.use('*', tenantMiddleware);

// Tipos de arquivo permitidos
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
  'application/pdf': 'pdf',
};

// Tipos de imagem que podem ser otimizados
const OPTIMIZABLE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Configurações de thumbnail
const THUMBNAIL_CONFIG = {
  width: 300,
  height: 300,
  quality: 80,
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Gera thumbnail usando Cloudflare Images Binding
 * Retorna o buffer do thumbnail em WebP
 */
async function generateThumbnail(
  env: Env,
  imageBuffer: ArrayBuffer
): Promise<{ buffer: ArrayBuffer; width: number; height: number } | null> {
  try {
    // Verificar se o binding IMAGES está disponível
    if (!env.IMAGES) {
      console.warn('Images binding not available, skipping thumbnail generation');
      return null;
    }

    // Obter informações da imagem original
    const infoResult = await env.IMAGES.info(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(imageBuffer));
          controller.close();
        }
      })
    );

    const originalWidth = infoResult.width || 0;
    const originalHeight = infoResult.height || 0;

    // Gerar thumbnail em WebP usando o binding
    const thumbnailResult = await env.IMAGES
      .input(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(imageBuffer));
            controller.close();
          }
        })
      )
      .transform({
        width: THUMBNAIL_CONFIG.width,
        height: THUMBNAIL_CONFIG.height,
        fit: 'cover',
      })
      .output({
        format: 'image/webp',
        quality: THUMBNAIL_CONFIG.quality,
      });

    const thumbnailBuffer = await thumbnailResult.response().arrayBuffer();

    return {
      buffer: thumbnailBuffer,
      width: originalWidth,
      height: originalHeight,
    };
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
}

/**
 * Obtém informações da imagem (dimensões) usando Images Binding
 */
async function getImageInfo(
  env: Env,
  imageBuffer: ArrayBuffer
): Promise<{ width: number; height: number; format: string } | null> {
  try {
    if (!env.IMAGES) {
      return null;
    }

    const info = await env.IMAGES.info(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(imageBuffer));
          controller.close();
        }
      })
    );

    return {
      width: info.width || 0,
      height: info.height || 0,
      format: info.format || 'unknown',
    };
  } catch (error) {
    console.error('Error getting image info:', error);
    return null;
  }
}

// =============================================
// ROTAS
// =============================================

// Listar mídias
mediaRoutes.get('/', async (c) => {
  try {
    const siteId = getSiteId(c);
    const folder = c.req.query('folder');
    const type = c.req.query('type');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM media WHERE site_id = ?';
    const params: any[] = [siteId];

    if (folder) {
      query += ' AND folder = ?';
      params.push(folder);
    }

    if (type) {
      query += ' AND file_type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await c.env.DB.prepare(query).bind(...params).all();

    // Contar total
    let countQuery = 'SELECT COUNT(*) as total FROM media WHERE site_id = ?';
    const countParams: any[] = [siteId];
    if (folder) {
      countQuery += ' AND folder = ?';
      countParams.push(folder);
    }
    if (type) {
      countQuery += ' AND file_type = ?';
      countParams.push(type);
    }

    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first() as { total: number };

    return c.json({
      success: true,
      data: result.results,
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        pages: Math.ceil((countResult?.total || 0) / limit),
      },
    });
  } catch (error) {
    console.error('List media error:', error);
    return c.json({ error: 'Erro ao listar mídias' }, 500);
  }
});

// Upload de mídia
mediaRoutes.post('/upload', async (c) => {
  try {
    const siteId = getSiteId(c);
    const user = c.get('user' as never) as { sub: string };
    
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'general';
    const altText = (formData.get('alt_text') as string) || '';

    if (!file) {
      return c.json({ error: 'Nenhum arquivo enviado' }, 400);
    }

    // Validar tipo
    const mimeType = file.type;
    if (!ALLOWED_TYPES[mimeType]) {
      return c.json({ error: 'Tipo de arquivo não permitido' }, 400);
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return c.json({ error: 'Arquivo muito grande (máximo 10MB)' }, 400);
    }

    // Ler arquivo
    const arrayBuffer = await file.arrayBuffer();
    const extension = ALLOWED_TYPES[mimeType];
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const fileName = `${folder}/${timestamp}-${randomId}.${extension}`;

    // Determinar tipo de arquivo
    const fileType = mimeType.startsWith('image/') ? 'image' : 
                     mimeType === 'application/pdf' ? 'document' : 'other';

    // Variáveis para dimensões e thumbnail
    let width: number | null = null;
    let height: number | null = null;
    let thumbnailUrl: string | null = null;

    // Se for imagem otimizável, gerar thumbnail e obter dimensões
    if (OPTIMIZABLE_TYPES.includes(mimeType)) {
      // Tentar gerar thumbnail
      const thumbnailResult = await generateThumbnail(c.env, arrayBuffer);
      
      if (thumbnailResult) {
        width = thumbnailResult.width;
        height = thumbnailResult.height;

        // Salvar thumbnail no R2
        const thumbnailFileName = `thumbnails/${folder}/${timestamp}-${randomId}.webp`;
        await c.env.MEDIA.put(thumbnailFileName, thumbnailResult.buffer, {
          httpMetadata: {
            contentType: 'image/webp',
            cacheControl: 'public, max-age=31536000, immutable',
          },
        });
        thumbnailUrl = `https://cms-site-api.planacacabamentos.workers.dev/images/${thumbnailFileName}`;
      } else {
        // Fallback: tentar apenas obter informações
        const imageInfo = await getImageInfo(c.env, arrayBuffer);
        if (imageInfo) {
          width = imageInfo.width;
          height = imageInfo.height;
        }
      }
    }

    // Salvar arquivo original no R2
    await c.env.MEDIA.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });

    // URL do arquivo
    const url = `https://cms-site-api.planacacabamentos.workers.dev/images/${fileName}`;

    // Gerar ID
    const id = `media_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;

    // Calcular aspect ratio
    let aspectRatio: string | null = null;
    if (width && height) {
      const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
      const divisor = gcd(width, height);
      aspectRatio = `${width / divisor}:${height / divisor}`;
    }

    // Salvar no banco
    await c.env.DB.prepare(`
      INSERT INTO media (
        id, site_id, original_name, file_name, file_type, mime_type, 
        file_size, url, thumbnail_url, width, height, aspect_ratio,
        alt_text, folder, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, siteId, file.name, fileName, fileType, mimeType,
      file.size, url, thumbnailUrl, width, height, aspectRatio,
      altText, folder, user.sub
    ).run();

    // Invalidar cache
    await c.env.CACHE.delete(`${siteId}:media:list`);

    return c.json({
      success: true,
      data: {
        id,
        url,
        thumbnail_url: thumbnailUrl,
        original_name: file.name,
        file_name: fileName,
        mime_type: mimeType,
        file_size: file.size,
        width,
        height,
        aspect_ratio: aspectRatio,
      },
    }, 201);
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ error: 'Erro ao fazer upload' }, 500);
  }
});

// Buscar mídia por ID
mediaRoutes.get('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');

    const media = await c.env.DB.prepare(
      'SELECT * FROM media WHERE id = ? AND site_id = ?'
    ).bind(id, siteId).first();

    if (!media) {
      return c.json({ error: 'Mídia não encontrada' }, 404);
    }

    return c.json({ success: true, data: media });
  } catch (error) {
    console.error('Get media error:', error);
    return c.json({ error: 'Erro ao buscar mídia' }, 500);
  }
});

// Atualizar mídia (alt_text, caption, focal point)
mediaRoutes.put('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');
    const data = await c.req.json();
    const { alt_text, caption, focal_x, focal_y } = data;

    // Verificar se existe
    const existing = await c.env.DB.prepare(
      'SELECT id FROM media WHERE id = ? AND site_id = ?'
    ).bind(id, siteId).first();

    if (!existing) {
      return c.json({ error: 'Mídia não encontrada' }, 404);
    }

    // Montar query de update dinâmica
    const updates: string[] = [];
    const values: any[] = [];

    if (alt_text !== undefined) {
      updates.push('alt_text = ?');
      values.push(alt_text);
    }
    if (caption !== undefined) {
      updates.push('caption = ?');
      values.push(caption);
    }
    if (focal_x !== undefined) {
      updates.push('focal_x = ?');
      values.push(focal_x);
    }
    if (focal_y !== undefined) {
      updates.push('focal_y = ?');
      values.push(focal_y);
    }

    if (updates.length === 0) {
      return c.json({ error: 'Nenhum campo para atualizar' }, 400);
    }

    values.push(id, siteId);

    await c.env.DB.prepare(
      `UPDATE media SET ${updates.join(', ')} WHERE id = ? AND site_id = ?`
    ).bind(...values).run();

    // Invalidar cache
    await c.env.CACHE.delete(`${siteId}:media:list`);

    return c.json({ success: true });
  } catch (error) {
    console.error('Update media error:', error);
    return c.json({ error: 'Erro ao atualizar mídia' }, 500);
  }
});

// Deletar mídia
mediaRoutes.delete('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');

    // Buscar mídia
    const media = await c.env.DB.prepare(
      'SELECT file_name, thumbnail_url FROM media WHERE id = ? AND site_id = ?'
    ).bind(id, siteId).first() as { file_name: string; thumbnail_url: string | null } | null;

    if (!media) {
      return c.json({ error: 'Mídia não encontrada' }, 404);
    }

    // Deletar do R2
    await c.env.MEDIA.delete(media.file_name);

    // Deletar thumbnail se existir
    if (media.thumbnail_url) {
      const thumbnailPath = media.thumbnail_url.split('/images/')[1];
      if (thumbnailPath) {
        try {
          await c.env.MEDIA.delete(thumbnailPath);
        } catch (e) {
          console.warn('Could not delete thumbnail:', e);
        }
      }
    }

    // Deletar do banco
    await c.env.DB.prepare(
      'DELETE FROM media WHERE id = ? AND site_id = ?'
    ).bind(id, siteId).run();

    // Invalidar cache
    await c.env.CACHE.delete(`${siteId}:media:list`);

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete media error:', error);
    return c.json({ error: 'Erro ao deletar mídia' }, 500);
  }
});

// Listar pastas
mediaRoutes.get('/folders/list', async (c) => {
  try {
    const siteId = getSiteId(c);

    const result = await c.env.DB.prepare(
      'SELECT DISTINCT folder FROM media WHERE site_id = ? ORDER BY folder'
    ).bind(siteId).all();

    const folders = result.results.map((r: any) => r.folder);

    return c.json({ success: true, data: folders });
  } catch (error) {
    console.error('List folders error:', error);
    return c.json({ error: 'Erro ao listar pastas' }, 500);
  }
});

// Regenerar thumbnails para mídias existentes (admin utility)
mediaRoutes.post('/regenerate-thumbnails', async (c) => {
  try {
    const siteId = getSiteId(c);
    const user = c.get('user' as never) as { role: string };

    // Apenas admin pode executar
    if (user.role !== 'admin' && user.role !== 'owner') {
      return c.json({ error: 'Permissão negada' }, 403);
    }

    // Buscar mídias sem thumbnail
    const medias = await c.env.DB.prepare(`
      SELECT id, file_name, mime_type 
      FROM media 
      WHERE site_id = ? 
        AND file_type = 'image' 
        AND thumbnail_url IS NULL
        AND mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif')
      LIMIT 50
    `).bind(siteId).all();

    let processed = 0;
    let errors = 0;

    for (const media of medias.results as any[]) {
      try {
        // Buscar arquivo do R2
        const object = await c.env.MEDIA.get(media.file_name);
        if (!object) continue;

        const arrayBuffer = await object.arrayBuffer();

        // Gerar thumbnail
        const thumbnailResult = await generateThumbnail(c.env, arrayBuffer);
        if (!thumbnailResult) {
          errors++;
          continue;
        }

        // Salvar thumbnail
        const thumbnailFileName = `thumbnails/${media.file_name.replace(/\.[^.]+$/, '.webp')}`;
        await c.env.MEDIA.put(thumbnailFileName, thumbnailResult.buffer, {
          httpMetadata: {
            contentType: 'image/webp',
            cacheControl: 'public, max-age=31536000, immutable',
          },
        });

        const thumbnailUrl = `https://cms-site-api.planacacabamentos.workers.dev/images/${thumbnailFileName}`;

        // Atualizar banco
        await c.env.DB.prepare(`
          UPDATE media 
          SET thumbnail_url = ?, width = ?, height = ?
          WHERE id = ?
        `).bind(thumbnailUrl, thumbnailResult.width, thumbnailResult.height, media.id).run();

        processed++;
      } catch (e) {
        console.error(`Error processing ${media.id}:`, e);
        errors++;
      }
    }

    return c.json({
      success: true,
      message: `Processadas ${processed} imagens, ${errors} erros`,
      processed,
      errors,
      remaining: medias.results.length - processed - errors,
    });
  } catch (error) {
    console.error('Regenerate thumbnails error:', error);
    return c.json({ error: 'Erro ao regenerar thumbnails' }, 500);
  }
});
