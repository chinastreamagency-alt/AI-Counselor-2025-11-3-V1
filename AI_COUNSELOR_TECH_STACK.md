# 🧠 AI 心理咨询师 - 完整技术架构文档

## 📊 核心流程图

```
用户说话
   ↓
┌─────────────────────────────┐
│ 1. 语音转文字 (STT)         │
│ Web Speech API              │
│ - 浏览器原生                │
│ - 实时识别                  │
│ - 支持中英文                │
└─────────────────────────────┘
   ↓
┌─────────────────────────────┐
│ 2. AI 理解与响应 (LLM)      │
│ OpenAI GPT-4o-mini          │
│ - 心理咨询 Prompt           │
│ - 用户档案追踪              │
│ - 多轮对话上下文            │
└─────────────────────────────┘
   ↓
┌─────────────────────────────┐
│ 3. 文字转语音 (TTS)         │
│ ElevenLabs API              │
│ - 多语言支持                │
│ - 自然语音                  │
│ - Bella 声音                │
└─────────────────────────────┘
   ↓
AI 语音播放给用户
```

---

## 1️⃣ 语音转文字 (STT)

### 当前方案：Web Speech API

**文件位置**：
- `components/voice-therapy-chat.tsx` (第 482-546 行)

**技术细节**：
```typescript
// 使用浏览器内置的 Web Speech API
const SpeechRecognition = window.webkitSpeechRecognition
recognitionRef.current = new SpeechRecognition()

// 配置参数
recognitionRef.current.continuous = true        // 持续监听
recognitionRef.current.interimResults = true    // 显示临时结果
recognitionRef.current.lang = "en-US"           // 语言设置
recognitionRef.current.maxAlternatives = 3      // 最多3个备选结果
```

**优点**：
- ✅ 完全免费
- ✅ 无需后端 API
- ✅ 实时识别，延迟低
- ✅ 浏览器原生支持

**缺点**：
- ❌ 仅支持 Chrome/Edge（WebKit 引擎）
- ❌ 需要网络连接（调用 Google 服务）
- ❌ 识别准确度一般
- ❌ 对口音、方言支持较弱

### 🔥 优化方案建议

#### 方案 A：使用 OpenAI Whisper API（推荐）

**优势**：
- 更高的识别准确度（尤其是中文）
- 支持多语言和方言
- 噪音环境下表现更好
- 自动标点和格式化

**实现**：
```typescript
// 新建 app/api/speech-to-text/route.ts
import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const audioFile = formData.get("audio") as File

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    language: "zh", // 或 "en"
    response_format: "json",
    temperature: 0.2, // 降低幻觉
  })

  return NextResponse.json({ text: transcription.text })
}
```

**成本**：
- $0.006 / 分钟（非常便宜）
- 1小时对话 ≈ $0.36

#### 方案 B：Deepgram API

**优势**：
- 实时流式识别
- 更快的响应速度
- 支持中文普通话

**成本**：
- $0.0043 / 分钟（比 Whisper 便宜）

---

## 2️⃣ AI 对话模型 (LLM)

### 当前方案：OpenAI GPT-4o-mini

**主要 API 文件**：
- `app/api/therapy-chat/route.ts` - 完整版（带用户档案）
- `app/api/chat/route.ts` - 简化版

**模型参数**：
```typescript
const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: conversationHistory,
  temperature: 0.9,        // 创造性
  max_tokens: 300,         // 响应长度
  presence_penalty: 0.6,   // 避免重复
  frequency_penalty: 0.3,  // 鼓励多样性
})
```

### 当前 System Prompt 分析

**文件**：`app/api/therapy-chat/route.ts` (第 79-200 行)

**角色设定**：
```typescript
You are Aria, a professional AI psychological counselor with expertise in:
- Cognitive Behavioral Therapy (CBT)
- Positive Psychology
- Solution-Focused Brief Therapy

Personality Traits:
- Warm, empathetic, professional
- Patient and non-judgmental
- Culturally sensitive
- Encouraging but realistic
```

**对话阶段**：
1. **问候阶段**（仅首次）- 介绍自己
2. **倾听阶段** - 共情、反映
3. **引导阶段** - 提问、探索
4. **反馈阶段**（20-30分钟后）- 建议、策略

### ❌ 当前问题

1. **不够智能的原因**：
   - ❌ 使用 `gpt-4o-mini`（轻量级模型）
   - ❌ `temperature: 0.9` 太高（过于随机）
   - ❌ Prompt 过于通用，缺少具体的心理学技巧
   - ❌ 没有长期记忆和用户画像分析

