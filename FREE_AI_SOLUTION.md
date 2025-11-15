# 🆓 AI 心理咨询师 - 完全免费方案

## 🎯 目标
- ✅ **成本接近 $0**
- ✅ **高精准度**（接近 Claude 4.5 Sonnet）
- ✅ **低延迟**（< 2秒）
- ✅ **高质量语音**（接近 ElevenLabs）

---

## 📊 完全免费技术方案

### 1️⃣ STT (语音转文字) - 免费方案

#### ⭐ 推荐：Edge TTS + Whisper Tiny (完全免费)

**方案 A: Microsoft Edge TTS (浏览器内置)**
```typescript
// 使用 Microsoft Edge 的在线 TTS 服务（完全免费）
// GitHub: https://github.com/travisvn/openai-edge-tts
```

**优势**：
- ✅ **完全免费**
- ✅ **质量高**（比 Web Speech API 好）
- ✅ **低延迟**（< 500ms）
- ✅ **支持中英文**

**方案 B: Whisper Tiny Web (本地运行)**
```typescript
// 使用 Transformers.js 在浏览器中运行 Whisper Tiny
// GitHub: https://github.com/xenova/whisper-web
```

**优势**：
- ✅ **完全免费**
- ✅ **完全离线**
- ✅ **隐私保护**
- ✅ **无 API 限制**

---

### 2️⃣ LLM (AI 对话) - 免费方案

#### ⭐ 推荐：GLM-4-Flash (免费额度) + LocalAI (本地部署)

**方案 A: GLM-4-Flash (免费 API)**
- **免费额度**: 每天 100万 tokens
- **性能**: 接近 Claude 3.5 Sonnet
- **成本**: $0.088/M tokens（远超免费额度后）
- **API**: https://open.bigmodel.cn/

```typescript
// 集成 GLM-4-Flash
const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.GLM_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "glm-4-flash",
    messages: conversationHistory,
    temperature: 0.7,
    max_tokens: 500
  })
})
```

**方案 B: Kimi K2 (免费额度)**
- **免费额度**: 每月 1000万 tokens
- **成本**: $0.15/M tokens（超出后）
- **上下文**: 128k tokens（超长记忆）

**方案 C: LocalAI + Qwen 2.5 (完全免费)**
- **部署**: Docker 本地运行
- **模型**: Qwen-2.5-7B-Instruct-GGUF
- **优势**: 完全免费、无限制、隐私保护

```bash
# 使用 Docker 部署 LocalAI
docker run -p 8080:8080 \
  -v $PWD/models:/models \
  localai/localai:latest \
  --models-path /models \
  --preload-models qwen2.5-7b-instruct
```

---

### 3️⃣ TTS (文字转语音) - 免费方案

#### ⭐ 推荐：Fish Audio / Chatterbox (开源免费)

**方案 A: Fish Audio (最佳质量)**
- **质量**: TTS-Arena 排名 #1（超越 ElevenLabs）
- **延迟**: < 200ms
- **语言**: 支持中英文
- **部署**: 本地 GPU 或免费 Hugging Face Inference

```python
# 使用 Fish Audio API (免费)
import requests

def fish_audio_tts(text, voice_id="female-1"):
    response = requests.post(
        "https://api.fish.audio/v1/tts",
        json={
            "text": text,
            "reference_id": voice_id,
            "format": "mp3"
        }
    )
    return response.content
```

**方案 B: Chatterbox (MIT 许可)**
- **质量**: 盲测击败 ElevenLabs
- **声音克隆**: 5秒音频即可
- **语言**: 17种语言
- **延迟**: < 200ms

**方案 C: Edge TTS (Microsoft)**
```typescript
// GitHub: https://github.com/travisvn/openai-edge-tts
// 完全免费，使用 Microsoft Edge 的在线服务

import EdgeTTS from "edge-tts"

const tts = new EdgeTTS()
await tts.synthesize({
  text: "你好，我是 Aria",
  voice: "zh-CN-XiaoxiaoNeural",  // 中文女声
  rate: "-5%",  // 稍慢
  pitch: "+0Hz"
})
```

