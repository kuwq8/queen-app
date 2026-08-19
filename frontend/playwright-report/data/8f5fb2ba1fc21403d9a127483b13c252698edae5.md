# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: post.spec.ts >> Posts and Feed >> should create a new post, like it, and reply to it
- Location: tests\e2e\post.spec.ts:18:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected: "http://localhost:3000/home"
Received: "http://localhost:3000/"
Timeout:  10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    19 × locator resolved to <html lang="ar" dir="rtl" class="geist_a71539c9-module__T19VSG__variable geist_mono_8d43a2aa-module__8Li5zG__variable min-h-screen antialiased bg-[#0a0a0f]">…</html>
       - unexpected value "http://localhost:3000/"

```

```yaml
- main:
  - heading "Gemini Social" [level=1]
  - paragraph: مرحباً بك في مجتمعنا! سجل دخولك للمتابعة
  - text: Database error querying schema
  - button "تسجيل الدخول"
  - button "إنشاء حساب جديد"
  - textbox "البريد الإلكتروني": testuser_e2e@example.com
  - textbox "كلمة المرور": Password123!
  - button "تسجيل الدخول"
  - text: أو
  - button "Google الدخول باستخدام Google":
    - img "Google"
    - text: الدخول باستخدام Google
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Posts and Feed', () => {
  4  |   const timestamp = new Date().getTime();
  5  |   const testEmail = 'testuser_e2e@example.com';
  6  |   const testPassword = 'Password123!';
  7  |   const postContent = `This is a test post at ${timestamp}`;
  8  | 
  9  |   test.beforeEach(async ({ page }) => {
  10 |     // Login
  11 |     await page.goto('/');
  12 |     await page.getByPlaceholder('البريد الإلكتروني').fill(testEmail);
  13 |     await page.getByPlaceholder('كلمة المرور').fill(testPassword);
  14 |     await page.locator('button[type="submit"]').click();
> 15 |     await expect(page).toHaveURL('/home', { timeout: 10000 });
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  16 |   });
  17 | 
  18 |   test('should create a new post, like it, and reply to it', async ({ page }) => {
  19 |     // 1. Create Post
  20 |     await page.evaluate(() => {
  21 |       const btns = Array.from(document.querySelectorAll('button'));
  22 |       const fab = btns.find(b => b.className.includes('bottom-20 left-4 bg-cyan-600'));
  23 |       if (fab) fab.click();
  24 |     });
  25 | 
  26 |     await page.getByPlaceholder('ماذا يحدث؟!').fill(postContent);
  27 |     await page.getByRole('button', { name: 'نشر' }).click();
  28 |     await expect(page.getByText(postContent)).toBeVisible();
  29 | 
  30 |     // 2. Like the post
  31 |     const postLocator = page.locator('.border-slate-800').filter({ hasText: postContent }).first();
  32 |     const likeButton = postLocator.locator('button[title="إعجاب"]');
  33 |     await likeButton.click();
  34 |     await expect(likeButton).toContainText('1');
  35 | 
  36 |     // 3. Reply to the post
  37 |     await postLocator.click();
  38 |     const replyContent = 'This is a reply';
  39 |     await page.getByPlaceholder('اكتب ردك هنا...').fill(replyContent);
  40 |     await page.getByRole('button', { name: 'رد' }).click();
  41 |     await expect(page.getByText(replyContent)).toBeVisible();
  42 |   });
  43 | });
  44 | 
```