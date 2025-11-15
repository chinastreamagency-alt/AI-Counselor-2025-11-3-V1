# ⚡ 快速修复 Google OAuth 问题

## 当前状态
✅ Vercel 环境变量正确：`NEXTAUTH_URL=https://www.arina-ai.tech`
❌ 仍然出现 `invalid_grant` 错误

## 🎯 最可能的原因

根据调试信息，问题 99% 是 **Google Cloud Console 的重定向 URI 配置不正确**。

---

## 🔧 立即修复步骤

### 步骤 1：检查 Google Cloud Console

1. **打开浏览器**，访问：
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **登录您的 Google 账号**（用于创建 OAuth 客户端的账号）

3. **找到 OAuth 2.0 客户端 ID**
   - 在"OAuth 2.0 客户端 ID"部分
   - 名称可能是"Web client"或类似名称
   - 客户端 ID 开头是：`882676362189-...`

4. **点击客户端名称**进入编辑页面

5. **查看"已获授权的重定向 URI"部分**

6. **确保包含以下 URI**（完全匹配，不能多也不能少）：
   ```
   https://www.arina-ai.tech/api/auth/custom-google/callback
   ```

   ⚠️ **注意**：
   - 必须是 `https`（不是 `http`）
   - 不能有尾部斜杠 `/`
   - 域名必须完全匹配 `www.arina-ai.tech`
   - 路径必须完全匹配 `/api/auth/custom-google/callback`

7. **如果缺少或不匹配**：
   - 点击"+ 添加 URI"
   - 粘贴：`https://www.arina-ai.tech/api/auth/custom-google/callback`
   - 点击"保存"

8. **等待 1-2 分钟**让 Google 配置生效

---

### 步骤 2：清除缓存并重新测试

1. **在手机浏览器中**：
   - 清除浏览器缓存和 Cookie
   - 关闭所有标签页

2. **重新访问**：
   ```
   https://www.arina-ai.tech/test-login
   ```

3. **点击"测试Google登录"**

4. **完成 Google 授权**

5. **检查结果**

---

### 步骤 3：查看详细日志

如果仍然失败，请查看 Vercel 日志：

1. **访问 Vercel Dashboard**：https://vercel.com
2. **进入您的项目**
3. **点击 Deployments**
4. **点击最新的部署**
5. **点击 "View Function Logs" 或 "Runtime Logs"**
6. **尝试登录**，然后刷新日志页面
7. **查找包含以下内容的日志**：
   - `Token exchange 参数`
   - `使用的 redirect_uri`
   - `Token exchange failed`

---

## 📋 完整的 Google Console 配置检查清单

确认以下所有项目：

- [ ] 已登录正确的 Google 账号
- [ ] 找到了正确的 OAuth 客户端（客户端 ID 以 `882676362189-` 开头）
- [ ] "已获授权的重定向 URI"包含：`https://www.arina-ai.tech/api/auth/custom-google/callback`
- [ ] URI 完全匹配（没有多余的空格、斜杠或字符）
- [ ] 已点击"保存"
- [ ] 已等待 1-2 分钟

---

## 🔍 常见错误

### 错误 1: 重定向 URI 不完全匹配

**错误示例**：
```
❌ http://www.arina-ai.tech/api/auth/custom-google/callback  (http 而不是 https)
❌ https://www.arina-ai.tech/api/auth/custom-google/callback/  (有尾部斜杠)
❌ https://arina-ai.tech/api/auth/custom-google/callback  (缺少 www.)
```

**正确**：
```
✅ https://www.arina-ai.tech/api/auth/custom-google/callback
```

### 错误 2: 找错了 OAuth 客户端

如果您的 Google Cloud Console 中有多个 OAuth 客户端，请确保：
1. 查看客户端 ID 是否以 `882676362189-` 开头
2. 这是您在 `.env.local` 文件中使用的客户端

### 错误 3: 配置未生效

Google 可能需要几分钟来传播配置更改。如果刚修改：
- 等待 2-3 分钟
- 刷新浏览器
- 清除缓存
- 重试

---

## 🆘 如果还是不行

请提供以下截图：

1. **Google Cloud Console**：
   - OAuth 客户端的"已获授权的重定向 URI"部分的完整截图

2. **Vercel Runtime Logs**：
   - 包含 `Token exchange 参数` 和错误信息的日志截图

3. **浏览器错误 URL**：
   - 失败后浏览器地址栏显示的完整 URL

有了这些信息，我可以更精确地诊断问题。
