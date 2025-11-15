# 🎙️ AI 心理咨询师 - 语音交互优化方案

## 问题描述

当前语音交互存在 3 个关键问题：

1. **AI 过早打断用户**：用户停顿思考时，AI 就抢话
2. **AI 延迟响应**：用户说完后，AI 没有及时回应
3. **无法处理用户打断**：用户想打断 AI 时无法实现

## 核心技术：Voice Activity Detection (VAD)

### 什么是 VAD？

VAD（语音活动检测）是一种判断音频中是否有人说话的技术。它可以：
- 检测何时用户**开始说话**
- 检测何时用户**停止说话**
- 区分**停顿思考**和**说完了**

### 业界最佳实践

根据 2024 年最新研究和 ChatGPT、Retell AI、LiveKit 等平台的实践：

#### 1. **Silero VAD**（推荐）
- 由 Snakers4 团队开发的企业级 VAD 模型
- 在浏览器中运行，完全免费
- 准确率高，延迟低（< 100ms）
- GitHub: https://github.com/snakers4/silero-vad
- 浏览器实现: `@ricky0123/vad` (NPM)

#### 2. **TEN VAD + Turn Detection**（Agora）
- 基于 10 年实时语音通信研究
- 区分"句中停顿"和"说完了"
- 支持全双工交互（用户可以随时打断）

#### 3. **OpenAI Realtime API**
- 内置 VAD 和 Turn Detection
- 延迟极低（< 300ms）
- 但需要付费

---

## 解决方案：三层检测机制

### 第 1 层：VAD（检测是否在说话）

使用 `@ricky0123/vad` 包检测用户是否在说话。

**关键参数**：
```typescript
const vadOptions = {
  // 语音检测阈值（0-1）
  // 高 = 更保守（可能漏掉轻声）
  // 低 = 更敏感（可能误判噪音）
  positiveSpeechThreshold: 0.5,

  // 静音检测阈值（0-1）
  negativeSpeechThreshold: 0.35,

  // "赎回帧"数量：连续多少帧静音才算说完
  // 关键参数！决定停顿多久算"说完"
  redemptionFrames: 8,  // 约 0.8 秒

  // 最少语音帧数（避免误触发）
  minSpeechFrames: 3,

  // 语音前填充帧（避免开头被截断）
  preSpeechPadFrames: 1
}
```

**工作原理**：
1. 用户开始说话 → VAD 检测到语音概率 > 0.5 → 进入"说话"状态
2. 用户停顿 → 语音概率 < 0.35 → 开始计数"赎回帧"
3. 连续 8 帧（约 0.8 秒）静音 → 判定"说完了"→ 触发回调

### 第 2 层：智能停顿分类

**问题**：如何区分"停顿思考"和"说完了"？

**解决方案**：动态调整 `redemptionFrames`

```typescript
// 场景 1：用户正在倾诉情绪（需要更多时间思考）
// 例如："我最近感到很焦虑...（停顿 2 秒）...因为工作压力太大了"
const emotionalContext = {
  redemptionFrames: 20,  // 约 2 秒
  reason: "用户可能在组织语言，等待更久"
}

// 场景 2：用户回答简单问题（快速响应）
// 例如："你今天心情怎么样？" → "还好"
const simpleQuestion = {
  redemptionFrames: 8,   // 约 0.8 秒
  reason: "简单回答，快速响应"
}

// 场景 3：用户可能在哭泣/哽咽（需要耐心等待）
const emotionalBreakdown = {
  redemptionFrames: 30,  // 约 3 秒
  reason: "给用户充分时间调整情绪"
}
```

**如何判断场景？**

