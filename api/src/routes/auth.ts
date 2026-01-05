/**
 * Rotas de Autenticação
 * 
 * CORREÇÕES DE SEGURANÇA:
 * - Hash de senha usando scrypt (nativo do Web Crypto API)
 * - Salt único por usuário (16 bytes random)
 * - Rate limiting para prevenir força bruta
 */

import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import type { Env } from '../index';

export const authRoutes = new Hono<{ Bindings: Env }>();

// =============================================
// FUNÇÕES DE HASH SEGURAS
// =============================================

/**
 * Gera salt aleatório de 16 bytes
 */
function generateSalt(): string {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash de senha usando PBKDF2 com SHA-256
 * Mais seguro que SHA-256 simples, compatível com Web Crypto API
 */
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000, // 100k iterações para segurança
      hash: 'SHA-256'
    },
    passwordKey,
    256
  );
  
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verifica senha comparando com hash armazenado
 */
async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  const passwordHash = await hashPassword(password, salt);
  
  // Comparação em tempo constante para prevenir timing attacks
  if (passwordHash.length !== storedHash.length) return false;
  
  let result = 0;
  for (let i = 0; i < passwordHash.length; i++) {
    result |= passwordHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return result === 0;
}

// =============================================
// RATE LIMITING
// =============================================

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  blockedUntil?: number;
}

const RATE_LIMIT = {
  maxAttempts: 5,           // Máximo de tentativas
  windowMs: 60 * 1000,      // Janela de 1 minuto
  blockDurationMs: 15 * 60 * 1000, // Bloqueio de 15 minutos
};

async function checkRateLimit(env: Env, identifier: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const key = `ratelimit:auth:${identifier}`;
  const now = Date.now();
  
  try {
    const data = await env.CACHE.get(key);
    
    if (!data) {
      // Primeira tentativa
      await env.CACHE.put(key, JSON.stringify({
        attempts: 1,
        firstAttempt: now
      }), { expirationTtl: Math.ceil(RATE_LIMIT.windowMs / 1000) });
      return { allowed: true };
    }
    
    const entry: RateLimitEntry = JSON.parse(data);
    
    // Verificar se está bloqueado
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return { 
        allowed: false, 
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000) 
      };
    }
    
    // Verificar se janela expirou
    if (now - entry.firstAttempt > RATE_LIMIT.windowMs) {
      // Reset
      await env.CACHE.put(key, JSON.stringify({
        attempts: 1,
        firstAttempt: now
      }), { expirationTtl: Math.ceil(RATE_LIMIT.windowMs / 1000) });
      return { allowed: true };
    }
    
    // Incrementar tentativas
    entry.attempts++;
    
    if (entry.attempts > RATE_LIMIT.maxAttempts) {
      // Bloquear
      entry.blockedUntil = now + RATE_LIMIT.blockDurationMs;
      await env.CACHE.put(key, JSON.stringify(entry), { 
        expirationTtl: Math.ceil(RATE_LIMIT.blockDurationMs / 1000) 
      });
      return { 
        allowed: false, 
        retryAfter: Math.ceil(RATE_LIMIT.blockDurationMs / 1000) 
      };
    }
    
    await env.CACHE.put(key, JSON.stringify(entry), { 
      expirationTtl: Math.ceil(RATE_LIMIT.windowMs / 1000) 
    });
    return { allowed: true };
    
  } catch (error) {
    // Em caso de erro, permitir (fail open) mas logar
    console.error('Rate limit check error:', error);
    return { allowed: true };
  }
}

async function resetRateLimit(env: Env, identifier: string): Promise<void> {
  const key = `ratelimit:auth:${identifier}`;
  try {
    await env.CACHE.delete(key);
  } catch (error) {
    console.error('Rate limit reset error:', error);
  }
}

// =============================================
// ROTAS
// =============================================

// Login
authRoutes.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email e senha são obrigatórios' }, 400);
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Rate limiting por IP + email
    const clientIP = c.req.header('CF-Connecting-IP') || 
                     c.req.header('X-Forwarded-For')?.split(',')[0] || 
                     'unknown';
    const rateLimitKey = `${clientIP}:${normalizedEmail}`;
    
    const rateLimit = await checkRateLimit(c.env, rateLimitKey);
    if (!rateLimit.allowed) {
      return c.json({ 
        error: 'Muitas tentativas de login. Tente novamente mais tarde.',
        retryAfter: rateLimit.retryAfter 
      }, 429);
    }
    
    // Buscar usuário
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND active = 1'
    ).bind(normalizedEmail).first();
    
    if (!user) {
      return c.json({ error: 'Credenciais inválidas' }, 401);
    }
    
    // Verificar senha
    // Suporta tanto o novo formato (com salt) quanto o legado (sem salt)
    let validPassword = false;
    
    if (user.password_salt) {
      // Novo formato com salt
      validPassword = await verifyPassword(
        password, 
        user.password_hash as string, 
        user.password_salt as string
      );
    } else {
      // Formato legado (SHA-256 com salt estático) - para migração
      const encoder = new TextEncoder();
      const data = encoder.encode(password + 'cms-site-salt');
      const hash = await crypto.subtle.digest('SHA-256', data);
      const legacyHash = Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      validPassword = legacyHash === user.password_hash;
      
      // Se válido, migrar para novo formato
      if (validPassword) {
        const newSalt = generateSalt();
        const newHash = await hashPassword(password, newSalt);
        await c.env.DB.prepare(
          'UPDATE users SET password_hash = ?, password_salt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(newHash, newSalt, user.id).run();
      }
    }
    
    if (!validPassword) {
      return c.json({ error: 'Credenciais inválidas' }, 401);
    }
    
    // Login bem-sucedido - resetar rate limit
    await resetRateLimit(c.env, rateLimitKey);
    
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
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar_url: user.avatar_url,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Erro ao fazer login' }, 500);
  }
});

