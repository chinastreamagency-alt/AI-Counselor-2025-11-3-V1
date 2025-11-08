# 🚀 联盟营销系统完整指南

## ✅ 系统功能总览

您的AI咨询平台现在拥有一个**完整的联盟营销系统**，包括：

### 1. 👥 用户注册系统
- ✅ **Google一键登录** - 原有功能保留
- ✅ **邮箱注册** - 新增功能
  - 路径：`/register`
  - 6位数密码要求
  - 自动创建用户档案

### 2. 🤝 推广人员系统
- ✅ **推广人员注册** - `/affiliate/register`
  - 自动生成唯一推荐码
  - 默认10%佣金比例
  - 生成专属推广链接

- ✅ **推广人员仪表板** - `/affiliate`
  - 实时查看总佣金、未结算佣金、已结算佣金
  - 查看推广订单列表
  - 复制推广链接和推荐码
  - 查看佣金明细

- ✅ **推广人员登录** - `/affiliate/login`

### 3. 🏢 管理员后台
- ✅ **管理员登录** - `/admin/login`
- ✅ **管理员仪表板** - `/admin`
  - 查看总收入、总订单、总用户数、推广人员数
  - 查看所有订单
  - 导出CSV报表
  - 按状态和日期筛选

- ✅ **推广人员管理** - `/admin/affiliates`
  - 查看所有推广人员
  - 编辑佣金比例（管理员可自定义）
  - 管理推广人员状态（激活/暂停/停用）
  - 查看每个推广人员的佣金明细
  - 结算佣金（批量或单个）

### 4. 💰 支付与佣金系统
- ✅ **推荐码追踪**
  - URL格式：`/payment?ref=REFERRAL_CODE`
  - 支付页面显示推荐码提示
  - 自动关联订单到推广人员

- ✅ **自动佣金分配**
  - 订单完成时自动计算佣金
  - 数据库触发器自动创建佣金记录
  - 实时更新推广人员佣金总额

## 📋 使用流程

### 推广人员使用流程

1. **注册账户**
   ```
   访问：https://你的域名.com/affiliate/register
   填写邮箱和姓名（可选）
   获取推荐码和推广链接
   ```

2. **分享推广链接**
   ```
   标准格式：https://你的域名.com/payment?ref=YOUR_CODE
   客户通过此链接购买，自动归属到您的账户
   ```

3. **查看收益**
   ```
   登录：https://你的域名.com/affiliate/login
   查看实时订单和佣金
   ```

### 管理员使用流程

1. **登录管理后台**
   ```
   访问：https://你的域名.com/admin/login
   ```

2. **管理推广人员**
   ```
   访问：https://你的域名.com/admin/affiliates
   
   可以：
   - 修改佣金比例（例如：从10%改为15%）
   - 暂停/激活推广人员
   - 查看推广人员的详细数据
   ```

3. **结算佣金**
   ```
   点击"View"查看推广人员的未结算佣金
   选择要结算的佣金
   点击"Settle Selected"完成结算
   ```

## 🗄️ 数据库结构

### 主要数据表

1. **users** - 用户表
   - 存储所有注册用户
   - 包含购买时长和使用时长

2. **affiliates** - 推广人员表
   ```sql
   - id: UUID
   - email: 邮箱
   - name: 姓名
   - referral_code: 推荐码（唯一）
   - commission_rate: 佣金比例（%）
   - total_commission: 总佣金
   - settled_commission: 已结算佣金
   - unsettled_commission: 未结算佣金
   - status: 状态（active/suspended/inactive）
   ```

3. **orders** - 订单表
   ```sql
   - id: UUID
   - user_id: 用户ID
   - affiliate_id: 推广人员ID（可选）
   - amount: 金额
   - hours_purchased: 购买时长
   - status: 状态
   ```

4. **commissions** - 佣金表
   ```sql
   - id: UUID
   - affiliate_id: 推广人员ID
   - order_id: 订单ID
   - amount: 佣金金额
   - status: 状态（pending/settled）
   - settled_at: 结算时间
   ```

5. **admin_users** - 管理员表
   ```sql
   - id: UUID
   - username: 用户名
   - password_hash: 加密密码
   - email: 邮箱
   - role: 角色
   ```