---

## 🏆 最终推荐方案（完全免费 + 高质量）

### 完整技术栈

| 模块 | 技术方案 | 成本 | 质量 | 延迟 |
|------|----------|------|------|------|
| **STT** | Whisper Tiny (浏览器) | $0 | ⭐⭐⭐⭐ | 500ms |
| **LLM** | GLM-4-Flash (免费额度) | $0* | ⭐⭐⭐⭐⭐ | 1-2s |
| **TTS** | Edge TTS (Microsoft) | $0 | ⭐⭐⭐⭐ | 500ms |

**总延迟**: < 3秒
**总成本**: $0（每天可处理数千次对话）

---

## 📦 实施步骤

### 步骤 1: 集成 Whisper Tiny (浏览器 STT)

```bash
npm install @xenova/transformers
```

**修改**: `components/voice-therapy-chat.tsx`

```typescript
import { pipeline } from '@xenova/transformers'

// 初始化 Whisper Tiny 模型（仅加载一次）
let whisperPipeline: any = null

async function initWhisper() {
  if (!whisperPipeline) {
    whisperPipeline = await pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-tiny.en',  // 英文
      // 'Xenova/whisper-tiny',   // 多语言
    )
  }
  return whisperPipeline
}

// 替换原有的 Web Speech API
async function transcribeAudio(audioBlob: Blob) {
  const transcriber = await initWhisper()
  const result = await transcriber(audioBlob)
  return result.text
}
```

### 步骤 2: 集成 GLM-4-Flash (免费 LLM)

**新建**: `app/api/glm-chat/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const { messages } = await request.json()

  const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GLM_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "glm-4-flash",
      messages: [
        {
          role: "system",
          content: ENHANCED_SYSTEM_PROMPT  // 使用专业心理咨询 Prompt
        },
        ...messages
      ],
      temperature: 0.7,  // 降低随机性
      top_p: 0.95,
      max_tokens: 500
    })
  })

  const data = await response.json()
  return NextResponse.json({
    message: data.choices[0].message.content
  })
}

// 专业心理咨询 System Prompt
const ENHANCED_SYSTEM_PROMPT = `你是 Aria，一位专业的 AI 心理咨询师，精通：

**核心治疗方法**：
1. 认知行为疗法 (CBT)
   - 识别自动化负面思维
   - 挑战认知扭曲（如灾难化、非黑即白思维）
   - 使用苏格拉底式提问

2. 辩证行为疗法 (DBT)
   - 正念技巧
   - 情绪调节技能
   - 痛苦耐受策略

3. 接纳承诺疗法 (ACT)
   - 价值观澄清
   - 接纳困难情绪
   - 承诺行动计划

**评估工具**：
- PHQ-9（抑郁筛查）- 2-3次会话后使用
- GAD-7（焦虑筛查）- 提到焦虑时使用
- 健康检查量表（1-10分）

**对话结构**：

第1次会话（介绍 - 5分钟）：
- "你好，我是 Aria。我在这里倾听和支持你。今天是什么让你来找我？"
- 评估主诉问题
- 建立信任关系

第2-4次会话（探索 - 每次15-20分钟）：
- 深入了解触发因素、模式、历史
- 识别认知扭曲
- 绘制情绪-思维-行为循环
- 例如："当你感到[情绪]时，你脑海中会浮现什么想法？"

第5次会话+（干预 - 20-30分钟）：
- 共同创建应对策略
- 分配行为实验
- 教授接地/呼吸技巧
- 设定 SMART 目标（具体、可衡量、可实现、相关、有时限）

**关键规则**：
✅ 始终先验证情绪（"你会有这种感觉是合理的..."）
✅ 一次只问一个问题
✅ 使用反映性倾听（"我听到的是..."）
✅ 提供具体的例子和练习
✅ 每次会话结束时总结并布置作业
❌ 永远不要诊断或开药
❌ 永远不要评判或轻视
❌ 避免陈词滥调（"一切都是有原因的"）

