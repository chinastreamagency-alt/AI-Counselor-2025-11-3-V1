# AI心理咨询平台 - 部署指南

## 域名信息
- **域名**: applescreenfix.com
- **注册商**: Namecheap

## 免费部署方案：使用Vercel（推荐）

Vercel提供免费套餐，完全满足您的需求，无需付费。

### 步骤1：部署到Vercel

1. **注册Vercel账户**
   - 访问 https://vercel.com
   - 使用GitHub账户注册（推荐）

2. **连接GitHub仓库**
   - 将代码推送到GitHub仓库
   - 在Vercel中点击 "Import Project"
   - 选择您的GitHub仓库

3. **配置环境变量**
   在Vercel项目设置中添加以下环境变量：
   \`\`\`
   OPENAI_API_KEY=your_openai_key
   GOOGLE_CLOUD_API_KEY=your_google_key
   ELEVENLABS_API_KEY=your_elevenlabs_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   \`\`\`

4. **部署**
   - 点击 "Deploy"
   - 等待部署完成（约2-3分钟）

### 步骤2：连接自定义域名

1. **在Vercel中添加域名**
   - 进入项目设置 → Domains
   - 输入 `applescreenfix.com`
   - 点击 "Add"

2. **在Namecheap中配置DNS**
   - 登录Namecheap账户
   - 进入域名管理 → Advanced DNS
   - 添加以下记录：

   **A记录：**
   \`\`\`
   Type: A Record
   Host: @
   Value: 76.76.21.21
   TTL: Automatic
   \`\`\`

   **CNAME记录（www子域名）：**
   \`\`\`
   Type: CNAME Record
   Host: www
   Value: cname.vercel-dns.com
   TTL: Automatic
   \`\`\`

3. **等待DNS生效**
   - DNS传播通常需要几分钟到48小时
   - 可以使用 https://dnschecker.org 检查DNS状态

### 步骤3：配置SSL证书

Vercel会自动为您的域名配置免费的SSL证书（Let's Encrypt），无需手动操作。

---

## 替代方案：其他免费托管平台

如果不想使用Vercel，以下是其他免费选项：

### 1. Netlify
- 免费额度：100GB带宽/月
- 部署步骤类似Vercel
- 网址：https://netlify.com

### 2. Railway
- 免费额度：$5/月使用额度
- 支持数据库托管
- 网址：https://railway.app

### 3. Render
- 免费额度：750小时/月
- 支持静态网站和Web服务
- 网址：https://render.com

---

## 手动部署方案（VPS服务器）

如果您想使用VPS服务器手动部署，以下是免费VPS选项：

### 免费VPS提供商
1. **Oracle Cloud Free Tier**
   - 永久免费
   - 2个VM实例
   - 网址：https://www.oracle.com/cloud/free/

2. **Google Cloud Free Tier**
   - 90天$300额度
   - 之后有永久免费额度
   - 网址：https://cloud.google.com/free

### 手动部署步骤

1. **安装Node.js和npm**
   \`\`\`bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   \`\`\`

2. **克隆代码**
   \`\`\`bash
   git clone <your-repo-url>
   cd <your-project>
   \`\`\`

3. **安装依赖**
   \`\`\`bash
   npm install
   \`\`\`

4. **构建项目**
   \`\`\`bash
   npm run build
   \`\`\`

5. **配置环境变量**
   \`\`\`bash
   nano .env.local
   # 添加所有环境变量
   \`\`\`

6. **使用PM2运行**
   \`\`\`bash
   npm install -g pm2
   pm2 start npm --name "ai-therapy" -- start
   pm2 save
   pm2 startup
   \`\`\`

7. **配置Nginx反向代理**
   \`\`\`nginx
   server {
       listen 80;
       server_name applescreenfix.com www.applescreenfix.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   \`\`\`

8. **配置SSL（使用Let's Encrypt）**
   \`\`\`bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d applescreenfix.com -d www.applescreenfix.com
   \`\`\`

---

## 推荐方案

**强烈推荐使用Vercel免费部署**，原因：
- ✅ 完全免费（无隐藏费用）
- ✅ 自动SSL证书
- ✅ 全球CDN加速
- ✅ 自动部署（推送代码即部署）
- ✅ 零配置，简单易用
- ✅ 无需维护服务器

Vercel的免费套餐包括：
- 100GB带宽/月
- 无限网站
- 自动HTTPS
- 全球CDN
- 对于您的AI心理咨询平台完全够用

---

## 需要帮助？

如果在部署过程中遇到问题，请检查：
1. 环境变量是否正确配置
2. DNS记录是否正确设置
3. SSL证书是否已生效
4. 数据库连接是否正常
