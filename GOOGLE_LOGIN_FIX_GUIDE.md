# 🔧 Google 登录错误修复指南

## 当前错误
```
error=token_exchange_failed
details={"error":"invalid_grant","error_description":"Bad Request"}
```

## 🎯 问题原因

`invalid_grant` 错误通常由以下原因引起：

1. ✅ **重定向 URI 不匹配**（最常见）
2. **授权码已过期或被使用**
3. **时间同步问题**
4. **Google Cloud Console 配置错误**

---

## 📋 完整修复步骤

### 步骤 1️⃣：检查 Vercel 环境变量

1. **登录 Vercel Dashboard**: https://vercel.com
2. **进入项目**: AI-Counselor-2025-11-3-V1
3. **点击 Settings → Environment Variables**
4. **检查以下变量**:

   | 变量名 | 正确的值 | 应用环境 |
   |--------|---------|---------|
   | `NEXTAUTH_URL` | `https://www.arina-ai.tech` | Production |
   | `NEXTAUTH_URL` | `https://www.arina-ai.tech` | Preview |
   | `GOOGLE_CLIENT_ID` | (您的完整 Client ID) | All |
   | `GOOGLE_CLIENT_SECRET` | (您的完整 Client Secret) | All |
   | `NEXTAUTH_SECRET` | (您的密钥) | All |

5. **重要提示**:
   - ⚠️ `NEXTAUTH_URL` 必须是 `https://www.arina-ai.tech`，不能有尾部斜杠 `/`
   - ⚠️ 必须选择 **Production** 和 **Preview** 环境
   - ⚠️ 修改后必须重新部署

---

### 步骤 2️⃣：检查 Google Cloud Console 配置

1. **访问**: https://console.cloud.google.com/apis/credentials
2. **找到您的 OAuth 2.0 客户端 ID**
3. **点击编辑 (✏️ 图标)**
4. **检查"已获授权的重定向 URI"**，确保包含：

   ```
   https://www.arina-ai.tech/api/auth/custom-google/callback
   ```

5. **完整的重定向 URI 列表应该包括**:
   ```
   http://localhost:3000/api/auth/custom-google/callback  (本地开发)
   https://www.arina-ai.tech/api/auth/custom-google/callback  (生产环境)
   ```

6. **点击"保存"**

⚠️ **注意**: Google 可能需要几分钟来生效配置更改

---

### 步骤 3️⃣：验证环境变量

访问以下 URL 检查环境变量是否正确设置：

```
https://www.arina-ai.tech/api/debug-env
```

您应该看到类似这样的输出：
```json
{
  "NEXTAUTH_URL": "https://www.arina-ai.tech",
  "expectedRedirectUri": "https://www.arina-ai.tech/api/auth/custom-google/callback",
  "GOOGLE_CLIENT_ID_exists": true,
  "GOOGLE_CLIENT_SECRET_exists": true
}
```

❌ **如果 `NEXTAUTH_URL` 显示其他值**，说明 Vercel 环境变量没有正确设置！

---

### 步骤 4️⃣：重新部署

在修改 Vercel 环境变量后，必须重新部署：

**方法 1: 通过 Vercel Dashboard**
1. 进入 **Deployments** 标签
2. 找到最新的部署
3. 点击右侧的 **⋮** (三个点)
4. 选择 **Redeploy**
5. 勾选 **Use existing Build Cache**（可选，更快）
6. 点击 **Redeploy**

**方法 2: 推送新的提交**
```bash
git commit --allow-empty -m "Trigger redeploy for env vars"
git push
```

---

### 步骤 5️⃣：测试登录

1. **清除浏览器缓存和 Cookie**
2. **访问**: https://www.arina-ai.tech/test-login
3. **点击"测试Google登录"**
4. **完成 Google 授权**
5. **检查是否成功返回**

---

## 🔍 调试技巧

### 查看详细日志

1. **Vercel 部署日志**:
   - Deployments → 点击最新部署 → Runtime Logs
   - 查找 "Google OAuth Callback" 相关日志

2. **浏览器控制台**:
   - F12 → Console 标签
   - 查找错误信息

3. **测试页面**:
   - https://www.arina-ai.tech/test-login
   - 会显示详细的登录流程日志

---

## 📌 常见错误和解决方案

### 错误 1: `NEXTAUTH_URL` 仍然是 localhost
**症状**: 访问 `/api/debug-env` 显示 `http://localhost:3000`

**解决**:
1. 确认在 Vercel 中设置了 `NEXTAUTH_URL=https://www.arina-ai.tech`
2. 确认选择了 **Production** 环境
3. **必须重新部署**（环境变量不会自动更新现有部署）

### 错误 2: Google Console 重定向 URI 不匹配
**症状**: Google 显示 "redirect_uri_mismatch" 错误

**解决**:
1. 检查 Google Console 中的 URI 是否**完全匹配**
2. 注意不要有多余的空格或斜杠
3. 等待几分钟让 Google 配置生效

### 错误 3: `invalid_grant` 持续出现
**症状**: 即使配置正确，仍然看到 `invalid_grant`

**可能原因**:
1. **授权码已过期**: 每个授权码只能使用一次，且有效期很短（通常 10 分钟）
2. **多次点击返回**: 不要在授权后点击浏览器的"返回"按钮
3. **时钟不同步**: 检查服务器时间是否正确

**解决**:
- 清除浏览器缓存和 Cookie
- 重新开始登录流程
- 不要多次点击或刷新

---

## ✅ 检查清单

在测试前，确认以下所有项目：

- [ ] Vercel `NEXTAUTH_URL` = `https://www.arina-ai.tech`
- [ ] Vercel 环境变量应用于 **Production** 环境
- [ ] Google Console 重定向 URI 包含 `https://www.arina-ai.tech/api/auth/custom-google/callback`
- [ ] 已重新部署 Vercel 项目
- [ ] 访问 `/api/debug-env` 确认配置正确
- [ ] 清除了浏览器缓存和 Cookie

---

## 🆘 如果还是不行

如果完成所有步骤后仍然失败，请提供以下信息：

1. `/api/debug-env` 的完整输出
2. 浏览器控制台的错误信息（截图）
3. Vercel Runtime Logs 中的相关日志（截图）
4. Google Console OAuth 客户端的重定向 URI 配置（截图）

这将帮助我们更精确地诊断问题。
