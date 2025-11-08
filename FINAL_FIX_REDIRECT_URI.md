# 🔧 最终修复 redirect_uri_mismatch 错误

## 📊 错误分析

**错误信息：** `Error 400: redirect_uri_mismatch`
**问题 URI：** `https://ai-counselor-2025-11-3-v1.vercel.app/api/auth/custom-google/callback`

这个错误说明：Google 收到了来自这个 URI 的请求，但是在您的 OAuth 客户端配置中**找不到**这个 URI。

---

## 🔍 可能的原因（按优先级排序）

### 原因 1：OAuth 客户端 ID 不匹配 ⭐⭐⭐⭐⭐

**最可能的原因！** 您在 Google Cloud Console 中编辑的 OAuth 客户端，可能**不是** Vercel 正在使用的那个客户端！

#### 如何确认：

1. 打开 Google Cloud Console：https://console.cloud.google.com/apis/credentials
2. 查看您的 OAuth 2.0 客户端列表
3. **可能有多个客户端！**检查每一个的 Client ID

您需要找到 Vercel 正在使用的那个 OAuth 客户端。

#### ✅ 解决方案：

1. 在凭据页面，逐个点击每个"网页应用"类型的 OAuth 客户端
2. 找到 Vercel 环境变量中配置的那个 Client ID
3. 确认这个客户端的"已获授权的重定向 URI"中**必须包含**：
   ```
   https://ai-counselor-2025-11-3-v1.vercel.app/api/auth/custom-google/callback
   ```

---

### 原因 2：URI 拼写错误 ⭐⭐⭐⭐

即使是一个小错误（多余的空格、斜杠、字母大小写）都会导致失败。

#### 请精确复制以下 URI 并添加到 Google Cloud Console：

**已获授权的 JavaScript 来源：**
```
https://ai-counselor-2025-11-3-v1.vercel.app
```

**已获授权的重定向 URI：**
```
https://ai-counselor-2025-11-3-v1.vercel.app/api/auth/custom-google/callback
```

⚠️ **检查清单：**
- [ ] 使用 `https://`（不是 `http://`）
- [ ] 域名是 `ai-counselor-2025-11-3-v1.vercel.app`（没有多余的字符）
- [ ] JavaScript 来源末尾**没有**斜杠 `/`
- [ ] 重定向 URI 的路径是 `/api/auth/custom-google/callback`（没有多余的斜杠）
- [ ] 没有空格或隐藏字符

---

### 原因 3：Google 配置尚未生效 ⭐⭐⭐

Google 的配置更改通常需要 2-5 分钟，但有时可能需要更长时间。

#### ✅ 解决方案：

1. 确认您已经点击了"保存"按钮
2. 等待 **10 分钟**
3. 清除浏览器缓存或使用隐私模式重新测试

---

### 原因 4：Vercel 使用了错误的 Client ID ⭐⭐

如果 Vercel 的环境变量中的 `GOOGLE_CLIENT_ID` 不正确，就会调用错误的 OAuth 客户端。

#### ✅ 解决方案：

1. 访问 Vercel：https://vercel.com/dashboard
2. 进入项目 → Settings → Environment Variables
3. 确认 `GOOGLE_CLIENT_ID` 的值与 Google Cloud Console 中的 Client ID 一致
4. 如果不对，修改后必须 **Redeploy**（重新部署）

---

## 🎯 立即行动方案

### 步骤 1：确认正确的 OAuth 客户端

1. 打开：https://console.cloud.google.com/apis/credentials
2. 找到所有"网页应用"类型的 OAuth 2.0 客户端
3. 逐个点击查看，找到 Vercel 环境变量中配置的那个 Client ID

---

### 步骤 2：检查该客户端的重定向 URI

确认**这个特定客户端**的"已获授权的重定向 URI"列表中包含：

✅ 必须有：
```
https://ai-counselor-2025-11-3-v1.vercel.app/api/auth/custom-google/callback
```

如果没有，添加它！

---

### 步骤 3：保存并等待

1. 点击"保存"
2. 等待 **5-10 分钟**
3. 使用浏览器隐私模式重新测试

---

### 步骤 4：如果还不行，检查 Vercel 环境变量

1. Vercel Dashboard → 您的项目 → Settings → Environment Variables
2. 确认 `GOOGLE_CLIENT_ID` 与 Google Cloud Console 中的一致
3. 确认 `GOOGLE_CLIENT_SECRET` 与 Google Cloud Console 中的一致
4. 如果修改了环境变量，必须 **Redeploy**

---

## 📸 请您做以下操作

为了准确诊断问题，请您：

1. 打开 Google Cloud Console 的凭据页面
2. 截图显示**所有** OAuth 2.0 客户端的列表（包括 Client ID）
3. 点击 Vercel 正在使用的那个 OAuth 客户端
4. 截图显示该客户端的完整配置（包括所有重定向 URI）

这样我可以精确地告诉您问题在哪里！

---

## 🆘 快速自助检查

请您现在就检查：

**在 Google Cloud Console 中，检查您的 OAuth 客户端的"已获授权的重定向 URI"列表中，是否包含 Vercel 域名的回调 URI：**

```
https://ai-counselor-2025-11-3-v1.vercel.app/api/auth/custom-google/callback
```

- ✅ **有** → 那就是 Google 配置还没生效，请等待 10 分钟
- ❌ **没有** → 请立即添加并保存！

---

期待您的反馈！🚀


