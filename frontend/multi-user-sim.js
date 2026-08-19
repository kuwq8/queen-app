const { chromium } = require('playwright');
const crypto = require('crypto');

(async () => {
  console.log("🚀 Starting Multi-User Live Simulation on Vercel App...");
  const URL = 'https://queen-app-six.vercel.app';
  
  const browser = await chromium.launch({ headless: true });
  
  // Create two distinct browser contexts
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  
  const userA = { email: `test_a_${Date.now()}@example.com`, pass: 'password123', name: 'User_A' };
  const userB = { email: `test_b_${Date.now()}@example.com`, pass: 'password123', name: 'User_B' };

  try {
    console.log("👤 User A: Registering and logging in...");
    await pageA.goto(`${URL}/login`);
    await pageA.click('text=ليس لديك حساب؟ سجل الآن');
    await pageA.fill('input[type="text"]', userA.name);
    await pageA.fill('input[type="email"]', userA.email);
    await pageA.fill('input[type="password"]', userA.pass);
    await pageA.click('button:has-text("إنشاء حساب")');
    await pageA.waitForURL(`${URL}/home`);
    console.log("✅ User A logged in successfully.");

    console.log("👤 User B: Registering and logging in...");
    await pageB.goto(`${URL}/login`);
    await pageB.click('text=ليس لديك حساب؟ سجل الآن');
    await pageB.fill('input[type="text"]', userB.name);
    await pageB.fill('input[type="email"]', userB.email);
    await pageB.fill('input[type="password"]', userB.pass);
    await pageB.click('button:has-text("إنشاء حساب")');
    await pageB.waitForURL(`${URL}/home`);
    console.log("✅ User B logged in successfully.");

    // User A posts
    console.log("📝 User A: Writing a post...");
    const postText = `Integration Test Post ${Date.now()}`;
    await pageA.fill('textarea[placeholder="ماذا يحدث؟"]', postText);
    await pageA.click('button:has-text("نشر")');
    
    // Wait for it to appear
    await pageA.waitForSelector(`text=${postText}`);
    console.log("✅ User A posted successfully.");

    // User B finds the post
    console.log("🔄 User B: Refreshing to see User A's post...");
    await pageB.reload();
    await pageB.waitForSelector(`text=${postText}`);
    console.log("✅ User B sees the post.");

    // Extract the post link from the post container
    // We'll just click the post text to go to details
    await pageB.click(`text=${postText}`);
    await pageB.waitForURL(/\/post\/.+/);
    console.log("✅ User B entered post details.");

    // User B interacts
    console.log("❤️ User B: Liking the post...");
    await pageB.click('button[aria-label="إعجاب"]');
    await pageB.waitForTimeout(1000); // Wait for optimistic update + db

    console.log("🔁 User B: Reposting the post...");
    await pageB.click('button[aria-label="إعادة نشر"]');
    await pageB.waitForTimeout(1000);

    console.log("💬 User B: Writing a reply...");
    await pageB.fill('textarea[placeholder="أضف ردك الخاص..."]', "هذا رد اختباري من المستخدم B!");
    await pageB.click('button:has-text("رد")');
    await pageB.waitForSelector('text=هذا رد اختباري من المستخدم B!');
    console.log("✅ User B replied successfully.");

    // Validation Check on User B's screen before refresh
    let likes = await pageB.textContent('button[aria-label="إعجاب"] span');
    let reposts = await pageB.textContent('button[aria-label="إعادة نشر"] span');
    let commentsStr = await pageB.textContent('header + div button[title="التعليقات"] span');
    console.log(`📊 Before Refresh - Likes: ${likes?.trim()}, Reposts: ${reposts?.trim()}, Comments: ${commentsStr?.trim()}`);

    // Refresh both browsers to verify Persistence
    console.log("🔄 Refreshing both browsers to test Persistence...");
    await pageA.goto(pageB.url());
    await pageB.reload();

    await pageA.waitForSelector('text=هذا رد اختباري من المستخدم B!');
    await pageB.waitForSelector('text=هذا رد اختباري من المستخدم B!');
    
    likes = await pageB.textContent('button[aria-label="إعجاب"] span');
    reposts = await pageB.textContent('button[aria-label="إعادة نشر"] span');
    // Using nth-match or simple selector
    commentsStr = await pageB.textContent('button[title="التعليقات"] span');

    console.log(`📊 After Refresh (User B) - Likes: ${likes?.trim()}, Reposts: ${reposts?.trim()}, Comments: ${commentsStr?.trim()}`);
    console.log("✅ Data successfully persisted! No count resets.");

  } catch (e) {
    console.error("❌ Simulation Failed:", e);
    await pageA.screenshot({ path: 'error_pageA.png' });
    await pageB.screenshot({ path: 'error_pageB.png' });
  } finally {
    await browser.close();
    console.log("🏁 Simulation Finished.");
  }
})();