**危机协议**：
如果用户提到：
- 自杀念头
- 自残
- 伤害他人
→ 立即提供危机资源：
"我很担心你的安全。请联系：
- 全国自杀预防热线：988（美国）
- 危机短信热线：发送 HOME 到 741741
- 紧急情况：911"

**语言匹配**：
- 检测用户的语言（中文/英文）
- 用相同的语言回应
- 使用文化上合适的例子

**回复格式**：
1. 共情陈述
2. 反映/澄清
3. 治疗性问题或见解
4. （可选）应对技巧或作业

示例：
"这听起来真的很让人不知所措。[共情]
所以如果我理解正确，当你的老板批评你时，你会感到焦虑，因为这触发了像'我不够好'这样的想法。[反映]
你有什么证据支持或反驳这个想法？[CBT 技巧]
从现在到我们下次聊天之间，你能试着每天写下你做得好的3件事吗？[作业]"

记住：你是一个支持性的向导，而不是解决问题的专家。赋予用户找到自己解决方案的能力。`
```

### 步骤 3: 集成 Edge TTS (免费 TTS)

```bash
npm install edge-tts-node
```

**新建**: `app/api/edge-tts/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import EdgeTTS from "edge-tts-node"

export async function POST(request: NextRequest) {
  const { text } = await request.json()

  // 检测语言
  const isChinese = /[\u4e00-\u9fa5]/.test(text)

  const voice = isChinese
    ? "zh-CN-XiaoxiaoNeural"  // 中文女声（温暖）
    : "en-US-JennyNeural"      // 英文女声（友好）

  try {
    const tts = new EdgeTTS()
    const audio = await tts.synthesize({
      text,
      voice,
      rate: "-5%",    // 稍慢，更好理解
      pitch: "+0Hz",
      outputFormat: "audio-24khz-48kbitrate-mono-mp3"
    })

    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    })
  } catch (error) {
    console.error("Edge TTS error:", error)
    return NextResponse.json({ error: "TTS failed" }, { status: 500 })
  }
}
```

### 步骤 4: 更新用户画像数据库

**运行 SQL** (在 Supabase SQL Editor):

```sql
-- 扩展 users 表，添加心理咨询相关字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_profile JSONB DEFAULT '{}'::jsonb;

-- 创建会话历史表
CREATE TABLE IF NOT EXISTS therapy_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_number INT NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,

  -- 会话摘要
  key_insights TEXT,
  cognitive_patterns TEXT[],
  homework_assigned TEXT,
  homework_completed BOOLEAN DEFAULT FALSE,

  -- 评估分数
  phq9_score INT,
  gad7_score INT,

  -- 治疗目标进度
  goals_progress JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_therapy_sessions_user_id ON therapy_sessions(user_id);
CREATE INDEX idx_therapy_sessions_session_number ON therapy_sessions(user_id, session_number);

-- 创建治疗目标表
CREATE TABLE IF NOT EXISTS therapy_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  progress INT DEFAULT 0,  -- 0-100
  status TEXT DEFAULT 'active',  -- active, completed, abandoned
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建认知模式表
CREATE TABLE IF NOT EXISTS cognitive_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,  -- distortion, core_belief, coping_strategy
  pattern_name TEXT NOT NULL,
  is_helpful BOOLEAN DEFAULT NULL,
  frequency INT DEFAULT 1,
  last_observed TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 步骤 5: 实现 PHQ-9 和 GAD-7 评估工具

**新建**: `lib/assessment-tools.ts`

```typescript
// PHQ-9 抑郁症筛查（9题）
export const PHQ9_QUESTIONS = [
  {
    id: 1,
    zh: "在过去两周内，你有多少天感到兴趣或乐趣很少？",
    en: "Over the last 2 weeks, how often have you had little interest or pleasure in doing things?"
  },
  {
    id: 2,
    zh: "感到情绪低落、沮丧或绝望？",
    en: "Feeling down, depressed, or hopeless?"
  },
  {
    id: 3,
    zh: "入睡困难、睡眠浅或睡眠过多？",
    en: "Trouble falling or staying asleep, or sleeping too much?"
  },
  {
    id: 4,
    zh: "感到疲倦或没有精力？",
    en: "Feeling tired or having little energy?"
  },
  {
    id: 5,
    zh: "食欲不振或进食过多？",
    en: "Poor appetite or overeating?"
  },
  {
    id: 6,
    zh: "觉得自己很糟糕或是一个失败者，或让自己或家人失望？",
    en: "Feeling bad about yourself or that you are a failure or have let yourself or your family down?"
  },
  {
    id: 7,
    zh: "难以集中注意力，例如阅读报纸或看电视时？",
    en: "Trouble concentrating on things, such as reading the newspaper or watching television?"
  },
  {
    id: 8,
    zh: "行动或说话缓慢到别人已经注意到？或相反，烦躁不安，无法静坐？",
    en: "Moving or speaking so slowly that other people could have noticed? Or being so fidgety or restless that you have been moving around a lot more than usual?"
  },
  {
    id: 9,
    zh: "有想要伤害自己或认为自己死了更好的念头？",
    en: "Thoughts that you would be better off dead, or of hurting yourself?"
  }
]