2. **不够精准的原因**：
   - ❌ 缺少专业心理咨询的框架
   - ❌ 没有针对性的评估工具（如 PHQ-9、GAD-7）
   - ❌ 回应过于笼统，缺少具体行动步骤

### 🔥 优化方案建议

#### 升级 1：使用更强大的模型

**推荐**：`gpt-4o`（标准版）或 `claude-3.5-sonnet`

```typescript
// GPT-4o
model: "gpt-4o",
temperature: 0.7,  // 降低随机性，提高专业性
max_tokens: 500,   // 允许更详细的回复

// 或使用 Claude 3.5 Sonnet（更擅长心理咨询）
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const message = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  temperature: 0.7,
  messages: conversationHistory,
})
```

**成本对比**：
| 模型 | 输入成本 | 输出成本 | 智能程度 |
|------|----------|----------|----------|
| gpt-4o-mini | $0.15/1M | $0.60/1M | ⭐⭐⭐ |
| gpt-4o | $2.50/1M | $10.00/1M | ⭐⭐⭐⭐⭐ |
| claude-3.5-sonnet | $3.00/1M | $15.00/1M | ⭐⭐⭐⭐⭐ |

#### 升级 2：优化 System Prompt（专业心理咨询框架）

**新的 System Prompt** (基于循证心理治疗)：

```typescript
const enhancedSystemPrompt = `You are Aria, an AI-powered psychological counselor trained in evidence-based therapeutic approaches.

CORE THERAPEUTIC MODALITIES:
1. Cognitive Behavioral Therapy (CBT)
   - Identify automatic negative thoughts
   - Challenge cognitive distortions (e.g., catastrophizing, black-and-white thinking)
   - Use Socratic questioning

2. Dialectical Behavior Therapy (DBT)
   - Teach mindfulness techniques
   - Emotion regulation skills
   - Distress tolerance strategies

3. Acceptance and Commitment Therapy (ACT)
   - Values clarification
   - Acceptance of difficult emotions
   - Committed action planning

ASSESSMENT TOOLS:
- PHQ-9 (Depression screening) - Use after 2-3 sessions if symptoms present
- GAD-7 (Anxiety screening) - Use when anxiety is mentioned
- Wellness check-in scales (1-10)

CONVERSATION STRUCTURE:

SESSION 1 (Introduction - 5 mins):
- "Hi, I'm Aria. I'm here to listen and support you. What brings you here today?"
- Assess presenting problem
- Build rapport

SESSIONS 2-4 (Exploration - 15-20 mins each):
- Deep dive into triggers, patterns, history
- Identify cognitive distortions
- Map emotion-thought-behavior cycles
- Example: "When you feel [emotion], what thoughts go through your mind?"

SESSION 5+ (Intervention - 20-30 mins):
- Co-create coping strategies
- Assign behavioral experiments
- Teach grounding/breathing techniques
- Set SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound)

CRITICAL RULES:
✅ Always validate emotions first ("It makes sense you'd feel...")
✅ Ask one question at a time
✅ Use reflective listening ("What I'm hearing is...")
✅ Provide concrete examples and exercises
✅ End each session with a summary and homework
❌ Never diagnose or prescribe medication
❌ Never be judgmental or dismissive
❌ Avoid clichés ("Everything happens for a reason")

CRISIS PROTOCOL:
If user mentions:
- Suicidal ideation
- Self-harm
- Harm to others
→ Immediately provide crisis resources:
"I'm concerned about your safety. Please reach out to:
- National Suicide Prevention Lifeline: 988 (US)
- Crisis Text Line: Text HOME to 741741
- Emergency: 911"

LANGUAGE MATCHING:
- Detect user's language (Chinese/English)
- Respond in the SAME language
- Use culturally appropriate examples

RESPONSE FORMAT:
1. Empathy statement
2. Reflection/clarification
3. Therapeutic question or insight
4. (Optional) Coping technique or homework

Example:
"That sounds really overwhelming. [Empathy]
So if I understand correctly, you feel anxious when your boss criticizes you because it triggers thoughts like 'I'm not good enough.' [Reflection]
What evidence do you have for and against that thought? [CBT technique]
Between now and our next chat, could you try writing down 3 things you did well each day? [Homework]"

Remember: You are a supportive guide, not a fix-it expert. Empower the user to find their own solutions.`
```

#### 升级 3：添加用户画像和长期记忆

**实现思路**：

