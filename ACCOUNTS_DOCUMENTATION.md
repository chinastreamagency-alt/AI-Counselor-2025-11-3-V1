# AI心理咨询平台 - 账户信息文档

## 系统概述

本平台是一个AI驱动的心理咨询服务平台，包含以下功能模块：
- **用户端**：用户注册、登录、AI心理咨询、购买时长
- **管理后台**：管理员管理用户、订单、推广者
- **推广系统**：推广者注册、生成推广链接、查看佣金

---

## 1. 普通用户登录

### 登录页面
- **网址**: `https://applescreenfix.com`（首页即为AI咨询界面）
- **注册方式**: 用户可以通过邮箱注册或社交账号登录（Google）

### 用户功能
用户登录后可以：
1. 与AI心理咨询师进行语音/文字对话
2. 查看个人资料和剩余咨询时长
3. 购买咨询时长套餐（1小时、5小时、10小时、100小时）
4. 查看历史订单记录

### 测试账户（用于测试）
\`\`\`
邮箱: user@test.com
密码: User123!@#
\`\`\`

---

## 2. 管理员后台

### 登录页面
- **网址**: `https://applescreenfix.com/admin/login`

### 管理员账户
\`\`\`
用户名: admin
密码: Admin@2024#Secure!
\`\`\`

**密码说明**：
- 基础密码：admin
- 增强部分：@2024#Secure!
- 包含大小写字母、数字和特殊字符，符合安全要求

### 管理员功能
管理员登录后可以：
1. **仪表板统计**
   - 查看总收入、订单数、用户数、推广者数量
   - 实时数据更新

2. **订单管理**
   - 查看所有用户的支付记录
   - 筛选订单（按状态、日期范围）
   - 导出订单数据（CSV格式）
   - 订单详情包括：
     - 用户ID/昵称
     - 支付时间
     - 计费小时数
     - 订单金额（支持CNY/USD）
     - 支付状态（成功/失败/待处理）
     - Stripe订单ID

3. **用户管理**
   - 查看所有注册用户
   - 查看用户剩余时长
   - 查看用户订单历史

4. **推广者管理**
   - 查看所有推广者信息
   - 查看推广链接和推广码
   - 查看佣金统计（总佣金、已结算、未结算）
   - 手动结算佣金
   - 修改推广者佣金比例
   - 启用/禁用推广者账户

---

## 3. 推广人系统

### 推广人注册页面
- **网址**: `https://applescreenfix.com/promote`

### 推广人登录页面
- **网址**: `https://applescreenfix.com/affiliate/login`

### 注册流程
1. 访问注册页面
2. 输入邮箱地址
3. 设置密码
4. 系统自动生成唯一推广码（如：REF-ABC123）
5. 获得专属推广链接

### 推广链接格式
\`\`\`
https://applescreenfix.com/payment?ref=REF-ABC123
\`\`\`

### 测试推广账户
\`\`\`
邮箱: promoter@test.com
密码: Promoter123!@#
推广码: REF-TEST001
\`\`\`

### 推广人功能

#### 1. 推广仪表板
- **网址**: `https://applescreenfix.com/affiliate`
- 登录后自动跳转到仪表板

#### 2. 统计数据
推广者可以查看：
- **总佣金**：累计获得的所有佣金
- **已结算金额**：已经提现/结算的金额
- **未结算金额**：待结算的佣金
- **推广订单数**：通过推广链接产生的订单总数

#### 3. 推广链接管理
- 查看专属推广链接
- 一键复制推广链接
- 查看推广码

#### 4. 订单追踪
推广者可以查看通过其推广链接产生的所有订单：
- 订单ID
- 用户信息
- 购买时长
- 订单金额
- 佣金金额
- 下单时间
- 支付状态

#### 5. 佣金历史
查看所有佣金记录：
- 佣金金额
- 来源订单
- 佣金状态（待结算/已结算）
- 结算时间
- 备注信息

### 佣金机制

#### 佣金比例
- 默认佣金比例：**10%**
- 管理员可以为不同推广者设置不同的佣金比例

