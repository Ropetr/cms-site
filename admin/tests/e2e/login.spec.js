import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form correctly', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('CMS Site');
    
    // Check form elements are present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check labels
    await expect(page.getByText('E-mail')).toBeVisible();
    await expect(page.getByText('Senha')).toBeVisible();
  });

  test('should show password toggle button', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    const toggleButton = page.locator('button[type="button"]');
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle to show password
    await toggleButton.click();
    await expect(page.locator('input[placeholder="••••••••"]')).toHaveAttribute('type', 'text');
    
    // Click toggle to hide password again
    await toggleButton.click();
    await expect(page.locator('input[placeholder="••••••••"]')).toHaveAttribute('type', 'password');
  });

  test('should require email and password fields', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    // Check that inputs have required attribute
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('should validate email format', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    
    // Type invalid email
    await emailInput.fill('invalid-email');
    
    // Check that the input is invalid
    const isInvalid = await emailInput.evaluate((el) => !el.validity.valid);
    expect(isInvalid).toBe(true);
    
    // Type valid email
    await emailInput.fill('valid@email.com');
    
    // Check that the input is valid
    const isValid = await emailInput.evaluate((el) => el.validity.valid);
    expect(isValid).toBe(true);
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.locator('input[type="email"]').fill('wrong@email.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    
    // Submit form
    await page.locator('button[type="submit"]').click();
    
    // Wait for error message (either network error or invalid credentials)
    await expect(page.locator('.text-red-600, .bg-red-50')).toBeVisible({ timeout: 10000 });
  });

  test('should show loading state when submitting', async ({ page }) => {
    // Fill in credentials
    await page.locator('input[type="email"]').fill('test@email.com');
    await page.locator('input[type="password"]').fill('testpassword');
    
    // Click submit and check for loading state
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Button should be disabled during loading
    await expect(submitButton).toBeDisabled({ timeout: 1000 });
  });

  test('should not display test credentials in production', async ({ page }) => {
    // Ensure test credentials are not visible on the page
    const pageContent = await page.content();
    expect(pageContent).not.toContain('Planac@Admin2026');
    expect(pageContent).not.toContain('Credenciais de teste');
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    // Check autocomplete attributes for better UX
    await expect(emailInput).toHaveAttribute('autocomplete', 'email');
    await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
  });
});
