import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  const testEmail = 'testuser_e2e@example.com';
  const testPassword = 'Password123!';

  test('should allow a user to sign in and sign out', async ({ page }) => {
    // 1. Sign In
    await page.goto('/');
    
    // Fill login form
    await page.getByPlaceholder('البريد الإلكتروني').fill(testEmail);
    await page.getByPlaceholder('كلمة المرور').fill(testPassword);
    await page.locator('button[type="submit"]').click();
    
    // Check for UI error
    try {
      const errorEl = page.locator('.text-red-200');
      if (await errorEl.isVisible({ timeout: 2000 })) {
        console.log('UI ERROR MESSAGE:', await errorEl.textContent());
      }
    } catch (e) {
      // no error visible
    }

    // Verify successful login redirects to home page
    await expect(page).toHaveURL('/home', { timeout: 10000 });
    await expect(page.getByText('لك')).toBeVisible();

    // 2. Sign Out
    await page.getByRole('button', { name: 'تسجيل الخروج' }).click();
    await expect(page).toHaveURL('/');
  });
});