#### 佣金计算
\`\`\`
佣金金额 = 订单金额 × 佣金比例
\`\`\`

例如：
- 用户通过推广链接购买100小时套餐（$699.99）
- 推广者佣金比例为10%
- 推广者获得佣金：$699.99 × 10% = $69.99

#### 佣金结算
- 佣金状态分为：**待结算**、**已结算**
- 管理员在后台手动结算佣金
- 结算后，佣金从"未结算金额"转移到"已结算金额"

---

## 4. 支付系统

### Stripe集成
- 使用Stripe作为支付网关
- 支持测试模式和生产模式

### 测试模式（开发/演示）
使用Stripe测试卡号：
\`\`\`
卡号: 4242 4242 4242 4242
过期日期: 任意未来日期（如：12/25）
CVC: 任意3位数字（如：123）
邮编: 任意5位数字（如：12345）
\`\`\`

### 生产模式
- 需要在Stripe后台配置真实的支付密钥
- 支持真实信用卡/借记卡支付
- 自动处理支付成功/失败

### 价格套餐
| 套餐 | 时长 | 价格 | 单价 | 优惠 |
|------|------|------|------|------|
| 基础套餐 | 1小时 | $9.99 | $9.99/小时 | - |
| 标准套餐 | 5小时 | $44.99 | $9.00/小时 | 10% |
| 高级套餐 | 10小时 | $84.99 | $8.50/小时 | 15% |
| 企业套餐 | 100小时 | $699.99 | $7.00/小时 | 30% |

---

## 5. 数据库架构

### 主要数据表

#### users（用户表）
- id: 用户唯一ID
- email: 邮箱
- name: 姓名
- avatar_url: 头像
- total_hours: 总购买时长
- used_hours: 已使用时长
- remaining_hours: 剩余时长

#### orders（订单表）
- id: 订单ID
- user_id: 用户ID
- stripe_session_id: Stripe会话ID
- amount: 订单金额
- currency: 货币类型
- hours: 购买时长
- status: 订单状态
- referral_code: 推广码（如果有）

#### affiliates（推广者表）
- id: 推广者ID
- email: 邮箱
- referral_code: 推广码
- commission_rate: 佣金比例
- total_commission: 总佣金
- settled_commission: 已结算佣金
- unsettled_commission: 未结算佣金

#### commissions（佣金表）
- id: 佣金记录ID
- affiliate_id: 推广者ID
- order_id: 订单ID
- amount: 佣金金额
- status: 状态（pending/settled）
- settled_at: 结算时间

#### usage_logs（使用记录表）
- id: 记录ID
- user_id: 用户ID
- session_start: 会话开始时间
- session_end: 会话结束时间
- duration_hours: 使用时长

---

## 6. API端点

### 用户相关
- `POST /api/auth/signup` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/user/profile` - 获取用户信息
- `GET /api/user/hours` - 获取剩余时长

### 支付相关
- `POST /api/create-checkout-session` - 创建支付会话
- `POST /api/stripe-webhook` - Stripe webhook处理

### 使用追踪
- `POST /api/usage/start` - 开始会话
- `POST /api/usage/end` - 结束会话

### 管理员相关
- `POST /api/admin/login` - 管理员登录
- `GET /api/admin/orders` - 获取订单列表
- `GET /api/admin/stats` - 获取统计数据
- `GET /api/admin/affiliates` - 获取推广者列表
- `POST /api/admin/commissions/settle` - 结算佣金

### 推广者相关
- `POST /api/affiliate/register` - 推广者注册
- `POST /api/affiliate/login` - 推广者登录
- `GET /api/affiliate/stats` - 获取推广统计
- `GET /api/affiliate/orders` - 获取推广订单
- `GET /api/affiliate/commissions` - 获取佣金记录

---

## 7. 安全措施

### 密码安全
- 所有密码使用bcrypt加密存储
- 密码强度要求：至少8位，包含大小写字母、数字和特殊字符

### API安全
- 使用JWT令牌进行身份验证
- 所有敏感API需要验证令牌
- 实施行级安全策略（RLS）

### 支付安全
- 使用Stripe官方SDK
- 不存储信用卡信息
- 使用webhook验证支付状态

### 数据安全
- 使用Supabase行级安全策略
- 用户只能访问自己的数据
- 管理员和推广者有独立的权限控制

---

## 8. 环境变量配置

部署时需要配置以下环境变量：

\`\`\`env
# OpenAI API（用于AI对话）
OPENAI_API_KEY=sk-...

# Google Cloud（用于语音识别）
GOOGLE_CLOUD_API_KEY=...
GOOGLE_SERVICE_ACCOUNT_JSON=...

# ElevenLabs（用于语音合成）
ELEVENLABS_API_KEY=...

# Stripe支付
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Supabase数据库
SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# 应用URL（用于支付回调）
NEXT_PUBLIC_APP_URL=https://applescreenfix.com
\`\`\`

---

## 9. 常见问题

### Q: 如何重置管理员密码？
A: 需要直接在数据库中更新admin_users表的password_hash字段。

### Q: 推广者如何提现佣金？
A: 目前需要推广者联系管理员，管理员在后台手动结算。未来可以集成自动提现功能。

### Q: 支付失败怎么办？
A: 检查Stripe配置是否正确，查看Stripe后台的错误日志。

### Q: 如何修改价格套餐？
A: 修改`lib/products.ts`文件中的PRODUCTS数组。

### Q: 如何添加新的管理员？
A: 在数据库的admin_users表中插入新记录，密码需要使用bcrypt加密。

---

## 10. 技术支持

如有问题，请检查：
1. 环境变量是否正确配置
2. 数据库连接是否正常
3. Stripe webhook是否正确配置
4. 查看浏览器控制台和服务器日志

---

**文档版本**: 1.0  
**最后更新**: 2024年  
**平台域名**: applescreenfix.com