```typescript
function detectConversationContext(
  lastAIQuestion: string,
  userSpeechDuration: number,
  pauseCount: number
): 'emotional' | 'simple' | 'normal' {
  // 1. AI 刚问了开放式问题
  const openEndedKeywords = ['怎么样', '感觉', '想法', '为什么', 'how', 'feel', 'think']
  const isOpenEnded = openEndedKeywords.some(kw => lastAIQuestion.includes(kw))

  // 2. 用户说话时间长（> 5 秒）且停顿多（> 2 次）
  const isEmotional = userSpeechDuration > 5000 && pauseCount > 2

  // 3. AI 问了简单问题（是/否，选择题）
  const simpleKeywords = ['是吗', '对吗', 'yes or no', '好吗']
  const isSimple = simpleKeywords.some(kw => lastAIQuestion.includes(kw))

  if (isEmotional || isOpenEnded) return 'emotional'
  if (isSimple) return 'simple'
  return 'normal'
}
```

### 第 3 层：用户打断 AI

**场景**：AI 正在说话时，用户想打断

**实现方案**：

```typescript
let aiSpeaking = false
let aiAudioElement: HTMLAudioElement | null = null

// 当 AI 开始说话
function playAIResponse(audioUrl: string) {
  aiSpeaking = true
  aiAudioElement = new Audio(audioUrl)
  aiAudioElement.play()

  aiAudioElement.onended = () => {
    aiSpeaking = false
    aiAudioElement = null
  }
}

// VAD 检测到用户说话
vad.onSpeechStart = () => {
  if (aiSpeaking) {
    console.log("[VAD] User interrupting AI - stopping AI speech")

    // 立即停止 AI 语音
    aiAudioElement?.pause()
    aiSpeaking = false

    // 显示提示（可选）
    showToast("您说...")
  }
}
```

---

## 完整实现代码

### 安装依赖

```bash
npm install @ricky0123/vad-web
```

### 实现 VAD 集成

```typescript
// lib/vad-manager.ts
import { MicVAD } from "@ricky0123/vad-web"

export interface VADConfig {
  onSpeechStart: () => void
  onSpeechEnd: (audio: Float32Array) => void
  onUserInterrupt: () => void
  context: 'emotional' | 'simple' | 'normal'
}

export class SmartVADManager {
  private vad: MicVAD | null = null
  private pauseThresholds = {
    emotional: 20,  // 2 秒
    simple: 8,      // 0.8 秒
    normal: 12      // 1.2 秒
  }

  async initialize(config: VADConfig) {
    console.log("[Smart VAD] Initializing with context:", config.context)

    const redemptionFrames = this.pauseThresholds[config.context]

    this.vad = await MicVAD.new({
      // VAD 模型配置
      positiveSpeechThreshold: 0.5,
      negativeSpeechThreshold: 0.35,
      redemptionFrames,
      minSpeechFrames: 3,
      preSpeechPadFrames: 1,

      // 回调函数
      onSpeechStart: () => {
        console.log("[Smart VAD] User started speaking")
        config.onSpeechStart()
      },

      onSpeechEnd: (audio) => {
        console.log("[Smart VAD] User stopped speaking, audio length:", audio.length)
        config.onSpeechEnd(audio)
      },

      onVADMisfire: () => {
        console.log("[Smart VAD] False alarm - not speech")
      }
    })

    this.vad.start()
    console.log("[Smart VAD] Started listening")
  }

  updateContext(context: 'emotional' | 'simple' | 'normal') {
    console.log("[Smart VAD] Context changed to:", context)
    // 注意：@ricky0123/vad 不支持动态更新参数
    // 需要重新初始化（未来版本可能支持）
  }

  destroy() {
    this.vad?.destroy()
    console.log("[Smart VAD] Stopped listening")
  }
}
```

### 集成到现有组件