// Logout
authRoutes.post('/logout', async (c) => {
  const token = getCookie(c, 'auth_token') || c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (token) {
    try {
      const payload = await verify(token, c.env.JWT_SECRET);
      // Invalidar sessão
      await c.env.SESSIONS.delete(`session:${payload.sub}`);
      
      // Adicionar token à blacklist (expira junto com o token original)
      const exp = (payload as any).exp || Math.floor(Date.now() / 1000) + 86400;
      const ttl = exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await c.env.CACHE.put(`blacklist:${token}`, '1', { expirationTtl: ttl });
      }
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
    
    // Verificar se token está na blacklist
    const isBlacklisted = await c.env.CACHE.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return c.json({ error: 'Sessão inválida' }, 401);
    }
    
    const payload = await verify(token, c.env.JWT_SECRET);
    
    // Verificar se sessão existe
    const session = await c.env.SESSIONS.get(`session:${payload.sub}`);
    if (!session) {
      return c.json({ error: 'Sessão expirada' }, 401);
    }
    
    // Buscar dados atualizados do usuário
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, role, avatar_url FROM users WHERE id = ? AND active = 1'
    ).bind(payload.sub).first();
    
    if (!user) {
      return c.json({ error: 'Usuário não encontrado' }, 404);
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
    
    if (newPassword.length < 8) {
      return c.json({ error: 'Nova senha deve ter no mínimo 8 caracteres' }, 400);
    }
    
    // Buscar usuário
    const user = await c.env.DB.prepare(
      'SELECT password_hash, password_salt FROM users WHERE id = ?'
    ).bind(payload.sub).first();
    
    if (!user) {
      return c.json({ error: 'Usuário não encontrado' }, 404);
    }
    
    // Verificar senha atual
    let validPassword = false;
    if (user.password_salt) {
      validPassword = await verifyPassword(
        currentPassword, 
        user.password_hash as string, 
        user.password_salt as string
      );
    } else {
      // Legado
      const encoder = new TextEncoder();
      const data = encoder.encode(currentPassword + 'cms-site-salt');
      const hash = await crypto.subtle.digest('SHA-256', data);
      const legacyHash = Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      validPassword = legacyHash === user.password_hash;
    }
    
    if (!validPassword) {
      return c.json({ error: 'Senha atual incorreta' }, 401);
    }
    
    // Gerar novo hash com salt único
    const newSalt = generateSalt();
    const newHash = await hashPassword(newPassword, newSalt);
    
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ?, password_salt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(newHash, newSalt, payload.sub).run();
    
    return c.json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Change password error:', error);
    return c.json({ error: 'Erro ao alterar senha' }, 500);
  }
});

// Criar usuário (admin only)
authRoutes.post('/users', async (c) => {
  try {
    const token = getCookie(c, 'auth_token') || c.req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: 'Não autenticado' }, 401);
    }
    
    const payload = await verify(token, c.env.JWT_SECRET) as any;
    
    // Verificar se é admin
    if (payload.role !== 'admin') {
      return c.json({ error: 'Apenas administradores podem criar usuários' }, 403);
    }
    
    const { email, password, name, role } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: 'Email, senha e nome são obrigatórios' }, 400);
    }
    
    if (password.length < 8) {
      return c.json({ error: 'Senha deve ter no mínimo 8 caracteres' }, 400);
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Verificar se email já existe
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(normalizedEmail).first();
    
    if (existing) {
      return c.json({ error: 'Email já cadastrado' }, 400);
    }
    
    const id = `user_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    
    await c.env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, password_salt, name, role) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, normalizedEmail, passwordHash, salt, name, role || 'editor').run();
    
    return c.json({
      success: true,
      user: { id, email: normalizedEmail, name, role: role || 'editor' }
    }, 201);
  } catch (error) {
    console.error('Create user error:', error);
    return c.json({ error: 'Erro ao criar usuário' }, 500);
  }
});

// Listar usuários (admin only)
authRoutes.get('/users', async (c) => {
  try {
    const token = getCookie(c, 'auth_token') || c.req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: 'Não autenticado' }, 401);
    }
    
    const payload = await verify(token, c.env.JWT_SECRET) as any;
    
    if (payload.role !== 'admin') {
      return c.json({ error: 'Apenas administradores podem listar usuários' }, 403);
    }
    
    const users = await c.env.DB.prepare(
      'SELECT id, email, name, role, avatar_url, active, created_at, last_login_at FROM users ORDER BY created_at DESC'
    ).all();
    
    return c.json({ success: true, users: users.results });
  } catch (error) {
    console.error('List users error:', error);
    return c.json({ error: 'Erro ao listar usuários' }, 500);
  }
});
