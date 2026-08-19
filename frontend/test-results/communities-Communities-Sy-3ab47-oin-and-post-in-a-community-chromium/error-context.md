# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: communities.spec.ts >> Communities System >> should allow user to create, join, and post in a community
- Location: tests\e2e\communities.spec.ts:8:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(page).toHaveURL(expected) failed

Expected: "http://localhost:3000/home"
Received: ""

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
        - textbox "كلمة المرور" [ref=e19]: Password123!
        - button "جاري التحميل..." [disabled] [ref=e20]
      - generic [ref=e21]: أو
      - button [disabled] [ref=e26]:
        - img "Google" [ref=e27]
        - text: جاري التحويل...
  - button "Open Next.js Dev Tools" [ref=e35] [cursor=pointer]
  - alert [ref=e39]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Communities System', () => {
  4  |   const user1Email = 'testuser_e2e@example.com';
  5  |   const password = 'Password123!';
  6  |   const communityName = `Community ${new Date().getTime()}`;
  7  | 
  8  |   test('should allow user to create, join, and post in a community', async ({ page }) => {
  9  |     // 1. Log in
  10 |     await page.goto('/');
  11 |     await page.getByPlaceholder('البريد الإلكتروني').fill(user1Email);
  12 |     await page.getByPlaceholder('كلمة المرور').fill(password);
  13 |     await page.locator('button[type="submit"]').click();
> 14 |     await expect(page).toHaveURL('/home', { timeout: 10000 });
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  15 | 
  16 |     // 2. Go to Communities Tab
  17 |     await page.getByText('المجتمعات').click();
  18 |     
  19 |     // 3. Create a new community
  20 |     await page.getByText('أنشئ مجتمعاً').click();
  21 |     await expect(page).toHaveURL('/communities/create');
  22 | 
  23 |     await page.getByPlaceholder('مثال: مبرمجون العرب').fill(communityName);
  24 |     await page.getByPlaceholder('عن ماذا يتحدث هذا المجتمع؟').fill('This is a test community for E2E testing.');
  25 |     await page.locator('button[type="submit"]').click();
  26 | 
  27 |     // 4. Verify we are redirected to the new community page
  28 |     await expect(page).toHaveURL(/\/communities\/[a-zA-Z0-9-]{36}/, { timeout: 10000 });
  29 |     
  30 |     // Check if the community name is visible
  31 |     await expect(page.getByRole('heading', { name: communityName }).first()).toBeVisible();
  32 |     
  33 |     // The creator should automatically be a member, so the button should say "عضو"
  34 |     await expect(page.getByText('عضو', { exact: true }).first()).toBeVisible();
  35 | 
  36 |     // 5. Create a post in the community
  37 |     await page.locator('button', { hasText: 'نشر في المجتمع' }).click();
  38 |     // No, wait, the FAB is an icon. Let's find it by clicking the Feather icon wrapper
  39 |     // Actually the FAB has an onClick that opens the modal.
  40 |     // Let's use evaluate or just click the bottom-left corner where the FAB is, or add a specific locator
  41 |     // But since the FAB is a button with a Feather icon inside, we can just click the button that is absolute bottom left
  42 |     const fab = page.locator('button.absolute.bottom-20.left-4');
  43 |     await fab.click();
  44 | 
  45 |     const postContent = `Hello from ${communityName}`;
  46 |     await page.getByPlaceholder(`شارك أفكارك في ${communityName}...`).fill(postContent);
  47 |     await page.getByText('نشر في المجتمع').click();
  48 | 
  49 |     // Verify post appears in the community feed
  50 |     await expect(page.getByText(postContent)).toBeVisible({ timeout: 5000 });
  51 | 
  52 |     // 6. Go back to Home and check if it's in the Communities list
  53 |     await page.goto('/home');
  54 |     await page.getByText('المجتمعات').click();
  55 |     await expect(page.getByText(communityName)).toBeVisible();
  56 |   });
  57 | });
  58 | 
```