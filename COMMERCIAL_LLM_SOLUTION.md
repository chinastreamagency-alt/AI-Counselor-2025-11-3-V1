# 🚀 AI 心理咨询师 - 真正可商用的免费方案

## ❌ GLM-4-Flash 的问题

您说得对！**100万 tokens/天 ≈ 约 2000 次对话**，无法商用。

假设每次对话 500 tokens：
- 100 用户/天 × 20 次对话 = 2000 次 ✅ 刚好够
- 500 用户/天 × 20 次对话 = 10000 次 ❌ 远超免费额度

**结论**：GLM-4-Flash 只适合小规模测试，不适合商用。

---

## ✅ 真正可商用的 3 种方案

### 方案 A：Groq API（推荐 - 超快速度）

**免费额度**：
- **30,000 tokens/分钟**（TPM）
- **30 requests/分钟**（RPM）
- **永久免费**（目前）

**计算**：
- 30,000 TPM × 60 分钟 × 24 小时 = **43,200,000 tokens/天**
- 假设每次对话 500 tokens = **86,400 次对话/天**

**商用能力**：
- ✅ 1000 用户/天 × 86 次对话 = 86,000 次 ✅
- ✅ 速度极快（300+ tokens/秒）
- ✅ 使用 Llama 3.3 70B（接近 GPT-4）

**成本**：
- 免费额度内：$0
- 超出后：$0.59/M tokens（输入）$0.79/M tokens（输出）

**API**：
```typescript
const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "llama-3.3-70b-versatile",
    messages: conversationHistory,
    temperature: 0.7,
    max_tokens: 500
  })
})
```

---

### 方案 B：Google Gemini 2.0 Flash（最大免费额度）

**免费额度**：
- **1,000,000 tokens/分钟**（RPM）
- **15 requests/分钟**（RPM）
- **1,500 requests/天**（RPD）

**计算**：
- 1,500 requests/天 × 2000 tokens/request = **3,000,000 tokens/天**
- 假设每次对话 500 tokens = **6,000 次对话/天**

**商用能力**：
- ✅ 500 用户/天 × 12 次对话 = 6,000 次 ✅
- ✅ 多模态支持（图片、视频）
- ✅ 长上下文（128k tokens）

**成本**：
- 免费额度内：$0
- 超出后：$0.075/M tokens（输入）$0.30/M tokens（输出）

**API**：
```typescript
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

const result = await model.generateContent({
  contents: [{ role: "user", parts: [{ text: userMessage }] }]
})
```

---

### 方案 C：自托管 Ollama + Llama 3.3（完全免费，无限制）

**免费额度**：
- **无限 tokens**
- **无限 requests**
- **完全本地运行**

**硬件要求**：
- **最低**：8GB RAM + CPU（Llama 3.2 3B）
- **推荐**：16GB RAM + GPU（Llama 3.3 8B）
- **最佳**：32GB RAM + GPU（Llama 3.3 70B）

**优势**：
- ✅ 完全免费，无任何限制
- ✅ 数据完全私密
- ✅ 可定制化 fine-tune
- ✅ 无网络延迟

**部署**：
```bash
# 安装 Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 下载模型
ollama pull llama3.3:8b

# 启动服务
ollama serve

# API 调用
curl http://localhost:11434/api/chat -d '{
  "model": "llama3.3:8b",
  "messages": [
    {"role": "user", "content": "我感到很焦虑"}
  ]
}'
```

**使用 Vercel + 外部 Ollama 服务器**：
1. 在独立服务器上运行 Ollama
2. 暴露 API 端点（使用 ngrok 或 Cloudflare Tunnel）
3. Vercel 调用外部 Ollama API

---

## 📊 三种方案对比

| 指标 | Groq | Gemini 2.0 Flash | Ollama (自托管) |
|------|------|------------------|-----------------|
| **免费额度** | 43M tokens/天 | 3M tokens/天 | 无限 |
| **商用能力** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **速度** | 极快（300 TPS） | 快 | 取决于硬件 |
| **质量** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **成本** | $0（免费额度内） | $0（免费额度内） | 硬件成本 |
| **数据隐私** | 发送到 Groq | 发送到 Google | 完全本地 |
| **部署难度** | 简单 | 简单 | 中等 |

---

## 🎯 推荐方案

