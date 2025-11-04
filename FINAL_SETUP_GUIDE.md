# 最终设置指南

## 重要说明

**界面布局已恢复为原始的手机通话样式，这是核心体验，永远不会改变。**

## 已完成的修改

1. ✅ 关闭所有测试模式 - 现在是生产环境
2. ✅ 保留原始手机通话界面布局
3. ✅ 添加1分钟免费试用功能
4. ✅ 简化NextAuth配置，只保留Google登录
5. ✅ 添加用户上传的视频文件

## Google登录修复步骤

### 1. 检查Vercel环境变量

确保在Vercel中配置了以下环境变量：

\`\`\`
GOOGLE_CLIENT_ID=你的Google Client ID
GOOGLE_CLIENT_SECRET=你的Google Client Secret
NEXTAUTH_SECRET=随机生成的密钥
NEXTAUTH_URL=https://ai-counselor-2025-11-3-v1.vercel.app
\`\`\`

**重要：NEXTAUTH_URL不要有尾部斜杠！**

### 2. 检查Google Cloud Console配置

1. 访问 https://console.cloud.google.com/
2. 选择你的项目
3. 进入 "APIs & Services" → "Credentials"
4. 找到你的OAuth 2.0 Client ID
5. 在 "Authorized redirect URIs" 中确保有：
   \`\`\`
   https://ai-counselor-2025-11-3-v1.vercel.app/api/auth/callback/google
   \`\`\`

### 3. 生成NEXTAUTH_SECRET

在终端运行：
\`\`\`bash
openssl rand -base64 32
\`\`\`

将生成的字符串添加到Vercel环境变量中。

### 4. 重新部署

配置完环境变量后，在Vercel中点击"Redeploy"。

## 功能说明

- **免费试用**：未登录用户可以免费使用1分钟
- **登录提示**：1分钟后会提示登录
- **手机通话界面**：保持原始的简洁通话体验
- **绿色按钮**：开始通话
- **红色按钮**：结束通话
- **蓝色动画圈**：通话进行中的视觉反馈
