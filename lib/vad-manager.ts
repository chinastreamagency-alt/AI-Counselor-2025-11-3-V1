/**
 * Smart VAD Manager - 智能语音活动检测管理器
 *
 * 解决 3 大语音交互问题：
 * 1. AI 过早打断用户（用户停顿思考时）
 * 2. AI 延迟响应（用户说完后）
 * 3. 用户无法打断 AI
 *
 * 基于 Silero VAD (@ricky0123/vad-web)
 */

import { MicVAD } from "@ricky0123/vad-web"

export type ConversationContext = 'emotional' | 'simple' | 'normal'

export interface VADConfig {
  /** 用户开始说话时的回调 */
  onSpeechStart: () => void

  /** 用户停止说话时的回调（提供音频数据） */
  onSpeechEnd: (audio: Float32Array) => void

  /** 对话上下文（决定停顿阈值） */
  context?: ConversationContext
}

/**
 * 智能 VAD 管理器
 */
export class SmartVADManager {
  private vad: MicVAD | null = null
  private currentContext: ConversationContext = 'normal'

  /**
   * 停顿阈值配置（单位：帧数，1 帧 ≈ 100ms）
   *
   * emotional: 2 秒 - 用于情绪倾诉场景（给用户充分时间整理思绪）
   * simple: 0.8 秒 - 用于简单问答场景（快速响应）
   * normal: 1.2 秒 - 默认场景（平衡）
   */
  private pauseThresholds: Record<ConversationContext, number> = {
    emotional: 20,  // 2 秒
    simple: 8,      // 0.8 秒
    normal: 12      // 1.2 秒
  }

  /**
   * 初始化 VAD
   */
  async initialize(config: VADConfig): Promise<void> {
    this.currentContext = config.context || 'normal'

    console.log("[Smart VAD] Initializing with context:", this.currentContext)
    console.log("[Smart VAD] Pause threshold:", this.pauseThresholds[this.currentContext] * 0.1, "seconds")

    try {
      this.vad = await MicVAD.new({
        // 语音检测阈值（0-1）
        // 越高 = 越保守（可能漏掉轻声）
        // 越低 = 越敏感（可能误判噪音）
        positiveSpeechThreshold: this.getSpeechThreshold(),

        // 静音检测阈值（0-1）
        negativeSpeechThreshold: 0.35,

        // 关键参数：连续多少帧静音才算"说完"
        redemptionFrames: this.pauseThresholds[this.currentContext],

        // 最少语音帧数（避免误触发）
        minSpeechFrames: this.currentContext === 'emotional' ? 2 : 3,

        // 语音前填充帧（避免开头被截断）
        preSpeechPadFrames: this.currentContext === 'emotional' ? 2 : 1,

        // 回调函数
        onSpeechStart: () => {
          console.log("[Smart VAD] 🎤 User started speaking")
          config.onSpeechStart()
        },

        onSpeechEnd: (audio) => {
          const durationMs = (audio.length / 16000) * 1000
          console.log("[Smart VAD] 🛑 User stopped speaking, duration:", durationMs.toFixed(0), "ms")
          config.onSpeechEnd(audio)
        },

        onVADMisfire: () => {
          console.log("[Smart VAD] ⚠️ False alarm - not speech (background noise)")
        }
      })

      this.vad.start()
      console.log("[Smart VAD] ✅ Started listening")

    } catch (error) {
      console.error("[Smart VAD] ❌ Failed to initialize:", error)
      throw error
    }
  }

  /**
   * 根据场景获取语音检测阈值
   */
  private getSpeechThreshold(): number {
    switch (this.currentContext) {
      case 'emotional':
        return 0.4  // 更敏感（捕捉哽咽、轻声）
      case 'simple':
        return 0.5  // 标准
      case 'normal':
      default:
        return 0.5  // 标准
    }
  }

  /**
   * 更新对话上下文
   *
   * 注意：当前 @ricky0123/vad 不支持动态更新参数
   * 需要在下次初始化时生效
   */
  updateContext(context: ConversationContext): void {
    if (context !== this.currentContext) {
      console.log("[Smart VAD] Context will change to:", context, "(on next init)")
      this.currentContext = context
    }
  }

  /**
   * 销毁 VAD（释放麦克风资源）
   */
  destroy(): void {
    if (this.vad) {
      this.vad.destroy()
      this.vad = null
      console.log("[Smart VAD] 🔴 Stopped listening")
    }
  }

  /**
   * 检查是否正在运行
   */
  isRunning(): boolean {
    return this.vad !== null
  }
}

/**
 * 检测对话上下文（用于动态调整停顿阈值）
 */
export function detectConversationContext(
  lastAIMessage: string,
  userResponse: string,
  conversationHistory: { role: string; content: string }[] = []
): ConversationContext {
  // 1. 检测 AI 是否问了开放式问题
  const openEndedKeywords = [
    '怎么样', '感觉', '想法', '为什么', '详细', '说说', '描述',
    'how', 'feel', 'think', 'why', 'tell me', 'describe', 'what happened'
  ]
  const isOpenEnded = openEndedKeywords.some(kw =>
    lastAIMessage.toLowerCase().includes(kw.toLowerCase())
  )

  // 2. 检测 AI 是否问了简单问题
  const simpleKeywords = [
    '是吗', '对吗', '好吗', '要不要', '可以吗', '愿意吗',
    'yes or no', 'right', 'okay', 'do you', 'would you', 'can you'
  ]
  const isSimple = simpleKeywords.some(kw =>
    lastAIMessage.toLowerCase().includes(kw.toLowerCase())
  )

  // 3. 检测用户回复长度
  const isShortResponse = userResponse.length < 20

  // 4. 检测情绪化内容（用户可能在倾诉）
  const emotionalKeywords = [
    '焦虑', '抑郁', '难过', '痛苦', '崩溃', '压力', '害怕', '担心',
    'anxious', 'depressed', 'sad', 'pain', 'stress', 'scared', 'worried'
  ]
  const hasEmotionalContent = emotionalKeywords.some(kw =>
    userResponse.toLowerCase().includes(kw.toLowerCase())
  )

  // 5. 检测对话历史（是否处于深度咨询阶段）
  const isDeepSession = conversationHistory.length > 10

  // 决策逻辑
  if ((isOpenEnded || hasEmotionalContent) && !isShortResponse) {
    return 'emotional'  // 需要更多时间思考和倾诉
  }

  if (isSimple || isShortResponse) {
    return 'simple'  // 快速响应
  }

  if (isDeepSession && hasEmotionalContent) {
    return 'emotional'  // 深度咨询阶段
  }

  return 'normal'  // 默认
}

/**
 * 音频数据转 WAV Blob（用于发送到 STT API）
 */
export function audioBufferToWav(audioData: Float32Array, sampleRate: number = 16000): Blob {
  const numChannels = 1
  const bitsPerSample = 16
  const bytesPerSample = bitsPerSample / 8
  const blockAlign = numChannels * bytesPerSample

  const dataLength = audioData.length * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(buffer)

  // WAV 文件头
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true)
  writeString(36, 'data')
  view.setUint32(40, dataLength, true)

  // 音频数据（Float32 → Int16）
  const volume = 0.8
  let offset = 44
  for (let i = 0; i < audioData.length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i]))
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
    offset += 2
  }

  return new Blob([view], { type: 'audio/wav' })
}
