# Google登录问题排查指南

## 当前状态

代码已经正确配置，NextAuth使用了标准的Google OAuth流程。如果仍然出现400错误，问题在于**环境变量配置**。

## 必须检查的3个地方

### 1. Vercel环境变量（最重要！）

进入Vercel项目 → Settings → Environment Variables，确保有以下变量：

\`\`\`
GOOGLE_CLIENT_ID=你的Client ID
GOOGLE_CLIENT_SECRET=你的Client Secret  
NEXTAUTH_SECRET=随机生成的32位字符串
NEXTAUTH_URL=https://ai-counselor-2025-11-3-v1.vercel.app
\`\`\`

**关键点：**
- NEXTAUTH_URL **不要**有尾部斜杠 `/`
- 所有变量都要应用到 Production 环境
- 修改后必须重新部署

### 2. Google Cloud Console回调URL

访问 https://console.cloud.google.com/apis/credentials

找到你的OAuth 2.0 Client ID，在"Authorized redirect URIs"中必须有：

\`\`\`
https://ai-counselor-2025-11-3-v1.vercel.app/api/auth/callback/google
\`\`\`

**注意：必须完全匹配，包括https和域名！**

### 3. 生成NEXTAUTH_SECRET

如果还没有生成，在终端运行：

\`\`\`bash
openssl rand -base64 32
\`\`\`

把生成的字符串复制到Vercel的NEXTAUTH_SECRET环境变量中。

## 测试步骤

1. 确认以上3个地方都配置正确
2. 在Vercel中点击"Redeploy"重新部署
3. 等待部署完成（约2-3分钟）
4. 清除浏览器缓存或使用无痕模式测试
5. 点击Google登录

## 如果还是不行

请截图以下内容给我：
1. Vercel的Environment Variables页面（隐藏敏感信息）
2. Google Cloud Console的OAuth配置页面
3. 登录时的完整错误信息

这样我才能准确定位问题所在。
