# 🛡️ Stripe 防止恶意退款完整指南

## ⚠️ 重要声明

Stripe **不支持完全禁用退款**，因为这违反了消费者保护法律。但是，我们可以通过以下方法来**最大限度减少恶意退款和争议（Chargeback）**。

---

## 🔐 已实施的防护措施

### 1. **代码层面的防护**

#### ✅ 已添加的功能：
- **支付意图描述**：详细说明购买的服务（`AI Counselor - X hours`）
- **元数据追踪**：记录用户邮箱、产品 ID、购买时间戳
- **客户创建**：自动为每笔交易创建 Stripe Customer，便于追踪历史
- **退款监听**：Webhook 监听 `charge.refunded` 事件

#### 📝 代码实现位置：
- `app/api/create-checkout-session/route.ts` (lines 102-117)
- `app/api/webhooks/stripe/route.ts` (lines 89-99)

---

## 🛠️ Stripe Dashboard 配置（必须手动操作）

### 第一步：启用 Stripe Radar（欺诈检测）

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com)
2. 点击 **Radar** → **Rules**
3. 启用以下规则：

#### 推荐规则：
- **Block if CVC check fails** （CVC 验证失败则阻止）
- **Block if address line 1 check fails** （地址验证失败则阻止）
- **Block if ZIP code check fails** （邮编验证失败则阻止）
- **Review high-risk payments** （审核高风险支付）

#### 自定义规则（高级）：
```
Block if :risk_score: > 75
Review if :card_country: != 'US' AND :amount: > 5000
```

---

### 第二步：配置退款策略

1. 进入 **Settings** → **Disputes**
2. 设置：
   - **Automatic dispute response**: `Manual review` （手动审核）
   - **Evidence collection**: `Enabled` （启用证据收集）

3. 添加 **Terms of Service（服务条款）**：
   - 上传您的 `Terms of Service` 文档
   - 明确说明 **"服务一经使用，不可退款"**

---

### 第三步：启用 3D Secure（强认证）

1. 进入 **Settings** → **Payment methods**
2. 启用 **3D Secure** for:
   - 所有欧洲卡（Required by SCA）
   - 高风险交易
   - 大额交易（> $100）

#### 在代码中启用（已配置）：
```typescript
payment_intent_data: {
  setup_future_usage: 'off_session', // 强制 3D Secure
}
```

---

### 第四步：启用多种支付方式

✅ 已在代码中配置：
- **Card** （信用卡）
- **PayPal** （需要在 Stripe Dashboard 启用）
- **WeChat Pay** （微信支付，需要申请）
- **Alipay** （支付宝，需要申请）

#### 如何启用 PayPal、微信、支付宝？

1. 进入 **Settings** → **Payment methods**
2. 找到对应的支付方式，点击 **Enable**
3. 填写必要的业务信息（可能需要等待审核）

---

## 📜 法律和业务层面的防护

### 1. **服务条款（Terms of Service）**

**必须添加以下条款**：

```markdown
## Refund Policy

- All purchases of AI Counselor consultation time are **FINAL and NON-REFUNDABLE**.
- Once the service is activated and time is added to your account, **no refunds will be issued**.
- By purchasing, you agree to these terms.
- If you have concerns, please contact support before using the service.
```

**实施步骤**：
1. 在支付页面显示此条款（在 `app/payment/page.tsx` 中添加）
2. 要求用户勾选 "I agree to Terms" 后才能支付
3. 将条款 URL 上传到 Stripe Dashboard

---

### 2. **争议处理流程**

当收到争议（Chargeback）时：

#### 📧 自动收集的证据：
- 用户的 IP 地址
- 购买时间戳
- 用户使用服务的记录（会话历史）
- 用户邮箱确认

#### 🛡️ 如何响应争议：
1. 登录 Stripe Dashboard → **Disputes**
2. 点击争议案件 → **Submit Evidence**
3. 提供以下证据：
   - 用户的会话记录（从 localStorage 或数据库导出）
   - 购买确认邮件
   - 服务条款链接
   - 用户使用服务的时间戳

---

## 🚨 180 天退款问题

### 问题：
某些信用卡允许持卡人在 **180 天内发起争议（Chargeback）**，即使服务已使用。

### 解决方案：

#### 1. **使用订阅模式代替一次性付款**
   - 改为按月订阅，而不是一次性购买多小时
   - 订阅更难被退款

#### 2. **限制每次购买的金额**
   - 不要允许一次性购买过多小时（如 100 小时）
   - 建议最多 10-20 小时为一次购买

#### 3. **使用 Stripe Billing + Invoices**
   - 改用发票模式，而非 Checkout
   - 发票更容易提供服务证明

#### 4. **启用 "Use It or Lose It" 策略**
   - 购买的时间在 30-60 天内过期
   - 这样即使退款，用户也失去了价值

---

## 🔥 最佳实践

### ✅ DO（应该做的）：
1. **清晰的服务条款**：在支付前显示
2. **详细的支付描述**：`AI Counselor - 10 hours (non-refundable)`
3. **启用 Stripe Radar**：自动拦截高风险交易
4. **收集证据**：保存用户的会话记录、IP、使用时间
5. **快速响应争议**：在 7 天内提交证据

### ❌ DON'T（不应该做的）：
1. **不要承诺无条件退款**
2. **不要允许一次性购买过大金额**（如 $1000+）
3. **不要在用户投诉后直接拒绝沟通**
4. **不要忽视 Stripe 的争议通知**

---

## 📊 监控和分析

### 在 Stripe Dashboard 中监控：
1. **Disputes** → 查看争议率
2. **Radar** → 查看被拦截的欺诈交易
3. **Payments** → 查看退款率

### 目标指标：
- **Dispute Rate（争议率）**: < 0.5%
- **Refund Rate（退款率）**: < 1%
- **Fraud Rate（欺诈率）**: < 0.1%

---

## 🔗 相关文档

- [Stripe Radar 文档](https://stripe.com/docs/radar)
- [Stripe Disputes 文档](https://stripe.com/docs/disputes)
- [防止欺诈指南](https://stripe.com/guides/fraud-prevention)

---

## ⚠️ 注意事项

1. **Stripe 不允许完全禁用退款**，因为这违反消费者保护法
2. **PayPal 的退款保护更弱**，建议优先推荐信用卡支付
3. **微信支付和支付宝的退款政策更严格**，适合中国用户

---

**最后更新**: 2025-01-XX
**作者**: AI Counselor Team