### 自动触发器

系统已配置以下数据库触发器（在`scripts/003_create_functions.sql`中）：

1. **update_user_hours** - 订单完成时自动增加用户购买时长
2. **create_commission** - 订单完成且有推广人员时自动创建佣金记录
3. **更新推广人员佣金总额** - 自动更新 total_commission 和 unsettled_commission

## 🔗 重要链接

### 用户端
- 主页（登录）：`/`
- 用户注册：`/register`
- 支付页面：`/payment`
- 推广链接：`/payment?ref=REFERRAL_CODE`

### 推广人员
- 推广人员注册：`/affiliate/register`
- 推广人员登录：`/affiliate/login`
- 推广人员仪表板：`/affiliate`

### 管理员
- 管理员登录：`/admin/login`
- 管理员仪表板：`/admin`
- 推广人员管理：`/admin/affiliates`

## 💡 推广示例

### 推广人员可以这样分享：

```markdown
🎉 AI心理咨询限时优惠！

通过我的专属链接注册，享受专业AI心理咨询服务：
👉 https://你的域名.com/payment?ref=JOHN123

✅ 24/7全天候服务
✅ 隐私保密
✅ 多种套餐选择

我的推荐码：JOHN123
```

## 🔐 安全性

- ✅ 推荐码唯一性验证
- ✅ 管理员JWT身份验证
- ✅ Supabase Row Level Security (RLS)
- ✅ 密码加密存储（bcrypt）
- ✅ Stripe安全支付

## 📊 佣金结算流程

1. **客户购买**
   - 客户通过推广链接购买 → 订单创建 → 状态：completed

2. **佣金生成（自动）**
   - 数据库触发器自动创建佣金记录
   - 状态：pending（待结算）
   - 自动更新推广人员的 unsettled_commission

3. **管理员结算**
   - 管理员在后台选择待结算佣金
   - 点击"Settle Selected"
   - 佣金状态：pending → settled
   - unsettled_commission → settled_commission

4. **线下支付**
   - 管理员根据 settled_commission 金额
   - 通过银行转账/PayPal等方式支付给推广人员

## 🎯 下一步建议

### 可选增强功能：

1. **短链接生成器**
   - 集成 bit.ly API
   - 生成短域名推广链接

2. **邮件通知**
   - 订单成功通知推广人员
   - 佣金结算邮件提醒

3. **推广素材库**
   - 提供横幅、文案模板
   - 社交媒体分享按钮

4. **多级推广**
   - 二级推广人员系统
   - 团队管理功能

5. **推广数据分析**
   - 点击追踪
   - 转化率统计
   - 收益趋势图表

## 🆘 常见问题

### Q: 如何创建第一个管理员账户？
A: 需要直接在Supabase后台的`admin_users`表中插入记录，密码需要用bcrypt加密。

### Q: 佣金比例可以针对不同推广人员设置吗？
A: 可以！管理员可以在`/admin/affiliates`页面为每个推广人员单独设置佣金比例。

### Q: 推荐码有效期多久？
A: 推荐码永久有效，除非管理员将推广人员状态改为"suspended"或"inactive"。

### Q: 支持哪些支付方式？
A: 目前支持信用卡（通过Stripe）。其他支付方式（PayPal、支付宝、微信支付）需要在Stripe Dashboard中单独启用。

### Q: 如何防止推广人员作弊？
A: 
1. 每个推广链接都有唯一追踪码
2. 管理员可以查看每笔订单的详细信息
3. 可以随时暂停可疑推广人员
4. Stripe有完善的反欺诈系统

## 📞 技术支持

如需帮助，请查看：
- 代码仓库：GitHub上的项目文档
- API文档：`/api/*` 路由注释
- 数据库脚本：`/scripts/*.sql`

---

## ✨ 总结

您现在拥有一个**生产级别的联盟营销系统**，包括：

✅ 完整的用户注册（Google + 邮箱）
✅ 推广人员注册和管理
✅ 自动推荐码追踪
✅ 自动佣金计算和分配
✅ 强大的管理员后台
✅ 实时数据统计和报表

系统已经可以立即投入使用！🎉

