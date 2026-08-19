import { test, expect } from '@playwright/test';

test.describe('Follow System', () => {
  const timestamp = new Date().getTime();
  const user1Email = 'testuser_e2e@example.com';
  const user1Name = 'testuser_e2e';
  const user2Email = 'testuser2_e2e@example.com';
  const password = 'Password123!';
  const postContent = `Hello from user1 ${timestamp}`;

  test('should follow another user and see their posts in Following feed', async ({ page }) => {
    // 1. Login User 1
    await page.goto('/');
    await page.getByPlaceholder('البريد الإلكتروني').fill(user1Email);
    await page.getByPlaceholder('كلمة المرور').fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/home', { timeout: 10000 });

    // Create post for User 1
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const fab = btns.find(b => b.className.includes('bottom-20 left-4 bg-cyan-600'));
      if (fab) fab.click();
    });
    await page.getByPlaceholder('ماذا يحدث؟!').fill(postContent);
    await page.getByRole('button', { name: 'نشر' }).click();
    await expect(page.getByText(postContent)).toBeVisible();

    // Logout
    await page.getByRole('button', { name: 'تسجيل الخروج' }).click();
    await expect(page).toHaveURL('/');

    // 2. Login User 2
    await page.getByPlaceholder('البريد الإلكتروني').fill(user2Email);
    await page.getByPlaceholder('كلمة المرور').fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/home', { timeout: 10000 });

    // 3. Go to User 1's profile
    await page.getByText('لك').click();
    await expect(page.getByText(postContent)).toBeVisible();
    
    const postLocator = page.locator('.border-slate-800').filter({ hasText: postContent }).first();
    await postLocator.getByText(user1Name).click();
    
    await expect(page.getByText(`${user1Name}`)).toBeVisible();

    const followBtn = page.getByRole('button', { name: 'متابعة' });
    const isVisible = await followBtn.isVisible();
    if (isVisible) {
      await followBtn.click();
    }
    
    await expect(page.getByRole('button', { name: 'متابَع' })).toBeVisible();

    // 4. Check Following feed
    await page.goto('/home');
    await page.getByText('متابَعون').click();
    await expect(page.getByText(postContent)).toBeVisible();
    
    // 5. Unfollow
    await page.goto(`/${user1Name}`);
    await page.getByRole('button', { name: 'متابَع' }).click();
    await expect(page.getByRole('button', { name: 'متابعة' })).toBeVisible();
  });
});