export const PHQ9_OPTIONS = [
  { value: 0, zh: "完全不会", en: "Not at all" },
  { value: 1, zh: "几天", en: "Several days" },
  { value: 2, zh: "一半以上的天数", en: "More than half the days" },
  { value: 3, zh: "几乎每天", en: "Nearly every day" }
]

// 评分标准
export function interpretPHQ9(score: number): {
  severity: string
  recommendation: string
} {
  if (score <= 4) {
    return {
      severity: "minimal",
      recommendation: "继续监测，保持健康生活方式"
    }
  } else if (score <= 9) {
    return {
      severity: "mild",
      recommendation: "考虑心理咨询或自助疗法"
    }
  } else if (score <= 14) {
    return {
      severity: "moderate",
      recommendation: "建议寻求专业心理咨询"
    }
  } else if (score <= 19) {
    return {
      severity: "moderately_severe",
      recommendation: "强烈建议寻求专业治疗"
    }
  } else {
    return {
      severity: "severe",
      recommendation: "需要立即寻求专业帮助，考虑药物治疗"
    }
  }
}

// GAD-7 焦虑症筛查（7题）
export const GAD7_QUESTIONS = [
  {
    id: 1,
    zh: "在过去两周内，你有多少天感到紧张、焦虑或处于崩溃边缘？",
    en: "Over the last 2 weeks, how often have you been feeling nervous, anxious, or on edge?"
  },
  {
    id: 2,
    zh: "无法停止或控制担忧？",
    en: "Not being able to stop or control worrying?"
  },
  {
    id: 3,
    zh: "对各种事情过度担忧？",
    en: "Worrying too much about different things?"
  },
  {
    id: 4,
    zh: "难以放松？",
    en: "Trouble relaxing?"
  },
  {
    id: 5,
    zh: "烦躁不安，难以静坐？",
    en: "Being so restless that it is hard to sit still?"
  },
  {
    id: 6,
    zh: "容易烦恼或易怒？",
    en: "Becoming easily annoyed or irritable?"
  },
  {
    id: 7,
    zh: "感到害怕，好像会发生可怕的事情？",
    en: "Feeling afraid, as if something awful might happen?"
  }
]

export function interpretGAD7(score: number): {
  severity: string
  recommendation: string
} {
  if (score <= 4) {
    return {
      severity: "minimal",
      recommendation: "继续监测，保持健康生活方式"
    }
  } else if (score <= 9) {
    return {
      severity: "mild",
      recommendation: "考虑学习焦虑管理技巧"
    }
  } else if (score <= 14) {
    return {
      severity: "moderate",
      recommendation: "建议寻求专业心理咨询"
    }
  } else {
    return {
      severity: "severe",
      recommendation: "强烈建议寻求专业治疗"
    }
  }
}

