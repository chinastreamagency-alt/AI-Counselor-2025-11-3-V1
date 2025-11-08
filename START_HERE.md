# 🚀 开始部署到 Vercel

## 📁 重要文件

我已经为你准备了以下文件：

1. **DEPLOYMENT_CHECKLIST.md** ⭐ 
   - 完整的部署步骤清单
   - **从这里开始！**

2. **VERCEL_ENV_TEMPLATE.md**
   - 环境变量配置指南
   - 从本地 .env.local 复制值

3. **VERCEL_DEPLOYMENT_GUIDE.md**
   - 详细的部署指南
   - 包含常见问题解答

---

## 🎯 快速开始（3 步）

### 1️⃣ 访问 Vercel
👉 https://vercel.com
- 使用 GitHub 登录

### 2️⃣ 导入项目
- 点击 "Add New..." → "Project"
- 选择你的 GitHub 仓库

### 3️⃣ 配置环境变量
- 打开本地的 `.env.local` 文件
- 参考 `VERCEL_ENV_TEMPLATE.md` 指南
- 在 Vercel 中配置 4 个必需的环境变量
- 点击 "Deploy"

---

## ✅ 部署后

1. **记下你的 Vercel 域名**（如 `ai-counselor-xxx.vercel.app`）

2. **更新 Google Cloud Console**:
   - 添加 Vercel 域名到授权来源
   - 添加回调 URI

3. **更新 Vercel 的 NEXTAUTH_URL**:
   - 改为你的实际域名

4. **重新部署**

5. **测试 Google 登录** ✨

---

## 🎉 完成！

部署成功后，你的 AI 心理咨询师将：
- ✅ 在全球范围内可访问
- ✅ Google 登录完美工作
- ✅ 无需任何 VPN 配置

---

## 📞 需要帮助？

如果遇到问题，告诉我：
1. 你的 Vercel 域名
2. 错误信息
3. 截图

---

**现在就开始部署吧！** 🚀

打开 `DEPLOYMENT_CHECKLIST.md` 跟着步骤走！

