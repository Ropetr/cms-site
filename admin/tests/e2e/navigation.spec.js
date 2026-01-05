import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should redirect to login when not authenticated (root/dashboard)', async ({ page }) => {
    // Try to access protected route (dashboard is at root '/')
    await page.goto('/');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing pages route', async ({ page }) => {
    await page.goto('/pages');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing settings route', async ({ page }) => {
    await page.goto('/settings');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should handle 404 routes gracefully', async ({ page }) => {
    await page.goto('/non-existent-route');
    
    // Should either show 404 page or redirect to login
    const url = page.url();
    const is404OrLogin = url.includes('/login') || url.includes('/404');
    expect(is404OrLogin || await page.locator('text=/not found|404|login/i').isVisible()).toBeTruthy();
  });
});

test.describe('Page Load Performance', () => {
  test('login page should load without console errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Filter out expected errors (like API connection issues in test env)
    const criticalErrors = errors.filter(err => 
      !err.includes('Network') && 
      !err.includes('fetch') &&
      !err.includes('API')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('login page should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});

test.describe('Responsive Design', () => {
  test('login page should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    
    // Check that form is still visible and usable
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('login page should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    
    // Check that form is still visible and usable
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('login page should be responsive on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/login');
    
    // Check that form is still visible and centered
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