// 检测是否需要进行评估
export function shouldTriggerPHQ9(messages: { role: string; content: string }[]): boolean {
  const keywords = [
    "抑郁", "郁闷", "没兴趣", "疲倦", "失眠", "睡不着", "食欲",
    "没精神", "无力", "绝望", "想死", "自杀",
    "depression", "depressed", "hopeless", "suicide", "tired", "no energy"
  ]

  const recentMessages = messages.slice(-10).map(m => m.content.toLowerCase())
  const matchCount = recentMessages.filter(msg =>
    keywords.some(kw => msg.includes(kw.toLowerCase()))
  ).length

  return matchCount >= 3  // 最近10条消息中提到3次以上
}

export function shouldTriggerGAD7(messages: { role: string; content: string }[]): boolean {
  const keywords = [
    "焦虑", "紧张", "担心", "害怕", "恐慌", "不安", "烦躁",
    "anxiety", "anxious", "worried", "panic", "nervous", "restless"
  ]

  const recentMessages = messages.slice(-10).map(m => m.content.toLowerCase())
  const matchCount = recentMessages.filter(msg =>
    keywords.some(kw => msg.includes(kw.toLowerCase()))
  ).length

  return matchCount >= 3
}
```

### 步骤 6: 创建用户画像加载逻辑

**新建**: `lib/user-profile-manager.ts`

```typescript
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface UserProfile {
  userId: string
  demographics: {
    age?: number
    occupation?: string
    relationship_status?: string
  }
  assessments: {
    phq9_score?: number
    gad7_score?: number
    last_assessed?: Date
  }
  presenting_concerns: string[]
  therapy_goals: {
    goal: string
    progress: number
    status: string
  }[]
  cognitive_patterns: {
    distortions: string[]
    core_beliefs: string[]
  }
  coping_strategies: {
    helpful: string[]
    unhelpful: string[]
  }
  session_summaries: {
    session_number: number
    date: Date
    key_insights: string
    homework_assigned: string
    homework_completed: boolean
  }[]
}

