# 🚀 AI 心理咨询师 - Vercel 部署指南

## 📋 部署步骤

### 1. 推送代码到 GitHub
确保所有更改已提交并推送到 GitHub 仓库。

### 2. 登录 Vercel
访问 https://vercel.com 并使用 GitHub 账号登录。

### 3. 导入项目
- 点击 "Add New..." → "Project"
- 选择你的 GitHub 仓库
- 点击 "Import"

### 4. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

#### 必需变量：

```
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=你的密钥
GOOGLE_CLIENT_ID=你的 Google Client ID
GOOGLE_CLIENT_SECRET=你的 Google Client Secret
```

#### 可选变量（如果使用）：

```
OPENAI_API_KEY=你的 OpenAI API 密钥
DEEPSEEK_API_KEY=你的 DeepSeek API 密钥
DATABASE_URL=你的数据库连接字符串
STRIPE_SECRET_KEY=你的 Stripe 密钥
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=你的 Stripe 公开密钥
```

### 5. 部署
点击 "Deploy" 并等待部署完成（约 2-3 分钟）。

### 6. 更新 Google Cloud Console

部署成功后，记下你的 Vercel 域名（如 `ai-counselor-xxx.vercel.app`），然后：

1. 访问 https://console.cloud.google.com/apis/credentials
2. 编辑你的 OAuth 客户端
3. 添加以下 URL 到 "已获授权的 JavaScript 来源":
   ```
   https://你的域名.vercel.app
   ```
4. 添加以下 URL 到 "已获授权的重定向 URI":
   ```
   https://你的域名.vercel.app/api/auth/callback/google
   https://你的域名.vercel.app/api/auth/custom-google/callback
   ```
5. 保存

### 7. 更新 NEXTAUTH_URL

回到 Vercel 项目设置，将 `NEXTAUTH_URL` 更新为你的实际域名，然后重新部署。

### 8. 测试

访问你的 Vercel 域名，测试 Google 登录功能！

---

## ✅ Google 登录配置说明

本项目使用了自定义的 Google OAuth 流程，包括：

- **登录路由**: `/api/auth/custom-google/login`
- **回调路由**: `/api/auth/custom-google/callback`
- **会话路由**: `/api/auth/custom-google/session`

这些路由绕过了 NextAuth 的一些限制，确保在生产环境中稳定工作。

---

## 🔧 故障排除

### Google 登录失败？

1. 检查 Google Cloud Console 的 Redirect URI 是否正确
2. 确保 `NEXTAUTH_URL` 与实际域名一致
3. 检查环境变量是否正确配置
4. 查看 Vercel 部署日志

---

## 📞 需要帮助？

如果遇到问题，请检查：
- Vercel 部署日志
- 浏览器控制台错误
- Google Cloud Console 配置

---

**祝部署顺利！** 🎉

