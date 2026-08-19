# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: follow.spec.ts >> Follow System >> should follow another user and see their posts in Following feed
- Location: tests\e2e\follow.spec.ts:11:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button[type="submit"]')
    - locator resolved to <button type="submit" class="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-70">تسجيل الدخول</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - main [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - heading "Gemini Social" [level=1] [ref=e10]
        - paragraph [ref=e11]: مرحباً بك في مجتمعنا! سجل دخولك للمتابعة
      - generic [ref=e12]:
        - button "تسجيل الدخول" [ref=e13]
        - button "إنشاء حساب جديد" [ref=e14]
      - generic [ref=e15]:
        - textbox "البريد الإلكتروني" [ref=e17]: testuser_e2e@example.com
        - textbox "كلمة المرور" [active] [ref=e19]: Password123!
        - button "تسجيل الدخول" [ref=e20]
      - generic [ref=e21]: أو
      - button [ref=e26]:
        - img "Google" [ref=e27]
        - text: الدخول باستخدام Google
  - button "Open Next.js Dev Tools" [ref=e35] [cursor=pointer]
  - alert [ref=e39]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Follow System', () => {
  4  |   const timestamp = new Date().getTime();
  5  |   const user1Email = 'testuser_e2e@example.com';
  6  |   const user1Name = 'testuser_e2e';
  7  |   const user2Email = 'testuser2_e2e@example.com';
  8  |   const password = 'Password123!';
  9  |   const postContent = `Hello from user1 ${timestamp}`;
  10 | 
  11 |   test('should follow another user and see their posts in Following feed', async ({ page }) => {
  12 |     // 1. Login User 1
  13 |     await page.goto('/');
  14 |     await page.getByPlaceholder('البريد الإلكتروني').fill(user1Email);
  15 |     await page.getByPlaceholder('كلمة المرور').fill(password);
> 16 |     await page.locator('button[type="submit"]').click();
     |                                                 ^ Error: locator.click: Test timeout of 30000ms exceeded.
  17 |     await expect(page).toHaveURL('/home', { timeout: 10000 });
  18 | 
  19 |     // Create post for User 1
  20 |     await page.evaluate(() => {
  21 |       const btns = Array.from(document.querySelectorAll('button'));
  22 |       const fab = btns.find(b => b.className.includes('bottom-20 left-4 bg-cyan-600'));
  23 |       if (fab) fab.click();
  24 |     });
  25 |     await page.getByPlaceholder('ماذا يحدث؟!').fill(postContent);
  26 |     await page.getByRole('button', { name: 'نشر' }).click();
  27 |     await expect(page.getByText(postContent)).toBeVisible();
  28 | 
  29 |     // Logout
  30 |     await page.getByRole('button', { name: 'تسجيل الخروج' }).click();
  31 |     await expect(page).toHaveURL('/');
  32 | 
  33 |     // 2. Login User 2
  34 |     await page.getByPlaceholder('البريد الإلكتروني').fill(user2Email);
  35 |     await page.getByPlaceholder('كلمة المرور').fill(password);
  36 |     await page.locator('button[type="submit"]').click();
  37 |     await expect(page).toHaveURL('/home', { timeout: 10000 });
  38 | 
  39 |     // 3. Go to User 1's profile
  40 |     await page.getByText('لك').click();
  41 |     await expect(page.getByText(postContent)).toBeVisible();
  42 |     
  43 |     const postLocator = page.locator('.border-slate-800').filter({ hasText: postContent }).first();
  44 |     await postLocator.getByText(user1Name).click();
  45 |     
  46 |     await expect(page.getByText(`${user1Name}`)).toBeVisible();
  47 | 
  48 |     const followBtn = page.getByRole('button', { name: 'متابعة' });
  49 |     const isVisible = await followBtn.isVisible();
  50 |     if (isVisible) {
  51 |       await followBtn.click();
  52 |     }
  53 |     
  54 |     await expect(page.getByRole('button', { name: 'متابَع' })).toBeVisible();
  55 | 
  56 |     // 4. Check Following feed
  57 |     await page.goto('/home');
  58 |     await page.getByText('متابَعون').click();
  59 |     await expect(page.getByText(postContent)).toBeVisible();
  60 |     
  61 |     // 5. Unfollow
  62 |     await page.goto(`/${user1Name}`);
  63 |     await page.getByRole('button', { name: 'متابَع' }).click();
  64 |     await expect(page.getByRole('button', { name: 'متابعة' })).toBeVisible();
  65 |   });
  66 | });
  67 | 
```