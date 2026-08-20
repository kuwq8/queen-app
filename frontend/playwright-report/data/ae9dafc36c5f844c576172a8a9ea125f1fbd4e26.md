# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: realtime.spec.ts >> Cross-user Realtime >> User B should see User A's post and like in realtime
- Location: tests\e2e\realtime.spec.ts:34:7

# Error details

```
"beforeAll" hook timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Target page, context or browser has been closed
=========================== logs ===========================
waiting for navigation to "**/home" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - heading "Gemini Social" [level=1] [ref=e10]
        - paragraph [ref=e11]: مرحباً بك في قناةنا! سجل دخولك للمتابعة
      - generic [ref=e12]: Invalid login credentials
      - generic [ref=e13]:
        - button "تسجيل الدخول" [ref=e14]
        - button "إنشاء حساب جديد" [ref=e15]
      - generic [ref=e16]:
        - textbox "البريد الإلكتروني" [ref=e18]: test_user_a@gemini.com
        - textbox "كلمة المرور" [ref=e20]: Password123!
        - button "تسجيل الدخول" [ref=e21]
      - generic [ref=e22]: أو
      - button [ref=e27]:
        - img "Google" [ref=e28]
        - text: الدخول باستخدام Google
  - button "Open Next.js Dev Tools" [ref=e36] [cursor=pointer]
  - alert [ref=e40]
```

# Test source

```ts
  1  | import { test, expect, BrowserContext } from '@playwright/test';
  2  | 
  3  | test.describe('Cross-user Realtime', () => {
  4  |   let contextA: BrowserContext;
  5  |   let contextB: BrowserContext;
  6  | 
  7  |   test.beforeAll(async ({ browser }) => {
  8  |     // Create two separate browser contexts
  9  |     contextA = await browser.newContext();
  10 |     contextB = await browser.newContext();
  11 | 
  12 |     // Login User A
  13 |     const pageA = await contextA.newPage();
  14 |     await pageA.goto('/');
  15 |     await pageA.getByPlaceholder('البريد الإلكتروني').fill('test_user_a@gemini.com');
  16 |     await pageA.getByPlaceholder('كلمة المرور').fill('Password123!');
  17 |     await pageA.locator('button[type="submit"]').click();
> 18 |     await pageA.waitForURL('**/home', { timeout: 15000 });
     |                 ^ Error: page.waitForURL: Target page, context or browser has been closed
  19 | 
  20 |     // Login User B
  21 |     const pageB = await contextB.newPage();
  22 |     await pageB.goto('/');
  23 |     await pageB.getByPlaceholder('البريد الإلكتروني').fill('test_user_b@gemini.com');
  24 |     await pageB.getByPlaceholder('كلمة المرور').fill('Password123!');
  25 |     await pageB.locator('button[type="submit"]').click();
  26 |     await pageB.waitForURL('**/home', { timeout: 15000 });
  27 |   });
  28 | 
  29 |   test.afterAll(async () => {
  30 |     await contextA.close();
  31 |     await contextB.close();
  32 |   });
  33 | 
  34 |   test('User B should see User A\'s post and like in realtime', async () => {
  35 |     const pageA = await contextA.pages()[0];
  36 |     const pageB = await contextB.pages()[0];
  37 | 
  38 |     // User A writes a post
  39 |     const postContent = `Realtime test post ${Date.now()}`;
  40 |     await pageA.getByPlaceholder('ماذا يحدث؟').fill(postContent);
  41 |     await pageA.getByRole('button', { name: 'نشر' }).click();
  42 | 
  43 |     // Wait for the post to appear for User A
  44 |     await expect(pageA.getByText(postContent)).toBeVisible({ timeout: 10000 });
  45 | 
  46 |     // Verify User B sees the post WITHOUT refreshing
  47 |     await expect(pageB.getByText(postContent)).toBeVisible({ timeout: 10000 });
  48 | 
  49 |     // User A likes their own post
  50 |     const likeButtonA = pageA.filter({ hasText: postContent }).locator('button').filter({ has: pageA.locator('svg.lucide-heart') }).first();
  51 |     await likeButtonA.click();
  52 | 
  53 |     // Verify User B sees the like count go to 1 WITHOUT refreshing
  54 |     const likeCountB = pageB.filter({ hasText: postContent }).locator('button').filter({ has: pageB.locator('svg.lucide-heart') }).first();
  55 |     await expect(likeCountB).toContainText('1', { timeout: 10000 });
  56 |   });
  57 | });
  58 | 
```