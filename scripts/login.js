const { chromium } = require("playwright");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const { execSync } = require("child_process");

async function sendToTelegram(filePath, caption) {
  const telegramApi = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
  const formData = new FormData();
  formData.append("chat_id", process.env.TELEGRAM_CHAT_ID);
  formData.append("caption", caption);
  formData.append("photo", fs.createReadStream(filePath));

  try {
    await axios.post(telegramApi, formData, {
      headers: formData.getHeaders(),
    });
    console.log("✅ 截图已发送到 Telegram");
  } catch (error) {
    console.error("❌ 发送到 Telegram 失败:", error.message);
  }
}

async function waitForNetworkIdle(page, timeout = 30000) {
  await page.waitForLoadState('networkidle', { timeout });
}

async function takeScreenshot(page, filename, caption) {
  const screenshotPath = `screenshots/${filename}`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await sendToTelegram(screenshotPath, caption);
  return screenshotPath;
}

(async () => {
  const SELECTORS = {
    emailInput: 'input[name="email"], input[id="j_username"], input[type="email"]',
    emailSubmit: 'button[type="submit"], button[id="continue"], #logOnFormSubmit, button:has-text("Continue"), button:has-text("继续")',
    passwordInput: 'input[type="password"], input[id="j_password"]',
    passwordSubmit: 'button[type="submit"], #logOnFormSubmit, button:has-text("Log On"), button:has-text("登录")',
    goToTrial: 'a:has-text("转到您的试用账户"), button:has-text("转到您的试用账户"), a:has-text("Go To Your Trial Account"), button:has-text("Go To Your Trial Account")',
    consentBanner: '#truste-consent-button, .truste-button2, [aria-label*="cookie" i], [aria-label*="Cookie" i]'
  };

  // 创建截图目录
  if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
  }

  let browser;
  try {
    // 检查并安装 Playwright
    try {
      browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    } catch (err) {
      console.warn("⚠️ Playwright 浏览器未安装，正在自动安装 Chromium...");
      execSync("npx playwright install --with-deps chromium", { stdio: "inherit" });
      browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    const page = await context.newPage();

    console.log("🌐 打开 SAP BTP 登录页面...");
    await page.goto("https://account.hanatrial.ondemand.com/", { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });

    // 处理可能的 Cookie 同意横幅
    console.log("🍪 检查 Cookie 同意横幅...");
    try {
      const consentButton = await page.waitForSelector(SELECTORS.consentBanner, { timeout: 5000 });
      if (consentButton) {
        await consentButton.click();
        console.log("✅ 已关闭 Cookie 横幅");
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      console.log("ℹ️ 未找到 Cookie 横幅或已超时");
    }

    // Step 1: 输入邮箱
    console.log("✉️ 输入邮箱...");
    await page.waitForSelector(SELECTORS.emailInput, { timeout: 15000 });
    await page.fill(SELECTORS.emailInput, process.env.SAP_EMAIL);
    
    console.log("➡️ 点击继续...");
    await page.click(SELECTORS.emailSubmit);
    await page.waitForTimeout(3000);

    // Step 2: 输入密码
    console.log("🔑 输入密码...");
    await page.waitForSelector(SELECTORS.passwordInput, { timeout: 15000 });
    await page.fill(SELECTORS.passwordInput, process.env.SAP_PASSWORD);
    
    console.log("➡️ 点击登录...");
    await page.click(SELECTORS.passwordSubmit);

    // 等待登录完成
    console.log("⏳ 等待登录完成...");
    await waitForNetworkIdle(page, 30000);

    // 检查登录是否成功
    const currentUrl = page.url();
    if (currentUrl.includes('error') || currentUrl.includes('login')) {
      throw new Error('登录可能失败，当前URL: ' + currentUrl);
    }

    // Step 3: 截图登录后的页面
    await takeScreenshot(page, "login-success.png", "✅ SAP BTP 登录成功页面");

    // Step 4: 处理试用账户导航
    console.log("👉 尝试导航到试用账户...");
    
    let trialNavigated = false;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`🔄 尝试第 ${attempt} 次导航...`);
      
      try {
        // 尝试点击试用账户链接
        await page.waitForSelector(SELECTORS.goToTrial, { timeout: 10000 });
        await page.click(SELECTORS.goToTrial);
        
        // 等待导航完成
        await waitForNetworkIdle(page, 15000);
        trialNavigated = true;
        console.log("✅ 成功进入试用账户");
        break;
        
      } catch (error) {
        console.log(`❌ 第 ${attempt} 次导航尝试失败:`, error.message);
        if (attempt < maxRetries) {
          await page.waitForTimeout(3000);
          await page.reload();
        }
      }
    }

    if (!trialNavigated) {
      console.log("⚠️ 无法自动导航到试用账户，尝试直接访问...");
      await page.goto("https://account.hanatrial.ondemand.com/#/home/trial", {
        waitUntil: 'networkidle',
        timeout: 30000
      });
    }

    // 等待页面完全加载
    await page.waitForTimeout(5000);

    // Step 5: 截图试用账户页面
    await takeScreenshot(page, "trial-account.png", "✅ 已进入 SAP BTP 试用账户页面");

    console.log("🎉 自动化流程完成！");

  } catch (error) {
    console.error("❌ 流程执行失败:", error);
    
    if (browser) {
      try {
        const pages = await browser.pages();
        if (pages.length > 0) {
          const errorPath = "screenshots/error.png";
          await pages[0].screenshot({ path: errorPath, fullPage: true });
          await sendToTelegram(errorPath, `❌ SAP BTP 操作失败: ${error.message}`);
        }
      } catch (screenshotError) {
        console.error("❌ 截图失败:", screenshotError);
      }
    }
    
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
    
    // 清理截图文件
    try {
      if (fs.existsSync('screenshots')) {
        fs.rmSync('screenshots', { recursive: true });
      }
    } catch (cleanupError) {
      console.log("⚠️ 清理截图文件失败:", cleanupError);
    }
  }
})();