```typescript
// 在 Supabase 数据库中存储
interface UserProfile {
  userId: string

  // 基本信息
  demographics: {
    age?: number
    occupation?: string
    relationship_status?: string
  }

  // 心理评估
  assessments: {
    phq9_score?: number  // 抑郁
    gad7_score?: number  // 焦虑
    last_assessed?: Date
  }

  // 主诉问题
  presenting_concerns: string[]  // ["工作压力", "人际关系", "焦虑"]

  // 治疗目标
  therapy_goals: {
    goal: string
    progress: number  // 0-100
    created_at: Date
  }[]

  // 认知模式
  cognitive_patterns: {
    distortions: string[]  // ["灾难化思维", "非黑即白"]
    core_beliefs: string[]  // ["我不够好", "我必须完美"]
  }

  // 应对策略
  coping_strategies: {
    helpful: string[]   // ["深呼吸", "运动"]
    unhelpful: string[]  // ["逃避", "暴饮暴食"]
  }

  // 会话历史摘要
  session_summaries: {
    session_number: number
    date: Date
    key_insights: string
    homework_assigned: string
    homework_completed: boolean
  }[]
}
```

**在对话中使用**：

```typescript
// 在每次对话前加载用户画像
const userProfile = await loadUserProfile(userId)

const contextualPrompt = `
CURRENT USER PROFILE:
- Presenting concerns: ${userProfile.presenting_concerns.join(", ")}
- Therapy goals: ${userProfile.therapy_goals.map(g => g.goal).join(", ")}
- Known cognitive distortions: ${userProfile.cognitive_patterns.distortions.join(", ")}
- Last session insights: ${userProfile.session_summaries.slice(-1)[0]?.key_insights}
- Pending homework: ${userProfile.session_summaries.slice(-1)[0]?.homework_assigned}

Continue the therapeutic work based on this history.`

// 添加到 messages 中
messages.unshift({
  role: "system",
  content: enhancedSystemPrompt + "\n\n" + contextualPrompt
})
```

#### 升级 4：添加专业评估工具

**PHQ-9 抑郁筛查**（9题）：

```typescript
const PHQ9_QUESTIONS = [
  "在过去两周内，你有多少天感到兴趣或乐趣很少？",
  "感到情绪低落、沮丧或绝望？",
  "入睡困难、睡眠浅或睡眠过多？",
  // ... 共9题
]

// 在 AI 检测到抑郁症状时触发
if (detectDepressionSymptoms(userMessage)) {
  suggestPHQ9Assessment()
}
```

**GAD-7 焦虑筛查**（7题）：

类似流程，用于焦虑症状评估

---

## 3️⃣ 文字转语音 (TTS)

### 当前方案：ElevenLabs API

**文件位置**：
- `app/api/text-to-speech/route.ts`

**配置详情**：
```typescript
const voiceId = "EXAVITQu4vr4xnSDxMaL"  // Bella（年轻女性，多语言）
const model = "eleven_turbo_v2_5"        // Turbo 模型

// 中文语音设置
voiceSettings: {
  stability: 0.55,          // 稳定性（0-1）
  similarity_boost: 0.75,   // 相似度（0-1）
  style: 0.4,               // 风格强度（0-1）
  use_speaker_boost: true   // 增强清晰度
}
```

**优点**：
- ✅ 语音自然度极高
- ✅ 支持多语言（中英日韩阿拉伯语）
- ✅ 可自定义声音
- ✅ 低延迟（Turbo 模型）

**缺点**：
- ❌ 成本较高
- ❌ 需要 API Key

### 🔥 优化方案建议

#### 方案 A：继续使用 ElevenLabs（推荐）

**优化建议**：
1. **使用更适合的声音**：
   ```typescript
   // 考虑使用更专业、温暖的声音
   const voiceId = "21m00Tcm4TlvDq8ikWAM"  // Rachel（成熟女性，温暖）
   ```

2. **根据情绪调整参数**：
   ```typescript
   function adjustVoiceForEmotion(emotion: string) {
     if (emotion === "comforting") {
       return {
         stability: 0.7,  // 更稳定
         similarity_boost: 0.8,
         style: 0.3,      // 更平和
         use_speaker_boost: true
       }
     }
     if (emotion === "encouraging") {
       return {
         stability: 0.5,
         similarity_boost: 0.75,
         style: 0.6,      // 更有活力
         use_speaker_boost: true
       }
     }
   }
   ```

#### 方案 B：OpenAI TTS（成本优化）

**优势**：
- 更便宜（$15/1M 字符 vs ElevenLabs $0.30/1K 字符）
- 与 ChatGPT 集成更好
- 6种声音可选