```typescript
// components/voice-therapy-chat.tsx
import { SmartVADManager } from "@/lib/vad-manager"
import { useState, useEffect, useRef } from "react"

export default function VoiceTherapyChat() {
  const [isListening, setIsListening] = useState(false)
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [conversationContext, setConversationContext] = useState<'emotional' | 'simple' | 'normal'>('normal')

  const vadManager = useRef<SmartVADManager | null>(null)
  const aiAudioRef = useRef<HTMLAudioElement | null>(null)
  const lastAIMessage = useRef<string>("")

  // 初始化 VAD
  const startVAD = async () => {
    vadManager.current = new SmartVADManager()

    await vadManager.current.initialize({
      context: conversationContext,

      onSpeechStart: () => {
        setIsListening(true)

        // 用户打断 AI
        if (aiSpeaking) {
          console.log("[Voice Chat] User interrupted AI")
          aiAudioRef.current?.pause()
          setAiSpeaking(false)
          // 可选：显示提示
          toast("您说...")
        }
      },

      onSpeechEnd: async (audio) => {
        setIsListening(false)

        // 将音频转为文字（STT）
        const text = await speechToText(audio)
        console.log("[Voice Chat] User said:", text)

        // 检测对话上下文（用于下一轮调整停顿时间）
        const newContext = detectConversationContext(lastAIMessage.current, text)
        if (newContext !== conversationContext) {
          setConversationContext(newContext)
        }

        // 发送到 AI
        const aiResponse = await sendToAI(text)
        lastAIMessage.current = aiResponse

        // 播放 AI 回复
        await playAIResponse(aiResponse)
      },

      onUserInterrupt: () => {
        // 处理打断逻辑
      }
    })
  }

  // 播放 AI 回复
  const playAIResponse = async (text: string) => {
    setAiSpeaking(true)

    // 调用 TTS API
    const response = await fetch("/api/edge-tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    })

    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)

    aiAudioRef.current = new Audio(audioUrl)
    aiAudioRef.current.play()

    aiAudioRef.current.onended = () => {
      setAiSpeaking(false)
      URL.revokeObjectURL(audioUrl)
    }
  }

  // 清理
  useEffect(() => {
    return () => {
      vadManager.current?.destroy()
    }
  }, [])

  return (
    <div>
      <button onClick={startVAD}>开始语音对话</button>

      {isListening && (
        <div className="listening-indicator">
          🎤 正在倾听...
        </div>
      )}

      {aiSpeaking && (
        <div className="ai-speaking-indicator">
          💬 Aria 正在说话...
        </div>
      )}
    </div>
  )
}

// 检测对话上下文
function detectConversationContext(
  lastAIQuestion: string,
  userResponse: string
): 'emotional' | 'simple' | 'normal' {
  // 开放式问题关键词
  const openEndedKeywords = [
    '怎么样', '感觉', '想法', '为什么', '详细', '说说',
    'how', 'feel', 'think', 'why', 'tell me', 'describe'
  ]
  const isOpenEnded = openEndedKeywords.some(kw =>
    lastAIQuestion.toLowerCase().includes(kw.toLowerCase())
  )

  // 简单问题关键词
  const simpleKeywords = [
    '是吗', '对吗', '好吗', '要不要', '可以吗',
    'yes or no', 'right', 'okay', 'do you'
  ]
  const isSimple = simpleKeywords.some(kw =>
    lastAIQuestion.toLowerCase().includes(kw.toLowerCase())
  )

  // 用户回复很短（可能是简单回答）
  const isShortResponse = userResponse.length < 20

  if (isOpenEnded && !isShortResponse) {
    return 'emotional'  // 需要更多时间思考
  }

  if (isSimple || isShortResponse) {
    return 'simple'  // 快速响应
  }

  return 'normal'
}

// 语音转文字（使用 Web Speech API 或 Whisper）
async function speechToText(audio: Float32Array): Promise<string> {
  // 实现 STT 逻辑
  // 选项 1: Web Speech API（免费但不稳定）
  // 选项 2: Whisper.cpp in browser（推荐）
  // 选项 3: 调用后端 Whisper API
  return "转换后的文字"
}
```

---

## 参数调优指南

### 问题 1：AI 过早打断用户

**症状**：用户停顿 1 秒，AI 就开始说话

**解决**：增加 `redemptionFrames`

