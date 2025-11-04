# 环境变量配置指南

Google 登录 400 错误的根本原因是 `NEXTAUTH_URL` 环境变量配置不正确。

## 必需的环境变量

在 Vercel 项目设置中（Settings → Environment Variables），添加以下变量：

### 1. NEXTAUTH_URL
\`\`\`
NEXTAUTH_URL=https://ai-counselor-2025-11-3-v1.vercel.app
\`\`\`
**重要：** 
- 必须与你的实际域名完全匹配
- 不要有尾部斜杠
- 必须使用 https://

### 2. NEXTAUTH_SECRET
生成一个随机密钥（至少32个字符）：
\`\`\`bash
openssl rand -base64 32
\`\`\`
将生成的字符串作为 `NEXTAUTH_SECRET` 的值。

### 3. Google OAuth 凭据
\`\`\`
GOOGLE_CLIENT_ID=你的客户端ID
GOOGLE_CLIENT_SECRET=你的客户端密钥
\`\`\`

## Google Cloud Console 配置

1. 访问 https://console.cloud.google.com/
2. 选择你的项目
3. APIs & Services → Credentials
4. 点击你的 OAuth 2.0 客户端 ID
5. 在 "Authorized redirect URIs" 中添加：
   \`\`\`
   https://ai-counselor-2025-11-3-v1.vercel.app/api/auth/callback/google
   \`\`\`

## 配置完成后

1. 保存所有环境变量
2. 在 Vercel 中点击 "Redeploy" 重新部署
3. 等待部署完成（约2-3分钟）
4. 测试 Google 登录功能
