/**
 * Rotas de Mídia (Upload de Imagens) - OTIMIZADO
 * Multi-tenant: todas as queries filtram por site_id
 * 
 * Features:
 * - Upload com geração automática de variantes (480-3200w)
 * - Conversão para AVIF e WebP
 * - Extração de dimensões (width/height)
 * - Geração de thumbnails
 * - Suporte a Cloudflare Images Binding
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

// Tamanhos de variantes para imagens responsivas (baseado em best practices PageSpeed)
const IMAGE_WIDTHS = [480, 768, 1024, 1280, 1600, 1920, 2560, 3200];
const THUMBNAIL_SIZE = 200;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Gera variantes otimizadas de uma imagem usando Cloudflare Images
 */
async function generateImageVariants(
  env: Env,
  imageBuffer: ArrayBuffer,
  basePath: string,
  siteId: string
): Promise<{
  width: number;
  height: number;
  aspectRatio: string;
  variants: Record<string, Record<string, string>>;
  thumbnailUrl: string;
}> {
  const variants: Record<string, Record<string, string>> = {
    avif: {},
    webp: {},
    original: {}
  };

  try {
    // Obter informações da imagem original
    const imageStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(imageBuffer));
        controller.close();
      }
    });

    // Usar Images Binding para obter dimensões
    const imageInfo = await env.IMAGES.info(imageStream);
    const originalWidth = imageInfo.width || 1920;
    const originalHeight = imageInfo.height || 1080;
    
    // Calcular aspect ratio
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(originalWidth, originalHeight);
    const aspectRatio = `${originalWidth / divisor}:${originalHeight / divisor}`;

    // Gerar thumbnail WebP
    const thumbStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(imageBuffer));
        controller.close();
      }
    });
    
    const thumbnailResponse = await env.IMAGES.input(thumbStream)
      .transform({ width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE, fit: 'cover' })
      .output({ format: 'image/webp', quality: 80 });
    
    const thumbnailBuffer = await thumbnailResponse.response().arrayBuffer();
    const thumbnailPath = `sites/${siteId}/thumbnails/${basePath}-thumb.webp`;
    await env.MEDIA.put(thumbnailPath, thumbnailBuffer, {
      httpMetadata: { contentType: 'image/webp', cacheControl: 'public, max-age=31536000, immutable' }
    });

    // Gerar variantes para cada tamanho (apenas se menor que o original)
    for (const width of IMAGE_WIDTHS) {
      if (width > originalWidth) continue; // Não fazer upscale

      const height = Math.round((width / originalWidth) * originalHeight);

      // Gerar AVIF
      try {
        const avifStream = new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(imageBuffer));
            controller.close();
          }
        });
        
        const avifResponse = await env.IMAGES.input(avifStream)
          .transform({ width, height, fit: 'scale-down' })
          .output({ format: 'image/avif', quality: 80 });
        
        const avifBuffer = await avifResponse.response().arrayBuffer();
        const avifPath = `sites/${siteId}/optimized/${basePath}-${width}.avif`;
        await env.MEDIA.put(avifPath, avifBuffer, {
          httpMetadata: { contentType: 'image/avif', cacheControl: 'public, max-age=31536000, immutable' }
        });
        variants.avif[width.toString()] = avifPath;
      } catch (e) {
        console.error(`Error generating AVIF ${width}w:`, e);
      }

      // Gerar WebP
      try {
        const webpStream = new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(imageBuffer));
            controller.close();
          }
        });
        
        const webpResponse = await env.IMAGES.input(webpStream)
          .transform({ width, height, fit: 'scale-down' })
          .output({ format: 'image/webp', quality: 85 });
        
        const webpBuffer = await webpResponse.response().arrayBuffer();
        const webpPath = `sites/${siteId}/optimized/${basePath}-${width}.webp`;
        await env.MEDIA.put(webpPath, webpBuffer, {
          httpMetadata: { contentType: 'image/webp', cacheControl: 'public, max-age=31536000, immutable' }
        });
        variants.webp[width.toString()] = webpPath;
      } catch (e) {
        console.error(`Error generating WebP ${width}w:`, e);
      }
    }

    return {
      width: originalWidth,
      height: originalHeight,
      aspectRatio,
      variants,
      thumbnailUrl: thumbnailPath
    };
  } catch (error) {
    console.error('Error generating variants:', error);
    // Retornar valores padrão se falhar
    return {
      width: 0,
      height: 0,
      aspectRatio: '16:9',
      variants: {},
      thumbnailUrl: ''
    };
  }
}