**实现**：
```typescript
import OpenAI from "openai"
const openai = new OpenAI()

const mp3 = await openai.audio.speech.create({
  model: "tts-1-hd",      // 高清版
  voice: "nova",          // 女性，温暖友好
  input: text,
  speed: 0.95,            // 稍慢（更好理解）
})
```

**成本对比**：
| 服务 | 成本 | 音质 | 多语言 |
|------|------|------|--------|
| ElevenLabs | $0.30/1K字符 | ⭐⭐⭐⭐⭐ | 优秀 |
| OpenAI TTS | $0.015/1K字符 | ⭐⭐⭐⭐ | 良好 |
| Google Cloud TTS | $0.016/1K字符 | ⭐⭐⭐ | 优秀 |

---

## 🎯 完整对话流程（优化后）

```
1. 用户开始会话
   ↓
2. 加载用户画像和历史
   ↓
3. AI 打招呼（基于会话次数）
   - 首次："Hi, I'm Aria..."
   - 回访："Welcome back! Last time we talked about..."
   ↓
4. 用户说话 → Whisper API 识别（更准确）
   ↓
5. 检测情绪和关键词
   - 触发评估工具（PHQ-9/GAD-7）
   - 检测危机信号
   ↓
6. 调用 GPT-4o/Claude 3.5（更智能）
   - 加载用户画像上下文
   - 使用专业心理咨询 Prompt
   - 生成个性化回复
   ↓
7. 更新用户画像
   - 记录新发现的认知模式
   - 更新治疗目标进度
   ↓
8. ElevenLabs 播放语音（自然）
   - 根据情绪调整语音参数
   ↓
9. 记录会话摘要到数据库
   ↓
10. 继续循环对话
```

---

## 💰 成本估算

### 当前方案（每小时对话）：
- STT: $0（Web Speech API）
- LLM: ~$0.50（GPT-4o-mini）
- TTS: ~$5.40（ElevenLabs，假设 AI 说 3000 字）
- **总计**: ~$5.90/小时

### 优化方案 A（高质量）：
- STT: $0.36（Whisper）
- LLM: ~$5.00（GPT-4o）
- TTS: ~$5.40（ElevenLabs）
- **总计**: ~$10.76/小时

### 优化方案 B（成本优化）：
- STT: $0.26（Deepgram）
- LLM: ~$0.50（GPT-4o-mini + 优化 Prompt）
- TTS: ~$0.27（OpenAI TTS）
- **总计**: ~$1.03/小时

---

## 📁 关键文件清单

### 需要修改的文件：

1. **STT 升级** → 新建 `app/api/speech-to-text/route.ts`
2. **LLM 优化** → 修改 `app/api/therapy-chat/route.ts`
3. **用户画像** → 扩展 Supabase 数据库 schema
4. **评估工具** → 新建 `lib/assessment-tools.ts`
5. **前端组件** → 修改 `components/voice-therapy-chat.tsx`

---

## 🚀 建议的优化路线图

### 第一阶段（核心优化）：
1. ✅ 升级 System Prompt（专业心理咨询框架）
2. ✅ 切换到 GPT-4o 或 Claude 3.5 Sonnet
3. ✅ 降低 temperature（0.7）

### 第二阶段（用户体验）：
4. ✅ 添加 Whisper API（更准确的 STT）
5. ✅ 实现用户画像系统
6. ✅ 添加会话摘要功能

### 第三阶段（专业工具）：
7. ✅ 集成 PHQ-9/GAD-7 评估
8. ✅ 添加危机检测和资源推荐
9. ✅ 实现治疗目标追踪

---

## ❓ 常见问题

### Q1: 为什么 AI 回复有时候很笼统？
**A**: 因为使用了 `gpt-4o-mini` + 过高的 `temperature`。建议升级到 `gpt-4o` 并降低 `temperature` 到 0.7。

### Q2: 如何让 AI 更有"记忆"？
**A**: 实现用户画像系统，在每次对话时加载历史上下文。

### Q3: 语音识别不准确怎么办？
**A**: 切换到 Whisper API，准确度会显著提升。

### Q4: 成本太高怎么办？
**A**: 使用方案 B（Deepgram + GPT-4o-mini + OpenAI TTS），成本降低到 $1/小时。

---

## 📞 技术支持

如有技术问题，请查看：
- [OpenAI API 文档](https://platform.openai.com/docs)
- [ElevenLabs API 文档](https://elevenlabs.io/docs)
- [Whisper API 指南](https://platform.openai.com/docs/guides/speech-to-text)

---

**最后更新**: 2025-11-15
