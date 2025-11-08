# 📋 Vercel 环境变量配置指南

## ⚠️ 重要提示

**本文件不包含实际的密钥值！** 实际的密钥值在你的本地 `.env.local` 文件中。

---

## 🔧 需要配置的环境变量

在 Vercel 项目设置中，添加以下环境变量：

### 1. NextAuth 配置

```
变量名: NEXTAUTH_URL
值: https://你的域名.vercel.app
说明: 首次部署后更新为实际的 Vercel 域名
```

```
变量名: NEXTAUTH_SECRET
值: (从本地 .env.local 文件复制)
说明: 用于加密会话
```

### 2. Google OAuth 配置

```
变量名: GOOGLE_CLIENT_ID
值: (从本地 .env.local 文件复制)
说明: Google OAuth 客户端 ID
```

```
变量名: GOOGLE_CLIENT_SECRET
值: (从本地 .env.local 文件复制)
说明: Google OAuth 客户端密钥
```

---

## 📝 可选的环境变量

如果你的应用使用了以下服务，也需要添加：

### OpenAI API
```
变量名: OPENAI_API_KEY
值: (如果有的话，从 .env.local 复制)
```

### DeepSeek API
```
变量名: DEEPSEEK_API_KEY
值: (如果有的话，从 .env.local 复制)
```

### 数据库
```
变量名: DATABASE_URL
值: (如果有的话，从 .env.local 复制)
```

### Stripe 支付
```
变量名: STRIPE_SECRET_KEY
值: (如果有的话，从 .env.local 复制)
```

```
变量名: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
值: (如果有的话，从 .env.local 复制)
```

---

## 🎯 配置步骤

1. **打开本地的 `.env.local` 文件**
2. **复制每个变量的值**
3. **在 Vercel 项目设置中逐个添加**
4. **首次部署后，更新 `NEXTAUTH_URL` 为实际域名**
5. **重新部署**

---

## 🔒 安全提示

- ❌ **永远不要把密钥上传到 GitHub**
- ❌ **永远不要在公开文档中写入密钥**
- ✅ **只在 Vercel 的环境变量中配置密钥**
- ✅ **本地的 `.env.local` 文件已被 .gitignore 忽略**

---

**准备好了吗？开始配置环境变量！** 🚀

