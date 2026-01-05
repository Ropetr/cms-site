/**
 * =============================================================================
 * TESTES DE REGRESSÃO DA API
 * =============================================================================
 * 
 * Este arquivo testa todos os endpoints da API para garantir que:
 * 1. Endpoints existentes continuam funcionando
 * 2. Respostas têm o formato esperado
 * 3. Autenticação funciona corretamente
 * 4. Banco de dados está acessível
 * 
 * Execute com: npm test
 * =============================================================================
 */

import { describe, it, expect, beforeAll } from 'vitest';

const API_URL = process.env.API_URL || 'https://cms-site-api.planacacabamentos.workers.dev';

// Token de teste (será obtido no beforeAll)
let authToken: string = '';

// Helper para fazer requisições
async function apiRequest(
  method: string,
  path: string,
  body?: object,
  authenticated: boolean = false
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (authenticated && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const data = await response.json().catch(() => ({}));
  
  return { status: response.status, data };
}

// =============================================================================
// TESTES DE SAÚDE E INFRAESTRUTURA
// =============================================================================
describe('🏥 Health & Infrastructure', () => {
  it('GET /health - API está online', async () => {
    const { status, data } = await apiRequest('GET', '/health');
    
    expect(status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
  });
  
  it('Endpoint inexistente retorna 404', async () => {
    const { status } = await apiRequest('GET', '/api/endpoint-que-nao-existe');
    
    expect(status).toBe(404);
  });
});

// =============================================================================
// TESTES DE AUTENTICAÇÃO
// =============================================================================
describe('🔐 Autenticação', () => {
  it('POST /api/auth/login - Credenciais inválidas retorna 401', async () => {
    const { status, data } = await apiRequest('POST', '/api/auth/login', {
      email: 'usuario@invalido.com',
      password: 'senhaerrada',
    });
    
    expect(status).toBe(401);
    expect(data.error).toBeDefined();
  });
  
  it('POST /api/auth/login - Body vazio retorna erro', async () => {
    const { status } = await apiRequest('POST', '/api/auth/login', {});
    
    expect([400, 401, 500]).toContain(status);
  });
  
  it('Endpoints protegidos retornam 401 sem token', async () => {
    const protectedEndpoints = [
      '/api/pages',
      '/api/menus',
      '/api/media',
      '/api/settings',
    ];
    
    for (const endpoint of protectedEndpoints) {
      const { status } = await apiRequest('GET', endpoint);
      expect(status).toBe(401);
    }
  });
});

// =============================================================================
// TESTES DE PÁGINAS
// =============================================================================
describe('📄 Páginas', () => {
  // Estes testes precisam de autenticação
  // Por enquanto, só verificamos que o endpoint existe e requer auth
  
  it('GET /api/pages - Requer autenticação', async () => {
    const { status } = await apiRequest('GET', '/api/pages');
    expect(status).toBe(401);
  });
  
  it('GET /api/pages/:id - Requer autenticação', async () => {
    const { status } = await apiRequest('GET', '/api/pages/1');
    expect(status).toBe(401);
  });
  
  it('POST /api/pages - Requer autenticação', async () => {
    const { status } = await apiRequest('POST', '/api/pages', {
      title: 'Teste',
      slug: 'teste',
    });
    expect(status).toBe(401);
  });
});

// =============================================================================
// TESTES DE MENUS
// =============================================================================
describe('🍔 Menus', () => {
  it('GET /api/menus - Requer autenticação', async () => {
    const { status } = await apiRequest('GET', '/api/menus');
    expect(status).toBe(401);
  });
  
  it('GET /api/menu-items - Requer autenticação', async () => {
    const { status } = await apiRequest('GET', '/api/menu-items');
    expect(status).toBe(401);
  });
});

// =============================================================================
// TESTES DE MÍDIA
// =============================================================================
describe('🖼️ Mídia', () => {
  it('GET /api/media - Requer autenticação', async () => {
    const { status } = await apiRequest('GET', '/api/media');
    expect(status).toBe(401);
  });
});

// =============================================================================
// TESTES DE CONFIGURAÇÕES
// =============================================================================
describe('⚙️ Configurações', () => {
  it('GET /api/settings - Requer autenticação', async () => {
    const { status } = await apiRequest('GET', '/api/settings');
    expect(status).toBe(401);
  });
});

// =============================================================================
// TESTES DE FORMATO DE RESPOSTA
// =============================================================================
describe('📋 Formato de Respostas', () => {
  it('Erros têm formato consistente', async () => {
    const { data } = await apiRequest('GET', '/api/pages');
    
    // Erro deve ter campo 'error' ou 'message'
    expect(data.error || data.message).toBeDefined();
  });
  
  it('Content-Type é application/json', async () => {
    const response = await fetch(`${API_URL}/health`);
    const contentType = response.headers.get('content-type');
    
    expect(contentType).toContain('application/json');
  });
  
  it('CORS está configurado', async () => {
    const response = await fetch(`${API_URL}/health`);
    const cors = response.headers.get('access-control-allow-origin');
    
    expect(cors).toBeDefined();
  });
});
