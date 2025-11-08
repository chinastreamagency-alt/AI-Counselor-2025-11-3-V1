# 🛍️ Stripe 支付完整设置指南

## 📋 当前状态

✅ **已有的代码：**
- Stripe SDK 已安装 (`stripe: ^17.5.0`)
- `/app/payment/page.tsx` - 支付页面
- `/app/api/create-checkout-session/route.ts` - 创建支付会话
- `/lib/stripe.ts` - Stripe 配置
- `/lib/products.ts` - 产品定义

❌ **缺少的配置：**
- Stripe API 密钥（环境变量）
- Stripe Webhook 处理
- 支付成功后的时间充值逻辑

---

## 🚀 第一步：注册并配置 Stripe 账户

### 1.1 注册 Stripe 账户

1. 访问：https://dashboard.stripe.com/register
2. 使用邮箱注册（建议使用 chinastreamagency@gmail.com）
3. 验证邮箱
4. 完成账户设置

### 1.2 获取 API 密钥

1. 登录 Stripe Dashboard：https://dashboard.stripe.com/
2. 点击右上角的 **"开发者"** 或 **"Developers"**
3. 点击左侧的 **"API 密钥"** 或 **"API keys"**
4. 您会看到两个密钥：
   - **可发布密钥（Publishable key）**：`pk_test_...` 或 `pk_live_...`
   - **秘密密钥（Secret key）**：`sk_test_...` 或 `sk_live_...`（点击 "显示" 查看）

⚠️ **重要：**
- 先使用 **测试模式（Test mode）** 的密钥进行开发
- 上线后再切换到 **生产模式（Live mode）** 的密钥

### 1.3 复制密钥

**测试模式密钥：**
```
可发布密钥: pk_test_xxxxxxxxxxxxx
秘密密钥: sk_test_xxxxxxxxxxxxx
```

截图给我看看，我会帮您配置！

---

## 🔧 第二步：配置环境变量

### 2.1 本地开发环境（.env.local）

我需要在您的 `.env.local` 文件中添加：

```env
# Stripe API Keys (测试模式)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2.2 Vercel 生产环境

您需要在 Vercel 中添加相同的环境变量：

1. 访问：https://vercel.com/dashboard
2. 进入您的项目
3. Settings → Environment Variables
4. 添加以下变量：
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_APP_URL` = `https://ai-counselor-2025-11-3-v1.vercel.app`

---

## 📝 第三步：配置产品和价格

当前的产品定义在 `lib/products.ts`：

| 套餐 | 时长 | 价格 | 每小时单价 |
|------|------|------|------------|
| 1 Hour | 1小时 | $9.99 | $9.99/小时 |
| 5 Hours | 5小时 | $44.99 | $9.00/小时 |
| 10 Hours | 10小时 | $84.99 | $8.50/小时 |
| 100 Hours | 100小时 | $699.99 | $7.00/小时 |

**如果您想修改价格，请告诉我！**

---

## 🔔 第四步：配置 Stripe Webhook（关键！）

Webhook 用于在用户支付成功后，自动为用户账户充值时间。

### 4.1 为什么需要 Webhook？

当用户完成支付后，Stripe 会通过 Webhook 通知您的服务器：
1. 用户支付成功
2. 服务器收到通知
3. 服务器为用户账户添加购买的时间

### 4.2 创建 Webhook 端点

我需要创建一个新的 API 路由来处理 Webhook。

**告诉我您准备好了，我就开始创建！**

---

## 🧪 第五步：测试支付流程

配置完成后的测试流程：

### 5.1 使用 Stripe 测试卡

Stripe 提供测试信用卡：

| 卡号 | 结果 |
|------|------|
| `4242 4242 4242 4242` | 支付成功 |
| `4000 0000 0000 0002` | 支付失败 |

- **有效期**：任何未来日期（如 12/34）
- **CVC**：任意3位数字（如 123）
- **邮编**：任意5位数字（如 12345）

### 5.2 测试步骤

1. 登录您的应用
2. 点击右上角用户菜单 → "View Account"
3. 点击"充值"或访问 `/payment` 页面
4. 选择一个套餐
5. 使用测试卡 `4242 4242 4242 4242` 完成支付
6. 支付成功后，返回账户页面
7. 确认时间已充值

---

## 📊 当前进度

```
✅ 项目代码准备完成
⬜ 注册 Stripe 账户
⬜ 获取 API 密钥
⬜ 配置环境变量（本地 + Vercel）
⬜ 创建 Webhook 处理
⬜ 测试支付流程
⬜ 切换到生产模式
```

---

## 🎯 下一步行动

### 选项 A：您已经有 Stripe 账户
如果您已经有 Stripe 账户：
1. 登录 Dashboard
2. 获取 API 密钥
3. 截图给我看看
4. 我会帮您配置

### 选项 B：需要注册 Stripe
如果还没有账户：
1. 访问：https://dashboard.stripe.com/register
2. 注册账户
3. 获取测试模式的 API 密钥
4. 告诉我密钥（通过私密方式）

---

## 🚨 重要提示

⚠️ **关于 Supabase**

我注意到代码中使用了 Supabase (`createClient` from `@/lib/supabase/server`)：

```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

但是您的项目使用的是 **Google OAuth（自定义）**，不是 Supabase Auth。

我需要修改 `/app/api/create-checkout-session/route.ts`，改为使用您的自定义会话系统。

**这是必须的修改！**

---

准备好开始了吗？请告诉我：

1. ✅ 您是否已经有 Stripe 账户？
2. ✅ 如果有，请提供测试模式的 API 密钥
3. ✅ 如果没有，我可以指导您注册

一旦您提供了 API 密钥，我会：
1. 配置环境变量
2. 修复认证逻辑（从 Supabase 改为自定义会话）
3. 创建 Webhook 处理
4. 测试完整流程

🚀 让我们开始吧！

