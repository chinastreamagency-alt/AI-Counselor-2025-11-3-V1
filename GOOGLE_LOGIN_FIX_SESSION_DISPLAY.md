# ✅ Google 登录会话状态显示修复

## 🎉 问题已解决！

### 之前的问题：
- ✅ Google OAuth 登录成功
- ✅ 用户信息已获取
- ❌ 但页面没有显示登录状态

### 根本原因：
前端组件 `voice-therapy-chat.tsx` 只从 `localStorage` 读取登录状态，但自定义 OAuth 回调只设置了服务器端的 cookie，没有通知前端更新。

### 解决方案：
修改了 `components/voice-therapy-chat.tsx`，添加了以下逻辑：

1. **检测 URL 参数**：当用户从 Google 登录返回时，URL 中会包含 `?login=success&user=xxx`
2. **获取完整会话**：通过 `/api/auth/custom-google/session` API 获取完整的用户信息
3. **保存到 localStorage**：将用户信息保存到本地存储，供后续页面刷新使用
4. **更新 UI 状态**：立即更新组件状态，显示登录信息
5. **清理 URL**：使用 `history.replaceState` 清除 URL 中的登录参数

### 修改的文件：
- `components/voice-therapy-chat.tsx`

### 测试方法：
1. 推送代码到 GitHub
2. Vercel 自动部署
3. 访问 https://ai-counselor-2025-11-3-v1.vercel.app
4. 点击 Google 登录
5. 登录成功后，应该看到：
   - 右上角显示用户头像/名称（而不是 "Login / Register"）
   - 用户已登录状态被正确识别

---

## 🚀 下一步

代码已准备就绪，现在需要：
1. 提交到 Git
2. 推送到 GitHub
3. Vercel 会自动检测并重新部署
4. 等待部署完成（约 2-3 分钟）
5. 重新测试 Google 登录

---

修复完成时间：2025-11-08

