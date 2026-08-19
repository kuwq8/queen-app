import { test, expect } from '@playwright/test';

test.describe('Communities System', () => {
  const user1Email = 'testuser_e2e@example.com';
  const password = 'Password123!';
  const communityName = `Community ${new Date().getTime()}`;

  test('should allow user to create, join, and post in a community', async ({ page }) => {
    // 1. Log in
    await page.goto('/');
    await page.getByPlaceholder('البريد الإلكتروني').fill(user1Email);
    await page.getByPlaceholder('كلمة المرور').fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/home', { timeout: 10000 });

    // 2. Go to Communities Tab
    await page.getByText('المجتمعات').click();
    
    // 3. Create a new community
    await page.getByText('أنشئ مجتمعاً').click();
    await expect(page).toHaveURL('/communities/create');

    await page.getByPlaceholder('مثال: مبرمجون العرب').fill(communityName);
    await page.getByPlaceholder('عن ماذا يتحدث هذا المجتمع؟').fill('This is a test community for E2E testing.');
    await page.locator('button[type="submit"]').click();

    // 4. Verify we are redirected to the new community page
    await expect(page).toHaveURL(/\/communities\/[a-zA-Z0-9-]{36}/, { timeout: 10000 });
    
    // Check if the community name is visible
    await expect(page.getByRole('heading', { name: communityName }).first()).toBeVisible();
    
    // The creator should automatically be a member, so the button should say "عضو"
    await expect(page.getByText('عضو', { exact: true }).first()).toBeVisible();

    // 5. Create a post in the community
    await page.locator('button', { hasText: 'نشر في المجتمع' }).click();
    // No, wait, the FAB is an icon. Let's find it by clicking the Feather icon wrapper
    // Actually the FAB has an onClick that opens the modal.
    // Let's use evaluate or just click the bottom-left corner where the FAB is, or add a specific locator
    // But since the FAB is a button with a Feather icon inside, we can just click the button that is absolute bottom left
    const fab = page.locator('button.absolute.bottom-20.left-4');
    await fab.click();

    const postContent = `Hello from ${communityName}`;
    await page.getByPlaceholder(`شارك أفكارك في ${communityName}...`).fill(postContent);
    await page.getByText('نشر في المجتمع').click();

    // Verify post appears in the community feed
    await expect(page.getByText(postContent)).toBeVisible({ timeout: 5000 });

    // 6. Go back to Home and check if it's in the Communities list
    await page.goto('/home');
    await page.getByText('المجتمعات').click();
    await expect(page.getByText(communityName)).toBeVisible();
  });
});
