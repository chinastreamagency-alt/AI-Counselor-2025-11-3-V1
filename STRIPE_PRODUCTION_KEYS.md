# 🔑 获取 Stripe 生产环境密钥

## ⚠️ 重要：必须切换到生产模式

---

## 第 1 步：切换到生产模式

### 登录 Stripe Dashboard
```
https://dashboard.stripe.com
```

### 确认右上角显示 "Production" 🟢
```
如果显示 "Test mode" 或 "测试模式"
→ 点击切换按钮 → 选择 "Production"
```

**⚠️ 非常重要**：必须在生产模式下获取密钥！

---

## 第 2 步：获取 API 密钥

### 进入 API Keys 页面
```
Developers → API keys
```

### 复制两个密钥

#### 1. Publishable key (可发布密钥)
```
看起来像：pk_live_51xxxxxxxxxxxxxxxxxxxxx
用途：前端代码中使用
复制到：NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

#### 2. Secret key (私密密钥)
```
看起来像：sk_live_51xxxxxxxxxxxxxxxxxxxxx
用途：后端 API 使用
步骤：点击 "Reveal live key" → 复制
复制到：STRIPE_SECRET_KEY
```

---

## 第 3 步：创建 Webhook

### 进入 Webhooks 页面
```
Developers → Webhooks
```

### 点击 "Add endpoint"

填写以下信息：

```
Endpoint URL:
https://www.arina-ai.tech/api/webhooks/stripe

Description:
AI Counselor Payment Webhook

Events to send:
✅ checkout.session.completed
✅ checkout.session.expired
✅ payment_intent.payment_failed
✅ charge.refunded
```

### 获取 Webhook 签名密钥

创建后：
```
1. 点击刚创建的 Webhook
2. 找到 "Signing secret"
3. 点击 "Reveal" 或 "显示"
4. 复制密钥（看起来像：whsec_xxxxxxxxxxxxxxxxxxxxx）
```

复制到：`STRIPE_WEBHOOK_SECRET`

---

## 第 4 步：在 Vercel 中配置

### 打开 Vercel 项目设置
```
https://vercel.com/dashboard
→ 选择 AI-Counselor-2025-11-3-V1
→ Settings → Environment Variables
```

### 更新/添加以下变量

找到这些变量，点击右侧的 "Edit" 或 "Add New"：

#### 1. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```
旧值可能是：pk_test_xxxxx
新值应该是：pk_live_xxxxx
```

#### 2. STRIPE_SECRET_KEY
```
旧值可能是：sk_test_xxxxx
新值应该是：sk_live_xxxxx
```

#### 3. STRIPE_WEBHOOK_SECRET
```
新值：whsec_xxxxx
（这是刚从 Stripe Webhook 页面复制的）
```

### 保存设置
```
每个变量修改后，点击 "Save"
```

---

## 第 5 步：重新部署

### 触发新部署
```
Vercel → Deployments → 最新部署右侧的 "..." → Redeploy
```

等待部署完成（约 2-3 分钟）

---

## ✅ 验证配置

### 检查清单

#### 在 Stripe Dashboard：
- [ ] 右上角显示 "Production" 🟢（不是 Test mode）
- [ ] API Keys 中有 `pk_live_` 和 `sk_live_` 开头的密钥
- [ ] Webhooks 中有端点：`https://www.arina-ai.tech/api/webhooks/stripe`
- [ ] Webhook 显示为 "Active" 状态

#### 在 Vercel：
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` 以 `pk_live_` 开头
- [ ] `STRIPE_SECRET_KEY` 以 `sk_live_` 开头
- [ ] `STRIPE_WEBHOOK_SECRET` 以 `whsec_` 开头
- [ ] 已重新部署

---

## 🧪 测试支付

### ⚠️ 注意：真实支付

生产环境使用**真实信用卡**，会产生**真实费用**！

### 建议测试流程
```
1. 使用您自己的信用卡
2. 购买最小套餐（1小时 $9.99）
3. 完成支付
4. 刷新网站
5. 确认时长增加到 1 小时
6. 如果需要，可以在 Stripe Dashboard 中退款
```

---

## 🔍 故障排查

### 支付失败

**检查 1：Webhook 是否被调用**
```
Stripe Dashboard → Webhooks → 点击您的 Webhook
→ 查看 "Recent deliveries" 或"最近的传送"
```

如果没有记录：
- 确认 Webhook URL 正确
- 确认选择了正确的事件

**检查 2：Webhook 是否成功**
```
Recent deliveries 中应该显示 "200 OK"
如果显示错误（4xx/5xx）：
→ 点击查看详细错误信息
→ 检查 Vercel Functions 日志
```

### 时长不增加

**检查数据库：**
```sql
-- 在 Supabase SQL Editor
SELECT * FROM orders 
WHERE user_id = (SELECT id FROM users WHERE email = '您的邮箱')
ORDER BY created_at DESC;
```

如果没有订单记录：
- Webhook 可能没有触发
- 检查 Stripe Webhook 日志

如果有订单但没有时长：
- 检查 `users` 表的 `total_hours` 字段
- 查看 Vercel Functions 日志

---

## 📞 需要帮助？

如果配置过程中遇到问题，请检查：

1. **Stripe 模式**：必须是 Production，不是 Test
2. **密钥格式**：
   - 可发布密钥以 `pk_live_` 开头
   - 私密密钥以 `sk_live_` 开头
   - Webhook 密钥以 `whsec_` 开头
3. **Webhook URL**：必须是 `https://www.arina-ai.tech/api/webhooks/stripe`
4. **重新部署**：修改环境变量后必须重新部署

---

## 🎉 完成！

配置完成后，您的支付系统就可以接受真实支付了！

记住：
- ✅ 所有测试都使用真实信用卡
- ✅ 会产生真实费用
- ✅ 可以在 Stripe Dashboard 中管理订单和退款

