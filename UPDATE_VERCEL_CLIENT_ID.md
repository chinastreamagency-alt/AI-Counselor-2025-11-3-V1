# 🔧 更新 Vercel 的 Google Client ID

## 🎯 问题确认

**发现了根本问题！**

Vercel 使用的 Google Client ID 与 Google Cloud Console 中配置的 OAuth 客户端 ID 不匹配，导致了 `redirect_uri_mismatch` 错误。

---

## 📝 立即修复步骤

### 步骤 1：更新 GOOGLE_CLIENT_ID

1. 在当前的 Vercel 页面中（Environment Variables）
2. 找到 `GOOGLE_CLIENT_ID` 这一行
3. 将 **Value** 修改为 Google Cloud Console 中正确的 Client ID（从您的 OAuth 客户端页面复制）

### 步骤 2：检查 GOOGLE_CLIENT_SECRET

请您也检查一下 `GOOGLE_CLIENT_SECRET`。

从 Google Cloud Console 的截图中，我看到 Client Secret 是 `****oKJM`（被隐藏了）。

**请您：**
1. 回到 Google Cloud Console 的客户端编辑页面
2. 在右侧 "客户端密钥" 部分，点击显示完整密钥
3. 复制完整的 Client Secret
4. 在 Vercel 中更新 `GOOGLE_CLIENT_SECRET`

---

### 步骤 3：保存更改

在 Vercel 的 Environment Variables 页面：
1. 点击页面底部的 **"Save"** 按钮
2. Vercel 会提示您需要重新部署

---

### 步骤 4：重新部署（Redeploy）

**这是关键步骤！** 更新环境变量后，必须重新部署才能生效。

1. 保存环境变量后，Vercel 会显示一个提示
2. 点击 **"Redeploy"** 或回到 Deployments 页面
3. 找到最新的部署，点击右侧的三个点 `...`
4. 选择 **"Redeploy"**
5. 等待部署完成（通常需要 1-3 分钟）

---

## 📋 需要更新的完整信息

### 在 Vercel Environment Variables 中设置：

```
GOOGLE_CLIENT_ID=[从 Google Cloud Console 复制您的 Client ID]

GOOGLE_CLIENT_SECRET=[从 Google Cloud Console 复制您的 Client Secret]

NEXTAUTH_URL=https://ai-counselor-2025-11-3-v1.vercel.app

NEXTAUTH_SECRET=[保持不变]
```

---

## 🔍 获取完整的 Client Secret

如果您不确定完整的 Client Secret：

1. 回到 Google Cloud Console：https://console.cloud.google.com/apis/credentials
2. 点击 "AI Counselor Local" 客户端
3. 在右侧 "客户端密钥" 区域，应该能看到完整的密钥
4. 如果看不到，可能需要重新生成一个新的密钥

**截图给我看看右侧的 "客户端密钥" 部分，我帮您确认！**

---

## ⏱️ 完成后的测试

1. 等待 Vercel 重新部署完成
2. 清除浏览器缓存或使用隐私模式
3. 访问：`https://ai-counselor-2025-11-3-v1.vercel.app`
4. 点击 "使用 Google 登录"
5. 应该能成功跳转到 Google 登录页面并完成登录！

---

## 🎯 关键要点

✅ **必须做的事情：**
1. 更新 `GOOGLE_CLIENT_ID` 为 `882676362189-b91oi4edkk5uov6fhj7481laqj7cqcnn.apps.googleusercontent.com`
2. 确认 `GOOGLE_CLIENT_SECRET` 是正确的
3. **保存后必须 Redeploy**（这是最容易忘记的步骤！）
4. 等待部署完成后再测试

---

准备好开始更新了吗？🚀

