"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, MicOff, Send, Volume2, Loader2 } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function TherapyTestChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recognitionRef = useRef<any>(null)
  const testUserId = useRef(`test-${Date.now()}`)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 发送消息
  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: text }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // 调用 Groq API
      const response = await fetch("/api/groq-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          userId: testUserId.current
        })
      })

      if (!response.ok) {
        throw new Error(`API 错误: ${response.status}`)
      }

      const data = await response.json()
      const aiMessage: Message = { role: "assistant", content: data.message }
      setMessages(prev => [...prev, aiMessage])

      // 自动播放语音
      await playTTS(data.message)

    } catch (error) {
      console.error("发送失败:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: "抱歉，发生了错误。请检查 GROQ_API_KEY 是否已设置。"
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // 播放 TTS
  const playTTS = async (text: string) => {
    try {
      setIsSpeaking(true)

      const response = await fetch("/api/edge-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      })

      if (!response.ok) throw new Error("TTS 失败")

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      audioRef.current = new Audio(audioUrl)
      audioRef.current.play()

      audioRef.current.onended = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(audioUrl)
      }
    } catch (error) {
      console.error("TTS 失败:", error)
      setIsSpeaking(false)
    }
  }

  // 语音输入
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("您的浏览器不支持语音识别，请使用 Chrome")
      return
    }

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.lang = "zh-CN"
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsListening(true)
      // 如果 AI 正在说话，打断它
      if (isSpeaking && audioRef.current) {
        audioRef.current.pause()
        setIsSpeaking(false)
      }
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      sendMessage(transcript)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* 顶部标题 */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">🧠 AI 心理咨询师 - Aria</h1>
              <p className="text-sm text-gray-600">测试版 | 无需登录 | 直接对话</p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <div>Groq API (Llama 3.3 70B)</div>
              <div>Edge TTS (免费)</div>
            </div>
          </div>
        </div>
      </div>

      {/* 对话区域 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* 消息列表 */}
          <div className="h-[calc(100vh-280px)] overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👋</div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">你好，我是 Aria</h2>
                <p className="text-gray-600 mb-6">你的 AI 心理咨询师。有什么我可以帮助你的吗？</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage("我最近感到很焦虑")}
                  >
                    我最近感到很焦虑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage("我睡不好觉")}
                  >
                    我睡不好觉
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage("我觉得自己很失败")}
                  >
                    我觉得自己很失败
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* 输入区域 */}
          <div className="border-t bg-white/90 p-4">
            {isSpeaking && (
              <div className="mb-3 flex items-center gap-2 text-blue-600 text-sm">
                <Volume2 className="h-4 w-4 animate-pulse" />
                <span>Aria 正在说话...</span>
              </div>
            )}
            {isListening && (
              <div className="mb-3 flex items-center gap-2 text-green-600 text-sm">
                <Mic className="h-4 w-4 animate-pulse" />
                <span>正在倾听...</span>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                placeholder="输入消息... (按 Enter 发送)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading || isListening}
              />
              <Button
                onClick={isListening ? stopListening : startListening}
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                className="rounded-xl w-12 h-12"
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              <Button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading || isListening}
                size="icon"
                className="rounded-xl w-12 h-12 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
              💡 提示：点击麦克风图标可以语音输入
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
