# ✅ Vercel 部署检查清单

## 🎯 目标
将 AI 心理咨询师部署到 Vercel，让 Google 登录正常工作

---

## 📋 部署步骤（按顺序执行）

### ☐ 步骤 1：访问 Vercel
- 打开: https://vercel.com
- 使用 GitHub 账号登录

### ☐ 步骤 2：导入项目
- 点击 "Add New..." → "Project"
- 选择仓库: `AI-Counselor-2025-11-3-V1`
- 点击 "Import"

### ☐ 步骤 3：配置环境变量
打开本地的 `.env.local` 文件，参考 `VERCEL_ENV_TEMPLATE.md` 指南，配置以下 4 个必需变量：

1. `NEXTAUTH_URL` = `https://your-app.vercel.app` (临时值)
2. `NEXTAUTH_SECRET` = (从 .env.local 复制)
3. `GOOGLE_CLIENT_ID` = (从 .env.local 复制)
4. `GOOGLE_CLIENT_SECRET` = (从 .env.local 复制)

**注意**: 实际的密钥值在本地的 `.env.local` 文件和 `VERCEL_ENV_READY.txt` 文件中。

### ☐ 步骤 4：首次部署
- 点击 "Deploy"
- 等待 2-3 分钟
- **记下你的 Vercel 域名**（例如：`ai-counselor-abc123.vercel.app`）

### ☐ 步骤 5：更新 Google Cloud Console
1. 访问: https://console.cloud.google.com/apis/credentials
2. 找到你的 OAuth 客户端
3. 添加以下 URL 到 "已获授权的 JavaScript 来源":
   ```
   https://你的实际域名.vercel.app
   ```
4. 添加以下 URL 到 "已获授权的重定向 URI":
   ```
   https://你的实际域名.vercel.app/api/auth/callback/google
   https://你的实际域名.vercel.app/api/auth/custom-google/callback
   ```
5. 点击"保存"

### ☐ 步骤 6：更新 Vercel 环境变量
1. 回到 Vercel 项目设置
2. 找到 `NEXTAUTH_URL` 变量
3. 更新为你的实际域名: `https://你的实际域名.vercel.app`
4. 保存

### ☐ 步骤 7：重新部署
- Vercel 会自动触发重新部署
- 或者手动点击 "Redeploy"

### ☐ 步骤 8：测试 Google 登录
1. 访问你的 Vercel 域名
2. 点击"登录"
3. 点击"Sign in with Google"
4. 选择你的 Google 账户
5. ✅ **应该成功登录！**

---

## 🎉 成功标志

- ✅ 可以看到 Google 登录页面
- ✅ 选择账户后成功返回应用
- ✅ 显示已登录状态
- ✅ 可以看到用户邮箱

---

## ❌ 如果失败

### 错误: redirect_uri_mismatch
**原因**: Google Cloud Console 的 Redirect URI 配置不正确
**解决**: 仔细检查步骤 5，确保 URI 完全一致（包括 https://）

### 错误: OAuthSignin
**原因**: 环境变量配置不正确
**解决**: 检查步骤 3 和步骤 6，确保所有变量都正确

### 错误: callback_failed
**原因**: 这个错误不应该在 Vercel 上出现（只在本地因为网络问题）
**解决**: 如果出现，检查 Vercel 部署日志

---

## 📞 需要帮助？

如果遇到任何问题，请告诉我：
1. 你的 Vercel 域名是什么
2. 看到了什么错误信息
3. 截图给我看

---

**准备好了吗？开始部署！** 🚀

