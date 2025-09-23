# SAP BTP Auto Login Bot

这个项目用于 **自动登录 SAP BTP 试用账号**，并通过 **GitHub Actions + Playwright**  
每隔 10 天执行一次，完成以下任务：

1. 自动登录 SAP BTP 试用账号（邮箱 + 密码两步验证）。  
2. 点击 **“转到您的试用账户”**，进入试用账户主页。  
3. 截取两张截图：  
   - 登录成功后的页面  
   - 进入试用账户后的页面  
4. 自动将截图推送到 **Telegram**。  
5. （可选）失败时会截取错误页面截图并推送到 Telegram，方便排查。
   
---

## 📂 项目结构

.
├── .github
│ └── workflows
│  └── login.yml # GitHub Actions 定时任务
├── scripts
│ └── login.js # Playwright 登录脚本
└── README.md # 项目说明文档

---

## 🚀 部署步骤

### 1. Fork 项目
点击右上角 **Fork**，把本项目复制到你自己的 GitHub 仓库。

---

### 2. 配置 GitHub Secrets
在你的仓库里，依次进入：
Settings → Secrets and variables → Actions → New repository secret


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

---

## 🖼️ 运行效果

运行成功后，Telegram 会收到两张截图：

1. **登录成功页面**
✅ SAP BTP 登录成功页面
2. **试用账户主页**
✅ 已进入 SAP BTP 试用账户页面

失败时，会收到：
❌ SAP BTP 操作失败截图
并附带错误页面截图。

---
