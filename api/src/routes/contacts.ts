/**
 * Rotas de Contatos/Leads
 * Multi-tenant: todas as queries filtram por site_id
 */

import { Hono } from 'hono';
import type { Env } from '../index';
import { tenantMiddleware, getSiteId } from '../middleware/tenant';

export const contactsRoutes = new Hono<{ Bindings: Env }>();

// Aplicar middleware de tenant em todas as rotas
contactsRoutes.use('*', tenantMiddleware);

// Listar contatos
contactsRoutes.get('/', async (c) => {
  try {
    const siteId = getSiteId(c);
    const status = c.req.query('status');
    const search = c.req.query('search');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM contacts WHERE site_id = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM contacts WHERE site_id = ?';
    const params: any[] = [siteId];
    
    if (status) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
    }
    
    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR city LIKE ?)';
      countQuery += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR city LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
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
    console.error('List contacts error:', error);
    return c.json({ error: 'Erro ao listar contatos' }, 500);
  }
});

// Estatísticas de contatos
contactsRoutes.get('/stats', async (c) => {
  try {
    const siteId = getSiteId(c);
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted_count,
        SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted_count,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_count,
        SUM(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as last_7_days,
        SUM(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) as last_30_days
      FROM contacts
      WHERE site_id = ?
    `).bind(siteId).first();
    
    return c.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get contact stats error:', error);
    return c.json({ error: 'Erro ao buscar estatísticas' }, 500);
  }
});

// Buscar contato por ID
contactsRoutes.get('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');
    
    const contact = await c.env.DB.prepare(
      'SELECT * FROM contacts WHERE id = ? AND site_id = ?'
    ).bind(id, siteId).first();
    
    if (!contact) {
      return c.json({ error: 'Contato não encontrado' }, 404);
    }
    
    return c.json({ success: true, data: contact });
  } catch (error) {
    console.error('Get contact error:', error);
    return c.json({ error: 'Erro ao buscar contato' }, 500);
  }
});

// Atualizar status do contato
contactsRoutes.put('/:id/status', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');
    const { status, notes } = await c.req.json();
    
    if (!['new', 'contacted', 'converted', 'closed'].includes(status)) {
      return c.json({ error: 'Status inválido' }, 400);
    }
    
    const existing = await c.env.DB.prepare(
      'SELECT id FROM contacts WHERE id = ? AND site_id = ?'
    ).bind(id, siteId).first();
    
    if (!existing) {
      return c.json({ error: 'Contato não encontrado' }, 404);
    }
    
    await c.env.DB.prepare(`
      UPDATE contacts SET
        status = ?,
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND site_id = ?
    `).bind(status, notes, id, siteId).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Update contact status error:', error);
    return c.json({ error: 'Erro ao atualizar status' }, 500);
  }
});

// Adicionar nota ao contato
contactsRoutes.post('/:id/notes', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');
    const { notes } = await c.req.json();
    
    const existing = await c.env.DB.prepare(
      'SELECT notes FROM contacts WHERE id = ? AND site_id = ?'
    ).bind(id, siteId).first();
    
    if (!existing) {
      return c.json({ error: 'Contato não encontrado' }, 404);
    }
    
    const currentNotes = existing.notes as string || '';
    const newNotes = currentNotes 
      ? `${currentNotes}\n\n[${new Date().toLocaleString('pt-BR')}]\n${notes}`
      : `[${new Date().toLocaleString('pt-BR')}]\n${notes}`;
    
    await c.env.DB.prepare(`
      UPDATE contacts SET notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND site_id = ?
    `).bind(newNotes, id, siteId).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Add contact note error:', error);
    return c.json({ error: 'Erro ao adicionar nota' }, 500);
  }
});

// Deletar contato
contactsRoutes.delete('/:id', async (c) => {
  try {
    const siteId = getSiteId(c);
    const id = c.req.param('id');
    
    await c.env.DB.prepare('DELETE FROM contacts WHERE id = ? AND site_id = ?').bind(id, siteId).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete contact error:', error);
    return c.json({ error: 'Erro ao deletar contato' }, 500);
  }
});

// Exportar contatos (CSV)
contactsRoutes.get('/export/csv', async (c) => {
  try {
    const siteId = getSiteId(c);
    const result = await c.env.DB.prepare(
      'SELECT name, email, phone, city, project_type, message, status, created_at FROM contacts WHERE site_id = ? ORDER BY created_at DESC'
    ).bind(siteId).all();
    
    const headers = ['Nome', 'Email', 'Telefone', 'Cidade', 'Tipo de Projeto', 'Mensagem', 'Status', 'Data'];
    const rows = result.results.map((contact: any) => [
      contact.name,
      contact.email,
      contact.phone || '',
      contact.city || '',
      contact.project_type || '',
      (contact.message || '').replace(/"/g, '""'),
      contact.status,
      contact.created_at
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map((cell: string) => `"${cell}"`).join(','))
    ].join('\n');
    
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="contatos-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export contacts error:', error);
    return c.json({ error: 'Erro ao exportar contatos' }, 500);
  }
});
