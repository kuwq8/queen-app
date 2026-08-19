# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: chat.spec.ts >> Direct Messages System >> should allow user1 to send a message to user2, and user2 can read and reply
- Location: tests\e2e\chat.spec.ts:9:7

# Error details

```
Test timeout of 30000ms exceeded.
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