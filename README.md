# SAP BTP Auto Login Bot

这个项目用于 **自动登录 SAP BTP 试用账号**，并通过 **GitHub Actions + Playwright**  
每隔 10 天执行一次，完成以下任务：

1. 自动登录 SAP BTP 试用账号（邮箱 + 密码两步验证）。  
2. 点击 **“转到您的试用账户”**，进入试用账户主页。  
3. 截取两张截图：  
   - 登录成功后的页面  
   - 进入试用账户后的页面  
4. 自动将截图推送到 **Telegram**。  
5. 登录失败或操作失败时，会截取错误页面截图并推送到 Telegram。  
6. **自动上传截图到 GitHub Artifact**，方便保存和下载历史记录。  

---

## 📂 项目结构

.
├── scripts
│ └── login.js # Playwright 登录脚本
├── .github
│ └── workflows
│ └── login.yml # GitHub Actions 定时任务
├── package.json # Node.js 项目配置
└── README.md # 项目说明文档

yaml
复制代码

---

## 🚀 部署步骤

### 1. Fork 项目
点击右上角 **Fork**，把本项目复制到你自己的 GitHub 仓库。

---

### 2. 配置 GitHub Secrets
在你的仓库里，依次进入：
Settings → Secrets and variables → Actions → New repository secret

yaml
复制代码

添加以下 4 个 Secrets：

| 名称 | 说明 |
|------|------|
| `SAP_EMAIL` | SAP BTP 登录邮箱 |
| `SAP_PASSWORD` | SAP BTP 登录密码 |
| `TELEGRAM_BOT_TOKEN` | Telegram 机器人 Token（从 @BotFather 获取） |
| `TELEGRAM_CHAT_ID` | Telegram Chat ID（可通过 @userinfobot 查询） |

---

### 3. 启用 GitHub Actions
进入仓库的 **Actions** 页面，启用 workflow。  
系统会自动按照 `login.yml` 定时运行脚本。

---

### 4. 手动触发（可选）
如果不想等 10 天，可以手动执行一次：
Actions → SAP BTP Auto Login → Run workflow

yaml
复制代码

---

## 🖼️ 运行效果

运行成功后，Telegram 会收到两张截图：

1. **登录成功页面**
✅ SAP BTP 登录成功页面

markdown
复制代码
2. **试用账户主页**
✅ 已进入 SAP BTP 试用账户页面

复制代码

失败时，会收到：
❌ SAP BTP 操作失败截图

yaml
复制代码
并附带错误页面截图。

---

## 📦 GitHub Artifact

每次 workflow 运行完成后，截图会自动上传到 **Artifact**，文件包括：

- `login-success.png` → 登录成功截图  
- `trial-account.png` → 试用账户页面截图  
- `error.png` → 登录或操作失败截图（如果存在）  

下载方式：  
Actions → 选择对应运行记录 → Artifacts → sap-btp-screenshots

yaml
复制代码

---

## ⚙️ 调度规则

在 `.github/workflows/login.yml` 中，使用了 cron 表达式：
```yaml
on:
  schedule:
    - cron: "0 0 */10 * *"
表示 每隔 10 天，UTC 0 点执行一次。
如果你想修改运行频率，可以调整 cron 表达式。
👉 Crontab Guru 可帮助你生成。

📌 注意事项
脚本使用 Playwright 自动化浏览器操作。

首次运行时会自动安装 Chromium 浏览器。

如果 SAP 登录页面的元素发生变化（选择器不同），需要在 scripts/login.js 中调整 SELECTORS。

Consent Banner/Cookie 弹窗会自动关闭，避免阻挡按钮点击。

🛠️ 本地调试
如果你想在本地测试：

bash
复制代码
# 克隆项目
git clone https://github.com/<your-username>/sap-btp-auto-login.git
cd sap-btp-auto-login

# 安装依赖
npm install

# 安装浏览器（只需一次）
npx playwright install --with-deps chromium

# 设置环境变量（仅测试用，生产环境用 GitHub Secrets）
export SAP_EMAIL="your_email"
export SAP_PASSWORD="your_password"
export TELEGRAM_BOT_TOKEN="your_bot_token"
export TELEGRAM_CHAT_ID="your_chat_id"

# 运行脚本
node scripts/login.js
成功后，会在本地生成截图并推送到 Telegram，同时可以在 GitHub Actions 上传 Artifact。

📄 License
MIT License
