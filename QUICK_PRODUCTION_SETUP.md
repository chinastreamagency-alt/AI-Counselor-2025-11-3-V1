# ⚡ 快速生产环境配置清单

## 🎯 配置域名和 Stripe 真实 API

---

## 第 1 步：Vercel 环境变量（5分钟）

### 打开 Vercel 设置
```
https://vercel.com/dashboard
→ 选择项目
→ Settings → Environment Variables
```

### 需要更新的变量

| 变量名 | 新值 | 说明 |
|--------|------|------|
| `NEXT_PUBLIC_APP_URL` | `https://www.arina-ai.tech` | 网站主域名 |
| `NEXTAUTH_URL` | `https://www.arina-ai.tech` | OAuth 回调域名 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Stripe 公钥（生产） |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe 私钥（生产） |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Webhook 签名密钥 |

---

## 第 2 步：获取 Stripe 生产密钥（3分钟）

### 登录 Stripe
```
1. 打开 https://dashboard.stripe.com
2. 右上角切换到 "Production Mode" 🟢
3. 点击 Developers → API keys
```

### 复制密钥
```
Publishable key → 复制 → pk_live_xxxxx
Secret key → Reveal → 复制 → sk_live_xxxxx
```

### 粘贴到 Vercel
```
回到 Vercel → Environment Variables → 更新
```

---

## 第 3 步：配置 Stripe Webhook（3分钟）

### 创建 Webhook
```
1. Stripe Dashboard → Developers → Webhooks
2. 确认在 Production Mode 🟢
3. 点击 "Add endpoint"
```

### 填写信息
```
Endpoint URL: https://www.arina-ai.tech/api/webhooks/stripe
Description: AI Counselor Payment Webhook
```

### 选择事件
```
✅ checkout.session.completed
✅ checkout.session.expired  
✅ payment_intent.payment_failed
✅ charge.refunded
```

### 获取签名密钥
```
创建后 → 点击 Webhook → Signing secret → Reveal
复制 whsec_xxxxx → 粘贴到 Vercel
```

---

## 第 4 步：配置 Google OAuth（3分钟）

### 打开 Google Console
```
https://console.cloud.google.com/apis/credentials
```

### 添加重定向 URI
```
1. 选择您的 OAuth 2.0 客户端 ID
2. 已获授权的重定向 URI → 添加：
   https://www.arina-ai.tech/api/auth/custom-google/callback
3. 保存
```

---

## 第 5 步：绑定域名（5分钟）

### 在 Vercel 中
```
1. Settings → Domains → Add Domain
2. 输入：www.arina-ai.tech
3. 按照提示配置 DNS
```

### 在域名注册商（如 Cloudflare/Namecheap）
```
添加 CNAME 记录：
Name: www
Value: cname.vercel-dns.com
TTL: Auto
```

---

## 第 6 步：重新部署（2分钟）

### 触发部署
```
Vercel → Deployments → 最新部署 → ... → Redeploy
```

等待 2-3 分钟，完成！

---

## ✅ 验证清单

测试以下功能：

- [ ] 访问 https://www.arina-ai.tech
- [ ] Google 登录正常
- [ ] 邮箱注册/登录正常
- [ ] AI 对话正常（免费试用）
- [ ] 充值页面正常显示
- [ ] 支付流程正常（可以用真实卡小额测试）
- [ ] 支付成功后时长增加

---

## 🚨 关键提醒

### Stripe 测试卡（仅在测试模式）
```
❌ 生产模式不能用测试卡！
✅ 必须使用真实信用卡
```

### 环境变量检查
```
所有变量都设置为 Production（生产环境）值
- pk_live_xxx （不是 pk_test_xxx）
- sk_live_xxx （不是 sk_test_xxx）  
- whsec_xxx （生产 Webhook 密钥）
```

---

## 📊 监控

### 查看日志
```
Vercel: Functions → Logs
Stripe: Webhooks → 点击 Webhook → Delivery attempts
```

### 查看数据
```sql
-- 在 Supabase SQL Editor
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;
SELECT email, total_hours FROM users ORDER BY created_at DESC LIMIT 10;
```

---

## 🎉 完成！

配置完成后，您的网站就在生产环境运行了！

**网站**: https://www.arina-ai.tech
**管理后台**: https://www.arina-ai.tech/ad7m2in9
**分销注册**: https://www.arina-ai.tech/promote

---

## 需要帮助？

如果遇到问题：
1. 检查 Vercel 环境变量是否全部更新
2. 确认 Stripe 在 Production Mode
3. 验证 Webhook 端点 URL 正确
4. 查看 Vercel 和 Stripe 日志

