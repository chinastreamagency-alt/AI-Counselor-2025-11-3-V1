# 🚀 生产环境部署指南

## 域名：www.arina-ai.tech

---

## 📋 第一步：在 Vercel 中配置环境变量

### 1. 进入 Vercel 项目设置

1. 打开 https://vercel.com/dashboard
2. 选择您的项目：`AI-Counselor-2025-11-3-V1`
3. 点击 **Settings** → **Environment Variables**

---

### 2. 更新以下环境变量

#### 🌐 应用域名（必须更新）

```bash
NEXT_PUBLIC_APP_URL=https://www.arina-ai.tech
NEXTAUTH_URL=https://www.arina-ai.tech
```

#### 💳 Stripe 生产环境密钥（必须更新）

**⚠️ 重要：需要从 Stripe 生产环境获取**

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

**如何获取 Stripe 生产密钥：**
1. 登录 https://dashboard.stripe.com
2. 点击右上角切换到 **Production Mode**（生产模式）
3. 进入 **Developers** → **API keys**
4. 复制：
   - `Publishable key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `Secret key` → `STRIPE_SECRET_KEY`

#### 🔐 Google OAuth（需要更新重定向 URI）

```bash
GOOGLE_CLIENT_ID=你的生产环境Client ID
GOOGLE_CLIENT_SECRET=你的生产环境Secret
```

**更新 Google OAuth 重定向 URI：**
1. 进入 https://console.cloud.google.com/apis/credentials
2. 选择您的 OAuth 2.0 客户端 ID
3. 在 **已获授权的重定向 URI** 中添加：
   ```
   https://www.arina-ai.tech/api/auth/custom-google/callback
   ```

#### 🗄️ Supabase（保持不变）

```bash
NEXT_PUBLIC_SUPABASE_URL=已配置
SUPABASE_SERVICE_ROLE_KEY=已配置
```

#### 🤖 OpenAI API（保持不变）

```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
```

#### 🎙️ ElevenLabs TTS（保持不变）

```bash
ELEVENLABS_API_KEY=你的密钥
```

#### 🔑 JWT Secret（保持不变）

```bash
JWT_SECRET=你的密钥
```

---

## 🔗 第二步：配置域名

### 在 Vercel 中绑定域名

1. 在 Vercel 项目中，点击 **Settings** → **Domains**
2. 点击 **Add Domain**
3. 输入：`www.arina-ai.tech`
4. 按照提示配置 DNS（在您的域名注册商处）

### DNS 配置（在域名注册商处）

添加以下记录：

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto
```

**或者添加根域名：**

```
Type: A
Name: @
Value: 76.76.21.21
```

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## 🎯 第三步：配置 Stripe Webhook

### 1. 在 Stripe Dashboard 中创建 Webhook

1. 进入 https://dashboard.stripe.com/webhooks
2. 确保在 **Production Mode**（生产模式）
3. 点击 **Add endpoint**
4. 填写：
   - **Endpoint URL**: `https://www.arina-ai.tech/api/webhooks/stripe`
   - **Description**: `AI Counselor Payment Webhook`
5. 在 **Select events to listen to** 中选择：
   - ✅ `checkout.session.completed`
   - ✅ `checkout.session.expired`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.refunded`
6. 点击 **Add endpoint**

### 2. 获取 Webhook 签名密钥

1. 创建 Webhook 后，点击查看详情
2. 在 **Signing secret** 部分，点击 **Reveal**
3. 复制密钥（格式：`whsec_xxxxxxxxxxxxxxxxxxxxx`）
4. 回到 Vercel，设置环境变量：
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
   ```

---

## ✅ 第四步：重新部署

### 在 Vercel 中触发重新部署

1. 在 Vercel 项目页面，点击 **Deployments**
2. 找到最新的部署，点击 **...** → **Redeploy**
3. 选择 **Redeploy with existing Build Cache**
4. 等待部署完成（约 2-3 分钟）

---

## 🧪 第五步：测试生产环境

### 1. 访问网站

打开 https://www.arina-ai.tech

### 2. 测试功能

- [ ] Google 登录
- [ ] 邮箱注册/登录
- [ ] AI 对话（免费试用）
- [ ] 充值流程（使用真实信用卡）
- [ ] 支付成功后时长增加

### 3. 测试 Stripe 支付（真实卡）

⚠️ **注意**：生产环境使用真实信用卡，会产生真实费用

**可以先用小额测试：**
- 购买 1 小时服务（$9.99）
- 完成支付
- 确认时长增加

---

## 📊 第六步：监控

### Vercel 日志

查看实时日志：
- Vercel Dashboard → **Functions** → **Logs**

### Stripe 事件日志

查看 Webhook 事件：
- Stripe Dashboard → **Developers** → **Webhooks** → 点击您的 Webhook → **Delivery attempts**

### Supabase 数据

查看用户和订单：
```sql
-- 查看最近的订单
SELECT * FROM orders 
ORDER BY created_at DESC 
LIMIT 10;

-- 查看用户时长
SELECT email, total_hours, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## ⚠️ 重要提醒

### 安全检查清单

- [ ] ✅ 所有环境变量都设置为生产环境密钥
- [ ] ✅ Stripe 在生产模式（Production Mode）
- [ ] ✅ Google OAuth 重定向 URI 包含生产域名
- [ ] ✅ Webhook 端点使用 HTTPS
- [ ] ✅ JWT_SECRET 是强随机字符串
- [ ] ✅ .env.local 文件不要上传到 Git

### 备份重要信息

请将以下信息保存到安全的地方：
- ✅ Stripe API 密钥
- ✅ Google OAuth 凭据
- ✅ Supabase 密钥
- ✅ JWT Secret

---

## 🎉 完成！

配置完成后，您的网站就在生产环境运行了：

**网站地址**: https://www.arina-ai.tech
**分销商注册**: https://www.arina-ai.tech/promote
**管理后台**: https://www.arina-ai.tech/ad7m2in9

---

## 🆘 故障排查

### 支付失败

1. 检查 Stripe Webhook 是否正确配置
2. 查看 Vercel 日志中的错误
3. 确认 `STRIPE_WEBHOOK_SECRET` 是否正确

### Google 登录失败

1. 检查 OAuth 重定向 URI 是否包含生产域名
2. 确认 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET` 是否正确

### 时长不增加

1. 检查 Webhook 是否被调用（查看 Stripe 事件日志）
2. 查看 Vercel Functions 日志
3. 确认 Supabase `users` 表是否有 `total_hours` 字段

---

## 📞 需要帮助？

如果遇到问题，请检查：
1. Vercel 部署日志
2. Stripe Webhook 日志
3. Supabase 数据库表
4. 浏览器控制台错误

