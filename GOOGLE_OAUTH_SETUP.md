# Google OAuth 配置指南

## 问题：Error 400: redirect_uri_mismatch

这个错误表示 Google Cloud Console 中配置的回调 URL 与应用实际使用的 URL 不匹配。

## 完整配置步骤

### 步骤 1：访问 Google Cloud Console

1. 打开 https://console.cloud.google.com/
2. 登录你的 Google 账户
3. 如果没有项目，点击顶部的项目下拉菜单，选择 "New Project"
   - Project name: `AI Counselor`
   - 点击 "Create"

### 步骤 2：启用 Google+ API

1. 在左侧菜单中，选择 "APIs & Services" → "Library"
2. 搜索 "Google+ API"
3. 点击并启用它

### 步骤 3：配置 OAuth 同意屏幕

1. 左侧菜单选择 "APIs & Services" → "OAuth consent screen"
2. 选择 "External"，点击 "Create"
3. 填写必填信息：
   - **App name**: `AI Counselor`
   - **User support email**: 选择你的邮箱
   - **App logo**: 可选
   - **App domain**: 可选
   - **Authorized domains**: 添加 `vercel.app`
   - **Developer contact information**: 输入你的邮箱
4. 点击 "Save and Continue"
5. Scopes 页面：点击 "Save and Continue"（使用默认）
6. Test users 页面：点击 "Save and Continue"
7. 点击 "Back to Dashboard"

### 步骤 4：创建 OAuth 客户端凭据

1. 左侧菜单选择 "APIs & Services" → "Credentials"
2. 点击顶部 "+ CREATE CREDENTIALS"
3. 选择 "OAuth client ID"
4. 配置：
   - **Application type**: Web application
   - **Name**: `AI Counselor Web Client`
   - **Authorized JavaScript origins**: 添加
     \`\`\`
     https://ai-counselor-2025-11-3-v1.vercel.app
     \`\`\`
   - **Authorized redirect URIs**: 添加（重要！）
     \`\`\`
     https://ai-counselor-2025-11-3-v1.vercel.app/api/auth/callback/google
     \`\`\`
5. 点击 "Create"
6. 会弹出对话框显示你的凭据：
   - **Client ID**: 复制保存
   - **Client Secret**: 复制保存

### 步骤 5：配置 Vercel 环境变量

1. 访问 https://vercel.com/
2. 进入你的项目 `ai-counselor-2025-11-3-v1`
3. 点击 "Settings" 标签
4. 左侧选择 "Environment Variables"
5. 添加以下环境变量（如果已存在则更新）：

   **GOOGLE_CLIENT_ID**
   - Value: 粘贴你复制的 Client ID
   - Environment: 勾选 Production, Preview, Development
   - 点击 "Save"

   **GOOGLE_CLIENT_SECRET**
   - Value: 粘贴你复制的 Client Secret
   - Environment: 勾选 Production, Preview, Development
   - 点击 "Save"

   **NEXTAUTH_URL**
   - Value: `https://ai-counselor-2025-11-3-v1.vercel.app`
   - Environment: 勾选 Production, Preview, Development
   - 点击 "Save"

   **NEXTAUTH_SECRET**
   - Value: 生成一个随机字符串（可以在终端运行 `openssl rand -base64 32`）
   - 或者使用在线生成器：https://generate-secret.vercel.app/32
   - Environment: 勾选 Production, Preview, Development
   - 点击 "Save"

### 步骤 6：重新部署

1. 回到 "Deployments" 标签
2. 点击最新部署右侧的三个点
3. 选择 "Redeploy"
4. 确认重新部署

### 步骤 7：测试

1. 等待部署完成（约 1-2 分钟）
2. 访问你的网站：https://ai-counselor-2025-11-3-v1.vercel.app
3. 点击 "Google 登录"
4. 应该能正常跳转到 Google 登录页面

## 常见问题

### 问题 1：仍然显示 redirect_uri_mismatch

**解决方案**：
- 确保 Google Cloud Console 中的 redirect URI 完全匹配（包括 https://）
- 检查是否有多余的空格或斜杠
- 等待 5-10 分钟让 Google 的更改生效
- 清除浏览器缓存后重试

### 问题 2：显示 "This app isn't verified"

**解决方案**：
- 这是正常的，因为应用还在测试模式
- 点击 "Advanced" → "Go to AI Counselor (unsafe)"
- 如果要移除这个警告，需要提交应用审核（需要时间）

### 问题 3：环境变量更新后没有生效

**解决方案**：
- 必须重新部署才能使新的环境变量生效
- 在 Vercel Deployments 页面点击 "Redeploy"

## 检查清单

在测试之前，确保：
- [ ] Google Cloud Console 中创建了 OAuth 客户端
- [ ] Authorized redirect URIs 包含正确的回调 URL
- [ ] Vercel 中添加了所有必需的环境变量
- [ ] 重新部署了应用
- [ ] 等待了几分钟让更改生效

## 需要帮助？

如果按照以上步骤操作后仍有问题，请检查：
1. Vercel 部署日志中是否有错误
2. 浏览器控制台是否有错误信息
3. 确认你的域名是否正确
