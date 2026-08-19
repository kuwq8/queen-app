import { test, expect } from '@playwright/test';

test.describe('Direct Messages System', () => {
  const user1Email = 'testuser_e2e@example.com';
  const user2Email = 'testuser2_e2e@example.com';
  const password = 'Password123!';
  const messageContent = `Hello from user1 ${new Date().getTime()}`;

  test('should allow user1 to send a message to user2, and user2 can read and reply', async ({ page, browser }) => {
    // We will use two separate browser contexts to simulate real-time chat between two users!
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    
    // 1. User 1 logs in
    await page1.goto('/');
    await page1.getByPlaceholder('البريد الإلكتروني').fill(user1Email);
    await page1.getByPlaceholder('كلمة المرور').fill(password);
    await page1.locator('button[type="submit"]').click();
    await expect(page1).toHaveURL('/home', { timeout: 10000 });

    // User 1 goes to User 2's profile
    await page1.goto('/testuser2_e2e');
    
    // User 1 clicks on the 'Mail' button to start chat
    await page1.locator('button[title="مراسلة"]').click();
    await expect(page1).toHaveURL(/\/messages\/[a-zA-Z0-9-]{36}/, { timeout: 10000 });

    // User 1 sends a message
    await page1.getByPlaceholder('اكتب رسالة...').fill(messageContent);
    await page1.locator('button[type="submit"]').click();
    
    // Verify message appears in User 1's UI
    await expect(page1.getByText(messageContent)).toBeVisible();

    // ---------------------------------------------------- //
    // 2. User 2 logs in on a second page
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    
    await page2.goto('/');
    await page2.getByPlaceholder('البريد الإلكتروني').fill(user2Email);
    await page2.getByPlaceholder('كلمة المرور').fill(password);
    await page2.locator('button[type="submit"]').click();
    await expect(page2).toHaveURL('/home', { timeout: 10000 });

    // Verify User 2 has an unread notification on the Messages tab (optional depending on Realtime speed)
    // We'll just go straight to the messages tab
    await page2.goto('/messages');
    
    // User 2 should see User 1 in the inbox with the message preview
    await expect(page2.getByText('testuser_e2e')).toBeVisible();
    await expect(page2.getByText(messageContent)).toBeVisible();

    // User 2 opens the chat
    await page2.getByText('testuser_e2e').click();
    await expect(page2).toHaveURL(/\/messages\/[a-zA-Z0-9-]{36}/, { timeout: 10000 });
    
    // User 2 should see the message
    await expect(page2.getByText(messageContent)).toBeVisible();

    // User 2 replies
    const replyContent = `Reply from user2 ${new Date().getTime()}`;
    await page2.getByPlaceholder('اكتب رسالة...').fill(replyContent);
    await page2.locator('button[type="submit"]').click();
    await expect(page2.getByText(replyContent)).toBeVisible();

    // ---------------------------------------------------- //
    // 3. User 1 should receive the reply in real-time without refreshing
    await expect(page1.getByText(replyContent)).toBeVisible({ timeout: 10000 });
  });
});
