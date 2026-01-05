/**
 * =============================================================================
 * TESTES E2E DO ADMIN
 * =============================================================================
 * 
 * Testa se as páginas principais do Admin carregam corretamente.
 * Estes são testes de "smoke" - verificam se nada está quebrado.
 * 
 * Execute com: npm run test:e2e
 * =============================================================================
 */

import { test, expect } from '@playwright/test';

const ADMIN_URL = process.env.ADMIN_URL || 'https://cms-site-admin.pages.dev';

// =============================================================================
// TESTES DE CARREGAMENTO DE PÁGINAS
// =============================================================================
test.describe('📱 Páginas do Admin', () => {
  
  test('Página de Login carrega', async ({ page }) => {
    await page.goto(ADMIN_URL);
    
    // Deve mostrar formulário de login ou redirecionar para login
    await expect(page.locator('form, [data-testid="login-form"], input[type="email"], input[type="password"]').first()).toBeVisible({ timeout: 10000 });
  });
  
  test('Página de Login tem campos obrigatórios', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    
    // Verificar campos de email e senha
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
  });
  
  test('Login com credenciais inválidas mostra erro', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    
    // Preencher formulário com dados inválidos
    await page.fill('input[type="email"], input[name="email"]', 'teste@invalido.com');
    await page.fill('input[type="password"], input[name="password"]', 'senhaerrada');
    
    // Submeter formulário
    await page.click('button[type="submit"]');
    
    // Deve mostrar mensagem de erro
    await expect(page.locator('text=/erro|inválid|falha|error|invalid/i').first()).toBeVisible({ timeout: 10000 });
  });
});

// =============================================================================
// TESTES DE RESPONSIVIDADE
// =============================================================================
test.describe('📐 Responsividade', () => {
  
  test('Login funciona em mobile', async ({ page }) => {
    // Simular tela de celular
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(`${ADMIN_URL}/login`);
    
    // Formulário deve estar visível
    await expect(page.locator('form').first()).toBeVisible({ timeout: 10000 });
  });
  
  test('Login funciona em tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto(`${ADMIN_URL}/login`);
    
    await expect(page.locator('form').first()).toBeVisible({ timeout: 10000 });
  });
});

// =============================================================================
// TESTES DE PERFORMANCE
// =============================================================================
test.describe('⚡ Performance', () => {
  
  test('Página carrega em menos de 5 segundos', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(ADMIN_URL);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000);
  });
});

// =============================================================================
// TESTES DE ACESSIBILIDADE BÁSICA
// =============================================================================
test.describe('♿ Acessibilidade', () => {
  
  test('Página tem título', async ({ page }) => {
    await page.goto(ADMIN_URL);
    
    const title = await page.title();
    expect(title).toBeTruthy();
  });
  
  test('Inputs têm labels ou placeholders', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    
    const inputs = await page.locator('input').all();
    
    for (const input of inputs) {
      const hasLabel = await input.getAttribute('aria-label');
      const hasPlaceholder = await input.getAttribute('placeholder');
      const id = await input.getAttribute('id');
      const hasLabelFor = id ? await page.locator(`label[for="${id}"]`).count() : 0;
      
      expect(hasLabel || hasPlaceholder || hasLabelFor > 0).toBeTruthy();
    }
  });
});
