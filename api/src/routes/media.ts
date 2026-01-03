/**
 * Rotas de Mídia (Upload de Imagens)
 */

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { getCookie } from 'hono/cookie';
import type { Env } from '../index';

export const mediaRoutes = new Hono<{ Bindings: Env }>();

// Middleware de autenticação
const authMiddleware = async (c: any, next: any) => {
  try {
    const token = getCookie(c, 'auth_token') || c.req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: 'Não autenticado' }, 401);
    }
    
    const payload = await verify(token, c.env.JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch {
    return c.json({ error: 'Token inválido' }, 401);
  }
};

mediaRoutes.use('*', authMiddleware);

// Tipos de arquivo permitidos
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Listar mídia
mediaRoutes.get('/', async (c) => {
  try {
    const folder = c.req.query('folder');
    const type = c.req.query('type');
    const search = c.req.query('search');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM media WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM media WHERE 1=1';
    const params: any[] = [];
    
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
    const id = c.req.param('id');
    
    const media = await c.env.DB.prepare(
      'SELECT * FROM media WHERE id = ?'
    ).bind(id).first();
    
    if (!media) {
      return c.json({ error: 'Mídia não encontrada' }, 404);
    }
    
    return c.json({ success: true, data: media });
  } catch (error) {
    console.error('Get media error:', error);
    return c.json({ error: 'Erro ao buscar mídia' }, 500);
  }
});

// Upload de arquivo
mediaRoutes.post('/upload', async (c) => {
  try {
    const user = c.get('user');
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
    
    // Gerar nome único
    const ext = ALLOWED_TYPES[file.type];
    const timestamp = Date.now();
    const random = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    const fileName = `${folder}/${timestamp}-${random}.${ext}`;
    
    // Determinar tipo
    const fileType = file.type.startsWith('image/') ? 'image' : 'document';
    
    // Upload para R2
    const arrayBuffer = await file.arrayBuffer();
    await c.env.MEDIA.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000',
      },
      customMetadata: {
        originalName: file.name,
        uploadedBy: user.sub,
      },
    });
    
    // Construir URL
    // A URL vai apontar para o endpoint de imagens do Worker
    const baseUrl = new URL(c.req.url).origin;
    const url = `${baseUrl}/images/${fileName}`;
    
    // Salvar no banco
    const id = `media_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    
    await c.env.DB.prepare(`
      INSERT INTO media (
        id, original_name, file_name, file_type, mime_type, file_size,
        url, alt_text, caption, folder, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, file.name, fileName, fileType, file.type, file.size,
      url, altText, caption, folder, user.sub
    ).run();
    
    // Retornar dados
    return c.json({
      success: true,
      data: {
        id,
        url,
        fileName,
        originalName: file.name,
        fileType,
        mimeType: file.type,
        fileSize: file.size,
        // URLs otimizadas para diferentes tamanhos
        urls: {
          original: url,
          desktop: `${url}?w=1920`,
          tablet: `${url}?w=960`,
          mobile: `${url}?w=640`,
          thumbnail: `${url}?w=200`,
        }
      }
    }, 201);
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ error: 'Erro ao fazer upload' }, 500);
  }
});

// Atualizar metadados
mediaRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const { alt_text, caption, folder } = data;
    
    const existing = await c.env.DB.prepare(
      'SELECT id FROM media WHERE id = ?'
    ).bind(id).first();
    
    if (!existing) {
      return c.json({ error: 'Mídia não encontrada' }, 404);
    }
    
    await c.env.DB.prepare(`
      UPDATE media SET
        alt_text = COALESCE(?, alt_text),
        caption = COALESCE(?, caption),
        folder = COALESCE(?, folder)
      WHERE id = ?
    `).bind(alt_text, caption, folder, id).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Update media error:', error);
    return c.json({ error: 'Erro ao atualizar mídia' }, 500);
  }
});

// Deletar mídia
mediaRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const media = await c.env.DB.prepare(
      'SELECT file_name FROM media WHERE id = ?'
    ).bind(id).first();
    
    if (!media) {
      return c.json({ error: 'Mídia não encontrada' }, 404);
    }
    
    // Deletar do R2
    await c.env.MEDIA.delete(media.file_name as string);
    
    // Deletar do banco
    await c.env.DB.prepare('DELETE FROM media WHERE id = ?').bind(id).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete media error:', error);
    return c.json({ error: 'Erro ao deletar mídia' }, 500);
  }
});

// Listar pastas
mediaRoutes.get('/folders/list', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      'SELECT DISTINCT folder, COUNT(*) as count FROM media GROUP BY folder ORDER BY folder ASC'
    ).all();
    
    return c.json({ success: true, data: result.results });
  } catch (error) {
    console.error('List folders error:', error);
    return c.json({ error: 'Erro ao listar pastas' }, 500);
  }
});