// Listar mídia
mediaRoutes.get('/', async (c) => {
  try {
    const siteId = getSiteId(c);
    const folder = c.req.query('folder');
    const type = c.req.query('type');
    const search = c.req.query('search');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM media WHERE site_id = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM media WHERE site_id = ?';
    const params: any[] = [siteId];
    
    if (folder) {
      query += ' AND folder = ?';
      countQuery += ' AND folder = ?';
      params.push(folder);
    }
    
    if (type) {
      query += ' AND file_type = ?';
      countQuery += ' AND file_type = ?';
      params.push(type);
    }
    
    if (search) {
      query += ' AND (original_name LIKE ? OR alt_text LIKE ?)';
      countQuery += ' AND (original_name LIKE ? OR alt_text LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const result = await c.env.DB.prepare(query).bind(...params, limit, offset).all();
    
    return c.json({
      success: true,
      data: result.results,
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total as number || 0) / limit)
      }
    });
  } catch (error) {
    console.error('List media error:', error);
    return c.json({ error: 'Erro ao listar mídia' }, 500);
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

// Upload de arquivo - OTIMIZADO
mediaRoutes.post('/upload', async (c) => {
  try {
    const siteId = getSiteId(c);
    const user = c.get('user') as { sub: string };
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'general';
    const altText = formData.get('alt_text') as string || '';
    const caption = formData.get('caption') as string || '';
    
    if (!file) {
      return c.json({ error: 'Arquivo não enviado' }, 400);
    }
    
    // Validar tipo
    if (!ALLOWED_TYPES[file.type]) {
      return c.json({ error: 'Tipo de arquivo não permitido' }, 400);
    }
    
    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return c.json({ error: 'Arquivo muito grande (máx. 10MB)' }, 400);
    }
    
    // Gerar identificador único
    const timestamp = Date.now();
    const random = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    const basePath = `${folder}/${timestamp}-${random}`;
    const ext = ALLOWED_TYPES[file.type];
    
    // Determinar tipo
    const fileType = file.type.startsWith('image/') ? 'image' : 'document';
    const isOptimizable = OPTIMIZABLE_TYPES.includes(file.type);
    
    // Ler arquivo
    const arrayBuffer = await file.arrayBuffer();
    
    // Upload do original para R2
    const originalPath = `sites/${siteId}/originals/${basePath}.${ext}`;
    await c.env.MEDIA.put(originalPath, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000, immutable',
      },
      customMetadata: {
        originalName: file.name,
        uploadedBy: user.sub,
        siteId: siteId,
      },
    });
    
    // Construir URL base
    const baseUrl = new URL(c.req.url).origin;
    const originalUrl = `${baseUrl}/images/${originalPath}`;
    
    // Variáveis para dados de imagem
    let width = 0;
    let height = 0;
    let aspectRatio = '';
    let variants: Record<string, Record<string, string>> = {};
    let thumbnailUrl = '';
    
    // Se for imagem otimizável, gerar variantes
    if (isOptimizable && c.env.IMAGES) {
      try {
        const imageData = await generateImageVariants(c.env, arrayBuffer, basePath, siteId);
        width = imageData.width;
        height = imageData.height;
        aspectRatio = imageData.aspectRatio;
        variants = imageData.variants;
        thumbnailUrl = imageData.thumbnailUrl ? `${baseUrl}/images/${imageData.thumbnailUrl}` : '';
        
        // Adicionar original às variantes
        variants.original = { full: originalPath };
      } catch (e) {
        console.error('Error processing image:', e);
        // Continua sem variantes se falhar
      }
    }
    
    // Gerar ID
    const id = `media_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    
    // Salvar no banco com novos campos
    await c.env.DB.prepare(`
      INSERT INTO media (
        id, site_id, original_name, file_name, file_type, mime_type, file_size,
        url, alt_text, caption, folder, uploaded_by, width, height, aspect_ratio,
        variants, thumbnail_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, siteId, file.name, originalPath, fileType, file.type, file.size,
      originalUrl, altText, caption, folder, user.sub, width, height, aspectRatio,
      JSON.stringify(variants), thumbnailUrl
    ).run();
    
    // Construir URLs de resposta
    const responseUrls: Record<string, string> = {
      original: originalUrl,
      thumbnail: thumbnailUrl || originalUrl,
    };
    
    // Adicionar URLs de variantes
    if (Object.keys(variants.webp || {}).length > 0) {
      for (const [size, path] of Object.entries(variants.webp)) {
        responseUrls[`webp_${size}`] = `${baseUrl}/images/${path}`;
      }
    }
    
    // Retornar dados
    return c.json({
      success: true,
      data: {
        id,
        url: originalUrl,
        thumbnailUrl: thumbnailUrl || originalUrl,
        fileName: originalPath,
        originalName: file.name,
        fileType,
        mimeType: file.type,
        fileSize: file.size,
        width,
        height,
        aspectRatio,
        variants,
        urls: responseUrls
      }
    }, 201);
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ error: 'Erro ao fazer upload' }, 500);
  }
});

