import { test, expect, BrowserContext } from '@playwright/test';

test.describe('Cross-user Realtime', () => {
  let contextA: BrowserContext;
  let contextB: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    // Create two separate browser contexts
    contextA = await browser.newContext();
    contextB = await browser.newContext();

    // Login User A
    const pageA = await contextA.newPage();
    await pageA.goto('/');
    await pageA.getByPlaceholder('البريد الإلكتروني').fill('test_user_a@gemini.com');
    await pageA.getByPlaceholder('كلمة المرور').fill('Password123!');
    await pageA.locator('button[type="submit"]').click();
    await pageA.waitForURL('**/home', { timeout: 15000 });

    // Login User B
    const pageB = await contextB.newPage();
    await pageB.goto('/');
    await pageB.getByPlaceholder('البريد الإلكتروني').fill('test_user_b@gemini.com');
    await pageB.getByPlaceholder('كلمة المرور').fill('Password123!');
    await pageB.locator('button[type="submit"]').click();
    await pageB.waitForURL('**/home', { timeout: 15000 });
  });

  test.afterAll(async () => {
    await contextA.close();
    await contextB.close();
  });

  test('User B should see User A\'s post and like in realtime', async () => {
    const pageA = await contextA.pages()[0];
    const pageB = await contextB.pages()[0];

    // User A writes a post
    const postContent = `Realtime test post ${Date.now()}`;
    await pageA.getByPlaceholder('ماذا يحدث؟').fill(postContent);
    await pageA.getByRole('button', { name: 'نشر' }).click();

    // Wait for the post to appear for User A
    await expect(pageA.getByText(postContent)).toBeVisible({ timeout: 10000 });

    // Verify User B sees the post WITHOUT refreshing
    await expect(pageB.getByText(postContent)).toBeVisible({ timeout: 10000 });

    // User A likes their own post
    const likeButtonA = pageA.locator('div').filter({ hasText: postContent }).locator('button').filter({ has: pageA.locator('svg.lucide-heart') }).first();
    await likeButtonA.click();

    // Verify User B sees the like count go to 1 WITHOUT refreshing
    const likeCountB = pageB.locator('div').filter({ hasText: postContent }).locator('button').filter({ has: pageB.locator('svg.lucide-heart') }).first();
    await expect(likeCountB).toContainText('1', { timeout: 10000 });
  });
});
