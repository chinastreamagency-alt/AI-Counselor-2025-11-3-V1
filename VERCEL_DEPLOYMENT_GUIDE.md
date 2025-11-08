# 🚀 Vercel 部署指南 - AI 心理咨询师

## 📋 部署前准备

### ✅ 你已经完成的配置：
- ✅ Google Cloud Console OAuth 客户端已创建
- ✅ 本地环境变量已配置
- ✅ 代码已准备就绪

---

## 🎯 部署步骤

### 步骤 1：登录 Vercel

1. **访问**: https://vercel.com
2. **点击 "Sign Up"** 或 **"Log In"**
3. **使用 GitHub 账号登录**（推荐）
   - 这样可以直接连接你的 GitHub 仓库

---

### 步骤 2：导入项目

1. **点击 "Add New..."** → **"Project"**
2. **选择你的 GitHub 仓库**: `AI-Counselor-2025-11-3-V1`
3. **点击 "Import"**

---

### 步骤 3：配置环境变量（重要！）

在 Vercel 的项目设置页面，添加以下环境变量：

#### 必需的环境变量：

**请从本地的 `.env.local` 文件复制以下变量的值：**

```
NEXTAUTH_URL=https://你的域名.vercel.app
NEXTAUTH_SECRET=(从 .env.local 复制)
GOOGLE_CLIENT_ID=(从 .env.local 复制)
GOOGLE_CLIENT_SECRET=(从 .env.local 复制)
```

**详细配置指南请参考 `VERCEL_ENV_TEMPLATE.md` 文件。**

#### 其他环境变量（从 .env.local 复制）：

```
OPENAI_API_KEY=你的值
DEEPSEEK_API_KEY=你的值
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=你的值
STRIPE_SECRET_KEY=你的值
STRIPE_WEBHOOK_SECRET=你的值
DATABASE_URL=你的值
```

**⚠️ 注意**: 
- 第一次部署时，Vercel 会给你一个临时域名（如 `your-app.vercel.app`）
- 部署后，你需要用这个域名更新 `NEXTAUTH_URL`

---

### 步骤 4：部署

1. **点击 "Deploy"**
2. **等待部署完成**（通常 2-3 分钟）
3. **记下你的 Vercel 域名**（如 `ai-counselor-xxx.vercel.app`）

---

### 步骤 5：更新 Google Cloud Console

部署成功后，你需要更新 Google Cloud Console 的配置：

1. **访问**: https://console.cloud.google.com/apis/credentials
2. **找到你的 OAuth 客户端 ID**
3. **编辑 "已获授权的 JavaScript 来源"**，添加：
   ```
   https://你的域名.vercel.app
   ```

4. **编辑 "已获授权的重定向 URI"**，添加：
   ```
   https://你的域名.vercel.app/api/auth/callback/google
   https://你的域名.vercel.app/api/auth/custom-google/callback
   ```

5. **点击"保存"**

---

### 步骤 6：更新 Vercel 环境变量

1. **回到 Vercel 项目设置**
2. **更新 `NEXTAUTH_URL`**:
   ```
   NEXTAUTH_URL=https://你的实际域名.vercel.app
   ```
3. **重新部署**（Vercel 会自动触发）

---

### 步骤 7：测试 Google 登录

1. **访问你的 Vercel 域名**
2. **点击"登录"**
3. **点击"Sign in with Google"**
4. **选择你的 Google 账户**
5. **✅ 应该成功登录！**

---

## 🎉 部署完成！

你的 AI 心理咨询师现在已经在线，全世界都可以访问！

---

## 📝 部署检查清单

- [ ] Vercel 账号已创建
- [ ] 项目已导入到 Vercel
- [ ] 所有环境变量已配置
- [ ] 首次部署成功
- [ ] Google Cloud Console 已更新（添加 Vercel 域名）
- [ ] NEXTAUTH_URL 已更新为 Vercel 域名
- [ ] 重新部署完成
- [ ] Google 登录测试成功

---

## ⚠️ 常见问题

### Q: 部署后 Google 登录还是失败？
A: 检查：
1. Google Cloud Console 是否添加了正确的 Vercel 域名
2. Vercel 环境变量中的 `NEXTAUTH_URL` 是否正确
3. 是否重新部署了（更新环境变量后需要重新部署）

### Q: 如何查看部署日志？
A: 在 Vercel 项目页面，点击 "Deployments" → 选择最新的部署 → 查看 "Build Logs"

### Q: 如何重新部署？
A: 
- 方法 1: 推送新代码到 GitHub（自动触发）
- 方法 2: 在 Vercel 项目页面点击 "Redeploy"

---

## 🎯 下一步

如果你想使用自定义域名（如 `www.your-domain.com`）：
1. 在 Vercel 项目设置中添加域名
2. 更新 DNS 记录
3. 更新 Google Cloud Console 和 NEXTAUTH_URL

---

**准备好了吗？让我们开始部署！** 🚀

