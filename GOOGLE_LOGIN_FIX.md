# Google 登录 400 错误修复指南

## 问题原因
Google OAuth 返回 400 错误通常是因为 `NEXTAUTH_URL` 环境变量配置不正确。

## 修复步骤

### 1. 在 Vercel 中配置环境变量

进入 Vercel 项目设置：
1. 点击 Settings → Environment Variables
2. 确保以下环境变量都已正确配置：

\`\`\`
NEXTAUTH_URL=https://ai-counselor-2025-11-3-v1.vercel.app
NEXTAUTH_SECRET=你的随机密钥（至少32个字符）
GOOGLE_CLIENT_ID=你的Google客户端ID
GOOGLE_CLIENT_SECRET=你的Google客户端密钥
\`\`\`

**重要：** `NEXTAUTH_URL` 必须与你的实际域名完全匹配，不要有尾部斜杠。

### 2. 生成 NEXTAUTH_SECRET

在终端运行：
\`\`\`bash
openssl rand -base64 32
\`\`\`

将生成的字符串作为 `NEXTAUTH_SECRET` 的值。

### 3. 在 Google Cloud Console 中确认回调 URL

1. 访问 https://console.cloud.google.com/
2. 选择你的项目
3. APIs & Services → Credentials
4. 点击你的 OAuth 2.0 客户端 ID
5. 在 "Authorized redirect URIs" 中确认有：
   \`\`\`
   https://ai-counselor-2025-11-3-v1.vercel.app/api/auth/callback/google
   \`\`\`

### 4. 重新部署

配置完环境变量后，在 Vercel 中点击 "Redeploy" 重新部署应用。

## 测试

部署完成后，访问你的网站，点击 "Log In" → "Continue with Google"，应该能正常跳转并登录。
