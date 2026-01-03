/**
 * Rotas de Autenticação
 */

import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import type { Env } from '../index';

export const authRoutes = new Hono<{ Bindings: Env }>();

// Função para hash de senha (bcrypt simulado - em produção usar bcrypt real)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'cms-site-salt');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Login
authRoutes.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email e senha são obrigatórios' }, 400);
    }
    
    // Buscar usuário
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND active = 1'
    ).bind(email.toLowerCase()).first();
    
    if (!user) {
      return c.json({ error: 'Credenciais inválidas' }, 401);
    }
    
    // Verificar senha
    const validPassword = await verifyPassword(password, user.password_hash as string);
    
    if (!validPassword) {
      return c.json({ error: 'Credenciais inválidas' }, 401);
    }
    
    // Gerar JWT
    const token = await sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24h
      },
      c.env.JWT_SECRET
    );
    
    // Salvar sessão no KV
    await c.env.SESSIONS.put(`session:${user.id}`, JSON.stringify({
      token,
      createdAt: new Date().toISOString(),
    }), { expirationTtl: 86400 });
    
    // Atualizar último login
    await c.env.DB.prepare(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(user.id).run();
    
    // Set cookie
    setCookie(c, 'auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 86400,
      path: '/',
    });
    
    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar_url: user.avatar_url,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Erro ao fazer login' }, 500);
  }
});

// Logout
authRoutes.post('/logout', async (c) => {
  const token = getCookie(c, 'auth_token');
  
  if (token) {
    try {
      const payload = await verify(token, c.env.JWT_SECRET);
      await c.env.SESSIONS.delete(`session:${payload.sub}`);
    } catch {}
  }
  
  deleteCookie(c, 'auth_token');
  return c.json({ success: true });
});

// Verificar sessão
authRoutes.get('/me', async (c) => {
  try {
    const token = getCookie(c, 'auth_token') || c.req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: 'Não autenticado' }, 401);
    }
    
    const payload = await verify(token, c.env.JWT_SECRET);
    
    // Buscar usuário atualizado
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, role, avatar_url FROM users WHERE id = ? AND active = 1'
    ).bind(payload.sub).first();
    
    if (!user) {
      return c.json({ error: 'Usuário não encontrado' }, 401);
    }
    
    return c.json({ success: true, user });
  } catch (error) {
    return c.json({ error: 'Token inválido' }, 401);
  }
});

// Alterar senha
authRoutes.post('/change-password', async (c) => {
  try {
    const token = getCookie(c, 'auth_token') || c.req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: 'Não autenticado' }, 401);
    }
    
    const payload = await verify(token, c.env.JWT_SECRET);
    const { currentPassword, newPassword } = await c.req.json();
    
    if (!currentPassword || !newPassword) {
      return c.json({ error: 'Senhas são obrigatórias' }, 400);
    }
    
    if (newPassword.length < 6) {
      return c.json({ error: 'Nova senha deve ter pelo menos 6 caracteres' }, 400);
    }
    
    // Buscar usuário
    const user = await c.env.DB.prepare(
      'SELECT password_hash FROM users WHERE id = ?'
    ).bind(payload.sub).first();
    
    if (!user) {
      return c.json({ error: 'Usuário não encontrado' }, 404);
    }
    
    // Verificar senha atual
    const validPassword = await verifyPassword(currentPassword, user.password_hash as string);
    
    if (!validPassword) {
      return c.json({ error: 'Senha atual incorreta' }, 401);
    }
    
    // Atualizar senha
    const newHash = await hashPassword(newPassword);
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(newHash, payload.sub).run();
    
    return c.json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Change password error:', error);
    return c.json({ error: 'Erro ao alterar senha' }, 500);
  }
});

// Criar usuário (apenas admin)
authRoutes.post('/users', async (c) => {
  try {
    const token = getCookie(c, 'auth_token') || c.req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: 'Não autenticado' }, 401);
    }
    
    const payload = await verify(token, c.env.JWT_SECRET);
    
    if (payload.role !== 'admin') {
      return c.json({ error: 'Sem permissão' }, 403);
    }
    
    const { email, password, name, role } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: 'Email, senha e nome são obrigatórios' }, 400);
    }
    
    // Verificar se email já existe
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first();
    
    if (existing) {
      return c.json({ error: 'Email já cadastrado' }, 400);
    }
    
    const id = `user_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const passwordHash = await hashPassword(password);
    
    await c.env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, email.toLowerCase(), passwordHash, name, role || 'editor').run();
    
    return c.json({
      success: true,
      user: { id, email: email.toLowerCase(), name, role: role || 'editor' }
    }, 201);
  } catch (error) {
    console.error('Create user error:', error);
    return c.json({ error: 'Erro ao criar usuário' }, 500);
  }
});
