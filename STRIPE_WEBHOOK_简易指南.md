# 🎯 Stripe Webhook 配置 - 超简单步骤

## ⚠️ 重要：您找错了页面！

您打开的是 **"Event destinations"（事件目标）** 页面 ❌  
我们需要的是 **"Webhooks"** 页面 ✅

---

## 🔍 如何找到正确的 Webhooks 页面

### 方法 1：直接访问 URL（推荐）

**直接复制这个链接到浏览器：**

```
https://dashboard.stripe.com/test/webhooks
```

这会直接带您到正确的页面！

---

### 方法 2：从左侧菜单导航

1. 在 Stripe Dashboard 左侧菜单
2. 找到 **"Developers"（开发者）** 
3. 点击展开，会看到子菜单：
   - API keys
   - **Webhooks** ← 点击这个！
   - Events
   - Logs
   - ...

⚠️ **不要点击 "Events" 或其他选项！**

---

## ✅ 正确的页面应该长这样

### 页面特征：

- 🏷️ **页面标题**：Webhooks
- 🔵 **有一个蓝色按钮**：**"Add endpoint"** 或 **"+ Add an endpoint"**
- 📋 **页面说明**：类似于 "Webhooks allow you to receive real-time notifications..."

### 如果您看到这些，就对了！

---

## 📝 添加 Webhook Endpoint 的步骤

### 步骤 1：点击 "Add endpoint" 按钮

### 步骤 2：填写表单

会出现一个表单，需要填写：

#### 2.1 Endpoint URL（必填）
```
https://ai-counselor-2025-11-3-v1.vercel.app/api/webhooks/stripe
```

**请完整复制上面的 URL！**

#### 2.2 Description（可选）
```
AI Counselor payment webhook
```

#### 2.3 Events to send（必填）

1. 点击 **"Select events"** 或 **"+ Select events"**
2. 在搜索框中输入：`checkout`
3. 找到并勾选：
   - ✅ **checkout.session.completed** ← 最重要！
   - ✅ checkout.session.expired（可选）
4. 点击 **"Add events"**

#### 2.4 API version
使用默认值即可（通常是最新版本）

### 步骤 3：保存

点击页面底部的 **"Add endpoint"** 按钮

---

## 🔑 获取 Webhook Signing Secret

保存后，您会进入新创建的 Webhook 详情页面：

1. 找到 **"Signing secret"** 部分
2. 点击 **"Reveal"** 或 **"Click to reveal"**
3. 复制这个密钥（格式：`whsec_xxxxxxxxxxxxxx`）
4. **保存到安全的地方！**

**这个密钥需要添加到 Vercel 环境变量中：**
- 变量名：`STRIPE_WEBHOOK_SECRET`
- 变量值：`whsec_xxxxxxxxxxxxxx`（您复制的密钥）

---

## 🎯 快速检查清单

在继续之前，请确认：

- [ ] 我访问的 URL 是 `https://dashboard.stripe.com/test/webhooks`
- [ ] 页面标题是 "Webhooks"（不是 "Events" 或 "Event destinations"）
- [ ] 我看到了 "Add endpoint" 按钮
- [ ] 我填写了正确的 Endpoint URL
- [ ] 我选择了 `checkout.session.completed` 事件
- [ ] 我保存了 Webhook endpoint
- [ ] 我获取并复制了 Signing secret

---

## 🆘 如果还是找不到

### 尝试这个：

1. **完全退出** Stripe Dashboard
2. **重新登录**
3. 确保您处于 **"Test mode"**（页面右上角应该有一个开关）
4. **直接访问**：https://dashboard.stripe.com/test/webhooks

---

## 📸 请您做：

1. **访问**：https://dashboard.stripe.com/test/webhooks
2. **截图**这个页面给我看
3. 告诉我您看到了什么

我会确认这是正确的页面，然后指导您添加 Webhook！

---

**提示：** 如果您看到的页面和我描述的不一样，可能是因为：
- Stripe 界面有更新（告诉我您看到了什么）
- 账户权限问题（确认您是账户所有者）
- 浏览器语言设置（尝试切换到英文）

别担心，我会帮您找到正确的位置！🚀

