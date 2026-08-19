import { test, expect } from '@playwright/test';

test.describe('Posts and Feed', () => {
  const timestamp = new Date().getTime();
  const testEmail = 'testuser_e2e@example.com';
  const testPassword = 'Password123!';
  const postContent = `This is a test post at ${timestamp}`;

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/');
    await page.getByPlaceholder('البريد الإلكتروني').fill(testEmail);
    await page.getByPlaceholder('كلمة المرور').fill(testPassword);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/home', { timeout: 10000 });
  });

  test('should create a new post, like it, and reply to it', async ({ page }) => {
    // 1. Create Post
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const fab = btns.find(b => b.className.includes('bottom-20 left-4 bg-cyan-600'));
      if (fab) fab.click();
    });

    await page.getByPlaceholder('ماذا يحدث؟!').fill(postContent);
    await page.getByRole('button', { name: 'نشر' }).click();
    await expect(page.getByText(postContent)).toBeVisible();

    // 2. Like the post
    const postLocator = page.locator('.border-slate-800').filter({ hasText: postContent }).first();
    const likeButton = postLocator.locator('button[title="إعجاب"]');
    await likeButton.click();
    await expect(likeButton).toContainText('1');

    // 3. Reply to the post
    await postLocator.click();
    const replyContent = 'This is a reply';
    await page.getByPlaceholder('اكتب ردك هنا...').fill(replyContent);
    await page.getByRole('button', { name: 'رد' }).click();
    await expect(page.getByText(replyContent)).toBeVisible();
  });
});