### 小型应用（< 500 用户/天）
✅ **Groq API**
- 免费额度足够
- 速度极快
- 质量接近 GPT-4

### 中型应用（500-2000 用户/天）
✅ **Gemini 2.0 Flash**
- 免费额度较大
- 多模态支持
- 便宜的付费选项

### 大型应用（> 2000 用户/天）或需要隐私
✅ **Ollama 自托管**
- 无限制
- 完全免费
- 数据私密

### 混合方案（最佳）
✅ **Groq（主） + Ollama（备用）**
- 日常使用 Groq 免费额度
- 超出后自动切换到 Ollama
- 高峰期使用 Ollama

---

## 💻 实施示例（混合方案）

```typescript
// app/api/smart-chat/route.ts
import { NextRequest, NextResponse } from "next/server"

// 优先级队列
const LLM_PROVIDERS = [
  {
    name: "groq",
    maxTokensPerDay: 43_000_000,
    usedTokensToday: 0,  // 从 Redis/DB 读取
    call: async (messages) => {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages,
          temperature: 0.7,
          max_tokens: 500
        })
      })
      return response.json()
    }
  },
  {
    name: "gemini",
    maxTokensPerDay: 3_000_000,
    usedTokensToday: 0,
    call: async (messages) => {
      // Gemini API 调用
    }
  },
  {
    name: "ollama",
    maxTokensPerDay: Infinity,  // 无限
    usedTokensToday: 0,
    call: async (messages) => {
      const response = await fetch("http://your-ollama-server.com:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.3:8b",
          messages
        })
      })
      return response.json()
    }
  }
]

export async function POST(request: NextRequest) {
  const { messages } = await request.json()

  // 智能选择可用的 LLM
  for (const provider of LLM_PROVIDERS) {
    if (provider.usedTokensToday < provider.maxTokensPerDay) {
      try {
        const result = await provider.call(messages)

        // 更新使用量（保存到 Redis/DB）
        const tokensUsed = result.usage?.total_tokens || 500
        provider.usedTokensToday += tokensUsed

        console.log(`[Smart Chat] Used ${provider.name}, tokens: ${tokensUsed}`)

        return NextResponse.json(result)
      } catch (error) {
        console.error(`[Smart Chat] ${provider.name} failed:`, error)
        // 继续尝试下一个 provider
        continue
      }
    }
  }

  return NextResponse.json({ error: "All LLM providers exhausted" }, { status: 503 })
}
```

---

## 🔄 每日重置使用量

```typescript
// lib/llm-usage-tracker.ts
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
})

export async function getUsageToday(provider: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0]
  const key = `llm_usage:${provider}:${today}`
  const usage = await redis.get(key)
  return Number(usage) || 0
}

export async function incrementUsage(provider: string, tokens: number) {
  const today = new Date().toISOString().split('T')[0]
  const key = `llm_usage:${provider}:${today}`

  await redis.incrby(key, tokens)
  await redis.expire(key, 86400)  // 24小时后自动删除
}
```

---

## 📈 成本预估（1000 用户/天，每人 20 次对话）

| 方案 | 每日对话数 | Tokens/天 | 月成本 |
|------|-----------|-----------|--------|
| **Groq** | 20,000 | 10M | $0（免费额度内） |
| **Gemini** | 20,000 | 10M | $0（需要补充 Ollama） |
| **Ollama** | 无限 | 无限 | $0（硬件成本 ~$50/月 VPS） |
| **混合** | 无限 | 无限 | $0-50/月 |

---

## ✅ 最终推荐

**最佳商用方案**：**Groq（主） + Ollama（备用）**

1. **日常使用 Groq**：
   - 速度快（300 TPS）
   - 免费额度大（43M tokens/天）
   - 质量高（Llama 3.3 70B）

2. **高峰期/超额后使用 Ollama**：
   - 完全免费
   - 无限制
   - 数据私密

3. **成本**：
   - 小型应用：$0/月
   - 中型应用：$0-50/月（Ollama VPS）
   - 大型应用：$50-200/月（更强的 Ollama 服务器）

---

## 🚀 下一步

1. **立即注册 Groq API**：https://console.groq.com
2. **可选：部署 Ollama**（作为备用）
3. **实施智能 LLM 路由**（自动切换）

**这样您就有了一个真正可商用、成本极低的方案！** 🎉