```typescript
// 之前
redemptionFrames: 8   // 0.8 秒

// 之后
redemptionFrames: 15  // 1.5 秒
```

### 问题 2：用户说完后 AI 延迟响应

**症状**：用户明显说完了，AI 等了 3 秒才回应

**解决**：减少 `redemptionFrames`

```typescript
// 之前
redemptionFrames: 20  // 2 秒

// 之后
redemptionFrames: 10  // 1 秒
```

### 问题 3：噪音误触发

**症状**：背景噪音被识别为语音

**解决**：提高 `positiveSpeechThreshold`

```typescript
// 之前
positiveSpeechThreshold: 0.5

// 之后
positiveSpeechThreshold: 0.7  // 更保守
```

### 问题 4：轻声说话被忽略

**症状**：用户轻声说话，VAD 没反应

**解决**：降低 `positiveSpeechThreshold`

```typescript
// 之前
positiveSpeechThreshold: 0.5

// 之后
positiveSpeechThreshold: 0.3  // 更敏感
```

---

## 推荐配置（心理咨询场景）

### 默认配置（平衡）

```typescript
const defaultVADConfig = {
  positiveSpeechThreshold: 0.5,
  negativeSpeechThreshold: 0.35,
  redemptionFrames: 12,  // 1.2 秒
  minSpeechFrames: 3,
  preSpeechPadFrames: 1
}
```

### 情绪倾诉场景

```typescript
const emotionalVADConfig = {
  positiveSpeechThreshold: 0.4,  // 更敏感（捕捉哽咽）
  negativeSpeechThreshold: 0.3,
  redemptionFrames: 20,  // 2 秒（给时间整理情绪）
  minSpeechFrames: 2,
  preSpeechPadFrames: 2   // 避免开头被截断
}
```

### 评估问卷场景

```typescript
const assessmentVADConfig = {
  positiveSpeechThreshold: 0.5,
  negativeSpeechThreshold: 0.35,
  redemptionFrames: 8,   // 0.8 秒（快速响应）
  minSpeechFrames: 3,
  preSpeechPadFrames: 1
}
```

---

## 对比：现有方案 vs 优化方案

| 指标 | Web Speech API (现有) | Silero VAD (优化) |
|------|----------------------|-------------------|
| **停顿检测** | 固定阈值（通常 1 秒） | 可配置（0.5-3 秒） |
| **误触发率** | 高（噪音敏感） | 低（AI 模型过滤） |
| **打断支持** | ❌ 不支持 | ✅ 支持 |
| **上下文感知** | ❌ 无 | ✅ 可动态调整 |
| **浏览器兼容性** | Chrome/Edge（限） | 所有现代浏览器 |
| **延迟** | 200-500ms | < 100ms |
| **成本** | 免费 | 免费 |

---

## 下一步

1. **立即实施**：
   - 安装 `@ricky0123/vad-web`
   - 集成到 `voice-therapy-chat.tsx`
   - 测试默认配置

2. **A/B 测试**：
   - 收集真实用户反馈
   - 调优 `redemptionFrames` 参数
   - 测试不同场景（情绪倾诉 vs 问卷）

3. **高级优化**：
   - 训练自定义 VAD 模型（针对心理咨询场景）
   - 集成情绪识别（检测哭泣、哽咽）
   - 添加语音打断动画效果

---

## 参考资源

- **Silero VAD GitHub**: https://github.com/snakers4/silero-vad
- **@ricky0123/vad 文档**: https://github.com/ricky0123/vad
- **Andrew Ng 关于 VAD 的讨论**: https://x.com/AndrewYNg/status/1897776017873465635
- **Retell AI VAD vs Turn-Taking**: https://www.retellai.com/blog/vad-vs-turn-taking-end-point-in-conversational-ai
- **LiveKit Turn Detection**: https://docs.livekit.io/agents/build/turns/

---

**总结**：通过使用 Silero VAD + 智能停顿检测 + 打断处理，可以彻底解决语音交互的 3 大问题，提供接近真人对话的体验。