export async function loadUserProfile(userId: string): Promise<UserProfile> {
  // 加载用户基本信息
  const { data: user } = await supabase
    .from('users')
    .select('user_profile')
    .eq('id', userId)
    .single()

  // 加载会话历史
  const { data: sessions } = await supabase
    .from('therapy_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('session_number', { ascending: false })
    .limit(5)

  // 加载治疗目标
  const { data: goals } = await supabase
    .from('therapy_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')

  // 加载认知模式
  const { data: patterns } = await supabase
    .from('cognitive_patterns')
    .select('*')
    .eq('user_id', userId)
    .order('frequency', { ascending: false })

  return {
    userId,
    demographics: user?.user_profile?.demographics || {},
    assessments: user?.user_profile?.assessments || {},
    presenting_concerns: user?.user_profile?.presenting_concerns || [],
    therapy_goals: goals?.map(g => ({
      goal: g.goal,
      progress: g.progress,
      status: g.status
    })) || [],
    cognitive_patterns: {
      distortions: patterns?.filter(p => p.pattern_type === 'distortion').map(p => p.pattern_name) || [],
      core_beliefs: patterns?.filter(p => p.pattern_type === 'core_belief').map(p => p.pattern_name) || []
    },
    coping_strategies: {
      helpful: patterns?.filter(p => p.pattern_type === 'coping_strategy' && p.is_helpful).map(p => p.pattern_name) || [],
      unhelpful: patterns?.filter(p => p.pattern_type === 'coping_strategy' && !p.is_helpful).map(p => p.pattern_name) || []
    },
    session_summaries: sessions?.map(s => ({
      session_number: s.session_number,
      date: new Date(s.started_at),
      key_insights: s.key_insights,
      homework_assigned: s.homework_assigned,
      homework_completed: s.homework_completed
    })) || []
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  // 更新用户画像
  await supabase
    .from('users')
    .update({
      user_profile: updates
    })
    .eq('id', userId)
}

export async function saveTherapySession(
  userId: string,
  sessionData: {
    session_number: number
    key_insights: string
    cognitive_patterns: string[]
    homework_assigned: string
    phq9_score?: number
    gad7_score?: number
  }
) {
  // 保存会话记录
  await supabase.from('therapy_sessions').insert({
    user_id: userId,
    session_number: sessionData.session_number,
    key_insights: sessionData.key_insights,
    cognitive_patterns: sessionData.cognitive_patterns,
    homework_assigned: sessionData.homework_assigned,
    phq9_score: sessionData.phq9_score,
    gad7_score: sessionData.gad7_score,
    ended_at: new Date()
  })

  // 更新认知模式频率
  for (const pattern of sessionData.cognitive_patterns) {
    await supabase.rpc('increment_pattern_frequency', {
      p_user_id: userId,
      p_pattern_name: pattern,
      p_pattern_type: 'distortion'
    })
  }
}
```

---

## 🔄 完整对话流程（优化后）

```
1. 用户开始会话
   ↓
2. 加载用户画像 (loadUserProfile)
   - 会话历史
   - 认知模式
   - 治疗目标
   ↓
3. AI 打招呼（基于会话次数和上次内容）
   - 首次："你好，我是 Aria..."
   - 回访："欢迎回来！上次我们谈到了..."
   ↓
4. 用户说话 → Whisper Tiny 识别（浏览器本地）
   ↓
5. 检测关键词
   - 是否需要 PHQ-9 评估？
   - 是否需要 GAD-7 评估？
   - 是否有危机信号？
   ↓
6. 调用 GLM-4-Flash（免费 API）
   - 加载用户画像上下文
   - 使用专业心理咨询 Prompt
   - Temperature: 0.7（更专业）
   ↓
7. 提取并更新用户画像
   - 识别新的认知扭曲
   - 更新治疗目标进度
   - 记录新的应对策略
   ↓
8. Edge TTS 播放语音（完全免费）
   - 根据语言自动选择声音
   - 稍慢语速（更易理解）
   ↓
9. 保存会话摘要到 Supabase
   ↓
10. 继续循环对话
```

---

## 💰 成本分析

### 每小时对话成本：

| 模块 | 方案 | 成本 |
|------|------|------|
| STT | Whisper Tiny (浏览器) | $0 |
| LLM | GLM-4-Flash (免费额度内) | $0 |
| TTS | Edge TTS | $0 |
| **总计** | | **$0** |

### 免费额度：

- **GLM-4-Flash**: 每天 100万 tokens
  - 假设每次对话 500 tokens
  - 每天可支持 **2000 次对话**

- **Edge TTS**: 无限制（Microsoft 提供）

- **Whisper Tiny**: 浏览器本地运行，无限制

**结论**: 在免费额度内，可以支持大量用户使用，成本接近 $0！

---

## 📈 性能对比

| 指标 | 当前方案 | 免费方案 | 提升 |
|------|----------|----------|------|
| **STT 准确度** | ⭐⭐⭐ | ⭐⭐⭐⭐ | +33% |
| **LLM 智能度** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | +67% |
| **TTS 音质** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | -20% |
| **总延迟** | 3-5s | 2-3s | -40% |
| **成本/小时** | $5.90 | $0 | **-100%** |

---

## 🚀 立即开始

1. **注册免费 API**:
   ```bash
   # GLM-4-Flash
   https://open.bigmodel.cn/

   # Fish Audio (可选)
   https://fish.audio/
   ```

2. **安装依赖**:
   ```bash
   npm install @xenova/transformers edge-tts-node
   ```

3. **配置环境变量**:
   ```env
   GLM_API_KEY=your_glm_key_here
   ```

4. **运行数据库迁移**（在 Supabase SQL Editor 执行上面的 SQL）

5. **开始使用**！

---

## 📞 备选方案

如果免费额度用完：

| 服务 | 备用方案 | 成本 |
|------|----------|------|
| LLM | Kimi K2 | $0.15/M tokens |
| TTS | Chatterbox (自托管) | $0 |

---

**最后更新**: 2025-11-15