// Atualizar metadados (incluindo ponto focal)
mediaRoutes.put('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');
    const data = await c.req.json();
    const { alt_text, caption, folder, focal_x, focal_y } = data;
    
    const existing = await c.env.DB.prepare(
      'SELECT id FROM media WHERE id = ? AND site_id = ?'
    ).bind(id, siteId).first();
    
    if (!existing) {
      return c.json({ error: 'Mídia não encontrada' }, 404);
    }
    
    await c.env.DB.prepare(`
      UPDATE media SET
        alt_text = COALESCE(?, alt_text),
        caption = COALESCE(?, caption),
        folder = COALESCE(?, folder),
        focal_x = COALESCE(?, focal_x),
        focal_y = COALESCE(?, focal_y)
      WHERE id = ? AND site_id = ?
    `).bind(alt_text, caption, folder, focal_x, focal_y, id, siteId).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Update media error:', error);
    return c.json({ error: 'Erro ao atualizar mídia' }, 500);
  }
});

// Deletar mídia (incluindo variantes)
mediaRoutes.delete('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');
    
    const media = await c.env.DB.prepare(
      'SELECT file_name, variants, thumbnail_url FROM media WHERE id = ? AND site_id = ?'
    ).bind(id, siteId).first() as { file_name: string; variants: string; thumbnail_url: string } | null;
    
    if (!media) {
      return c.json({ error: 'Mídia não encontrada' }, 404);
    }
    
    // Deletar original do R2
    await c.env.MEDIA.delete(media.file_name);
    
    // Deletar thumbnail
    if (media.thumbnail_url) {
      const thumbPath = media.thumbnail_url.split('/images/')[1];
      if (thumbPath) {
        await c.env.MEDIA.delete(thumbPath).catch(() => {});
      }
    }
    
    // Deletar variantes
    if (media.variants) {
      try {
        const variants = JSON.parse(media.variants);
        for (const format of Object.values(variants) as Record<string, string>[]) {
          for (const path of Object.values(format)) {
            await c.env.MEDIA.delete(path).catch(() => {});
          }
        }
      } catch (e) {
        console.error('Error deleting variants:', e);
      }
    }
    
    // Deletar do banco
    await c.env.DB.prepare('DELETE FROM media WHERE id = ? AND site_id = ?').bind(id, siteId).run();
    
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
      'SELECT DISTINCT folder, COUNT(*) as count FROM media WHERE site_id = ? GROUP BY folder ORDER BY folder ASC'
    ).bind(siteId).all();
    
    return c.json({ success: true, data: result.results });
  } catch (error) {
    console.error('List folders error:', error);
    return c.json({ error: 'Erro ao listar pastas' }, 500);
  }
});

// Regenerar variantes de uma imagem existente
mediaRoutes.post('/:id/regenerate', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');
    
    const media = await c.env.DB.prepare(
      'SELECT * FROM media WHERE id = ? AND site_id = ?'
    ).bind(id, siteId).first() as any;
    
    if (!media) {
      return c.json({ error: 'Mídia não encontrada' }, 404);
    }
    
    if (media.file_type !== 'image' || !OPTIMIZABLE_TYPES.includes(media.mime_type)) {
      return c.json({ error: 'Apenas imagens podem ter variantes regeneradas' }, 400);
    }
    
    // Buscar imagem original do R2
    const originalFile = await c.env.MEDIA.get(media.file_name);
    if (!originalFile) {
      return c.json({ error: 'Arquivo original não encontrado' }, 404);
    }
    
    const arrayBuffer = await originalFile.arrayBuffer();
    const basePath = media.file_name.replace(/\.[^.]+$/, '').replace(`sites/${siteId}/originals/`, '');
    
    // Gerar novas variantes
    const imageData = await generateImageVariants(c.env, arrayBuffer, basePath, siteId);
    
    const baseUrl = new URL(c.req.url).origin;
    const thumbnailUrl = imageData.thumbnailUrl ? `${baseUrl}/images/${imageData.thumbnailUrl}` : '';
    
    // Atualizar banco
    await c.env.DB.prepare(`
      UPDATE media SET
        width = ?,
        height = ?,
        aspect_ratio = ?,
        variants = ?,
        thumbnail_url = ?
      WHERE id = ? AND site_id = ?
    `).bind(
      imageData.width,
      imageData.height,
      imageData.aspectRatio,
      JSON.stringify(imageData.variants),
      thumbnailUrl,
      id,
      siteId
    ).run();
    
    return c.json({
      success: true,
      data: {
        width: imageData.width,
        height: imageData.height,
        aspectRatio: imageData.aspectRatio,
        thumbnailUrl,
        variants: imageData.variants
      }
    });
  } catch (error) {
    console.error('Regenerate error:', error);
    return c.json({ error: 'Erro ao regenerar variantes' }, 500);
  }
});
