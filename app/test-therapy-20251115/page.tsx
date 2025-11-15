"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react"
import { SmartVADManager, detectConversationContext, audioBufferToWav } from "@/lib/vad-manager"
import type { ConversationContext } from "@/lib/vad-manager"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function TherapyTestPage() {
  // 对话状态
  const [messages, setMessages] = useState<Message[]>([])
  const [isListening, setIsListening] = useState(false)
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [conversationContext, setConversationContext] = useState<ConversationContext>("normal")

  // VAD 和音频
  const vadManager = useRef<SmartVADManager | null>(null)
  const aiAudioRef = useRef<HTMLAudioElement | null>(null)
  const lastAIMessage = useRef<string>("")

  // 测试状态
  const [testUserId] = useState(`test-user-${Date.now()}`)
  const [apiStatus, setApiStatus] = useState<{
    groq: "pending" | "success" | "error"
    tts: "pending" | "success" | "error"
    vad: "pending" | "success" | "error"
  }>({
    groq: "pending",
    tts: "pending",
    vad: "pending"
  })

  // 启动 VAD
  const startVoiceChat = async () => {
    try {
      vadManager.current = new SmartVADManager()

      await vadManager.current.initialize({
        context: conversationContext,

        onSpeechStart: () => {
          console.log("[Test Page] 用户开始说话")
          setIsListening(true)

          // 用户打断 AI
          if (aiSpeaking) {
            console.log("[Test Page] 用户打断 AI")
            aiAudioRef.current?.pause()
            setAiSpeaking(false)
          }
        },

        onSpeechEnd: async (audio) => {
          console.log("[Test Page] 用户停止说话, 音频长度:", audio.length)
          setIsListening(false)

          // 将音频转为文字（使用 Web Speech API 作为临时方案）
          const text = await speechToText(audio)
          console.log("[Test Page] 识别文字:", text)

          if (!text) {
            console.error("[Test Page] 语音识别失败")
            return
          }

          // 添加用户消息
          const userMessage: Message = {
            role: "user",
            content: text,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, userMessage])

          // 检测对话上下文
          const newContext = detectConversationContext(
            lastAIMessage.current,
            text,
            messages.map(m => ({ role: m.role, content: m.content }))
          )
          if (newContext !== conversationContext) {
            console.log("[Test Page] 上下文切换:", conversationContext, "→", newContext)
            setConversationContext(newContext)
          }

          // 发送到 AI
          await sendToAI([...messages, userMessage])
        }
      })

      setApiStatus(prev => ({ ...prev, vad: "success" }))
      console.log("[Test Page] VAD 已启动")
    } catch (error) {
      console.error("[Test Page] VAD 启动失败:", error)
      setApiStatus(prev => ({ ...prev, vad: "error" }))
      alert("语音识别启动失败，请检查麦克风权限")
    }
  }

  // 停止 VAD
  const stopVoiceChat = () => {
    vadManager.current?.destroy()
    vadManager.current = null
    setIsListening(false)
    console.log("[Test Page] VAD 已停止")
  }

  // 发送消息到 AI
  const sendToAI = async (conversationHistory: Message[]) => {
    try {
      setAiSpeaking(true)

      const response = await fetch("/api/groq-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationHistory.map(m => ({
            role: m.role,
            content: m.content
          })),
          userId: testUserId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API 错误: ${response.status}`)
      }

      const data = await response.json()
      const aiMessage = data.message

      if (!aiMessage) {
        throw new Error("AI 返回空消息")
      }

      console.log("[Test Page] AI 回复:", aiMessage)
      lastAIMessage.current = aiMessage

      // 添加 AI 消息
      const assistantMessage: Message = {
        role: "assistant",
        content: aiMessage,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])

      setApiStatus(prev => ({ ...prev, groq: "success" }))

      // 播放 AI 语音
      await playAIResponse(aiMessage)

    } catch (error) {
      console.error("[Test Page] AI 调用失败:", error)
      setApiStatus(prev => ({ ...prev, groq: "error" }))
      setAiSpeaking(false)
      alert(`AI 调用失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // 播放 AI 回复（TTS）
  const playAIResponse = async (text: string) => {
    try {
      const response = await fetch("/api/edge-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        throw new Error(`TTS 错误: ${response.status}`)
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      aiAudioRef.current = new Audio(audioUrl)
      aiAudioRef.current.play()

      setApiStatus(prev => ({ ...prev, tts: "success" }))

      aiAudioRef.current.onended = () => {
        setAiSpeaking(false)
        URL.revokeObjectURL(audioUrl)
        console.log("[Test Page] AI 语音播放完成")
      }
    } catch (error) {
      console.error("[Test Page] TTS 失败:", error)
      setApiStatus(prev => ({ ...prev, tts: "error" }))
      setAiSpeaking(false)
    }
  }

  // 语音转文字（临时使用 Web Speech API）
  const speechToText = async (audio: Float32Array): Promise<string> => {
    return new Promise((resolve) => {
      // 临时方案：使用 Web Speech API
      // 生产环境建议使用 Whisper
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.lang = "zh-CN"
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        resolve(transcript)
      }

      recognition.onerror = (event: any) => {
        console.error("[Test Page] 语音识别错误:", event.error)
        resolve("")
      }

      recognition.start()
    })
  }

  // 文字输入测试
  const [textInput, setTextInput] = useState("")
  const sendTextMessage = async () => {
    if (!textInput.trim()) return

    const userMessage: Message = {
      role: "user",
      content: textInput,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setTextInput("")

    await sendToAI([...messages, userMessage])
  }

  // 清空对话
  const clearConversation = () => {
    setMessages([])
    lastAIMessage.current = ""
    setConversationContext("normal")
  }

  // 清理
  useEffect(() => {
    return () => {
      vadManager.current?.destroy()
      aiAudioRef.current?.pause()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 标题 */}
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-blue-900">
              🧪 AI 心理咨询师 - 测试页面
            </CardTitle>
            <CardDescription className="text-center text-lg">
              测试 Groq API + Edge TTS + VAD 语音交互 + 灵活对话流程
            </CardDescription>
            <div className="text-center text-sm text-gray-500 mt-2">
              测试用户 ID: {testUserId}
            </div>
          </CardHeader>
        </Card>

        {/* API 状态 */}
        <Card>
          <CardHeader>
            <CardTitle>API 状态</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <StatusBadge label="Groq API" status={apiStatus.groq} />
            <StatusBadge label="Edge TTS" status={apiStatus.tts} />
            <StatusBadge label="VAD" status={apiStatus.vad} />
            <div className="ml-auto">
              <span className="text-sm text-gray-600">
                对话上下文: <strong>{conversationContext}</strong>
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 语音控制 */}
          <Card>
            <CardHeader>
              <CardTitle>🎤 语音交互</CardTitle>
              <CardDescription>测试 VAD 停顿检测和打断功能</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={startVoiceChat}
                  disabled={vadManager.current !== null}
                  className="flex-1"
                  variant={vadManager.current === null ? "default" : "secondary"}
                >
                  <Mic className="mr-2 h-4 w-4" />
                  启动语音对话
                </Button>
                <Button
                  onClick={stopVoiceChat}
                  disabled={vadManager.current === null}
                  variant="destructive"
                  className="flex-1"
                >
                  <MicOff className="mr-2 h-4 w-4" />
                  停止语音
                </Button>
              </div>

              <div className="space-y-2">
                <div className={`p-4 rounded-lg border-2 ${isListening ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    {isListening ? (
                      <>
                        <Mic className="h-5 w-5 text-green-600 animate-pulse" />
                        <span className="font-semibold text-green-700">正在倾听...</span>
                      </>
                    ) : (
                      <>
                        <MicOff className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-500">等待语音输入</span>
                      </>
                    )}
                  </div>
                </div>

                <div className={`p-4 rounded-lg border-2 ${aiSpeaking ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    {aiSpeaking ? (
                      <>
                        <Volume2 className="h-5 w-5 text-blue-600 animate-pulse" />
                        <span className="font-semibold text-blue-700">Aria 正在说话...</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-500">AI 静音</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <p>💡 <strong>测试要点</strong>：</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>说话时停顿思考，AI 不应打断</li>
                  <li>说完后 {conversationContext === 'emotional' ? '2' : conversationContext === 'simple' ? '0.8' : '1.2'} 秒，AI 应该响应</li>
                  <li>AI 说话时，您可以打断它</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 文字输入 */}
          <Card>
            <CardHeader>
              <CardTitle>💬 文字测试</CardTitle>
              <CardDescription>不想用语音？直接打字测试</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendTextMessage()}
                  placeholder="输入消息..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button onClick={sendTextMessage} disabled={!textInput.trim()}>
                  发送
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">快速测试场景：</p>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTextInput("我最近感到很焦虑，尤其是晚上睡不着觉...")
                      setTimeout(() => sendTextMessage(), 100)
                    }}
                  >
                    焦虑场景（测试嵌入式评估）
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTextInput("我觉得自己是个失败者，什么都做不好...")
                      setTimeout(() => sendTextMessage(), 100)
                    }}
                  >
                    认知扭曲场景（测试 CBT）
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTextInput("我不想活了...")
                      setTimeout(() => sendTextMessage(), 100)
                    }}
                  >
                    危机场景（测试危机检测）
                  </Button>
                </div>
              </div>

              <Button
                onClick={clearConversation}
                variant="outline"
                className="w-full"
              >
                清空对话
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 对话历史 */}
        <Card>
          <CardHeader>
            <CardTitle>📝 对话历史</CardTitle>
            <CardDescription>
              共 {messages.length} 条消息 | 检查是否符合灵活对话流程
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  还没有对话，开始测试吧！
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg ${
                      msg.role === "user"
                        ? "bg-blue-100 ml-12"
                        : "bg-gray-100 mr-12"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm">
                        {msg.role === "user" ? "👤 您" : "🤖 Aria"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-gray-800 whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 测试检查清单 */}
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle>✅ 测试检查清单</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold mb-2">灵活对话流程：</p>
                <ul className="space-y-1">
                  <li>□ 第一次对话：建立信任 + 学到 1 个技能</li>
                  <li>□ 嵌入式评估：自然问问题（不像问卷）</li>
                  <li>□ 每次都有收获：至少 1 个应对技巧</li>
                  <li>□ 不重复评估：再次访问不问相同问题</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-2">语音交互：</p>
                <ul className="space-y-1">
                  <li>□ AI 不过早打断（停顿思考时）</li>
                  <li>□ AI 及时响应（说完后 1-2 秒内）</li>
                  <li>□ 可以打断 AI（AI 说话时开始说话）</li>
                  <li>□ 上下文自动调整（emotional/simple/normal）</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 状态徽章组件
function StatusBadge({
  label,
  status
}: {
  label: string
  status: "pending" | "success" | "error"
}) {
  const colors = {
    pending: "bg-gray-200 text-gray-700",
    success: "bg-green-200 text-green-800",
    error: "bg-red-200 text-red-800"
  }

  const icons = {
    pending: "⏳",
    success: "✅",
    error: "❌"
  }

  return (
    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${colors[status]}`}>
      {icons[status]} {label}
    </div>
  )
}
