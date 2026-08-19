# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication >> should allow a user to sign in and sign out
- Location: tests\e2e\auth.spec.ts:7:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

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
        - textbox "البريد الإلكتروني" [ref=e17]
        - textbox "كلمة المرور" [ref=e19]
        - button "تسجيل الدخول" [ref=e20]
      - generic [ref=e21]: أو
      - button [ref=e26]:
        - img "Google" [ref=e27]
        - text: الدخول باستخدام Google
  - alert [ref=e30]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication', () => {
  4  |   const testEmail = 'testuser_e2e@example.com';
  5  |   const testPassword = 'Password123!';
  6  | 
  7  |   test('should allow a user to sign in and sign out', async ({ page }) => {
  8  |     // 1. Sign In
> 9  |     await page.goto('/');
     |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  10 |     
  11 |     // Fill login form
  12 |     await page.getByPlaceholder('البريد الإلكتروني').fill(testEmail);
  13 |     await page.getByPlaceholder('كلمة المرور').fill(testPassword);
  14 |     await page.locator('button[type="submit"]').click();
  15 |     
  16 |     // Check for UI error
  17 |     try {
  18 |       const errorEl = page.locator('.text-red-200');
  19 |       if (await errorEl.isVisible({ timeout: 2000 })) {
  20 |         console.log('UI ERROR MESSAGE:', await errorEl.textContent());
  21 |       }
  22 |     } catch (e) {
  23 |       // no error visible
  24 |     }
  25 | 
  26 |     // Verify successful login redirects to home page
  27 |     await expect(page).toHaveURL('/home', { timeout: 10000 });
  28 |     await expect(page.getByText('لك')).toBeVisible();
  29 | 
  30 |     // 2. Sign Out
  31 |     await page.getByRole('button', { name: 'تسجيل الخروج' }).click();
  32 |     await expect(page).toHaveURL('/');
  33 |   });
  34 | });
  35 | 
```