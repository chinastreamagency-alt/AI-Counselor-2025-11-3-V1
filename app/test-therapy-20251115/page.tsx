"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, Phone, PhoneOff } from "lucide-react"
import { VideoAvatar } from "@/components/video-avatar"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

type SessionStatus = "idle" | "listening" | "processing" | "speaking"

export default function VoiceTherapyTestPage() {
  const [status, setStatus] = useState<SessionStatus>("idle")
  const [messages, setMessages] = useState<Message[]>([])
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [transcript, setTranscript] = useState("")
  const [sessionDuration, setSessionDuration] = useState(0)
  const [currentSpeaker, setCurrentSpeaker] = useState<"user" | "assistant" | null>(null)
  const [currentText, setCurrentText] = useState("")
  const [elevenLabsError, setElevenLabsError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const shouldListenRef = useRef(false)
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isAISpeakingRef = useRef(false)
  const testUserId = useRef(`test-${Date.now()}`)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null) // 用于检测用户说话停顿
  const lastTranscriptRef = useRef("") // 记录最后一次识别的文本

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = "en-US"
      recognitionRef.current.maxAlternatives = 3

      recognitionRef.current.onresult = (event: any) => {
        if (isAISpeakingRef.current) {
          console.log("[Test] Ignoring speech during AI playback")
          return
        }

        let interimTranscript = ""
        let finalTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " "
          } else {
            interimTranscript += transcript
          }
        }

        const currentTranscript = interimTranscript || finalTranscript
        setTranscript(currentTranscript)

        // 清除之前的静默计时器
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
        }

        // 如果有最终文本，累积到 lastTranscriptRef
        if (finalTranscript.trim()) {
          lastTranscriptRef.current += finalTranscript
          console.log("[Test] Accumulated transcript:", lastTranscriptRef.current)
        }

        // 设置新的静默计时器 - 2秒没有新的语音输入就发送
        silenceTimerRef.current = setTimeout(() => {
          if (lastTranscriptRef.current.trim()) {
            console.log("[Test] User finished speaking, sending:", lastTranscriptRef.current)
            handleUserSpeech(lastTranscriptRef.current.trim())
            lastTranscriptRef.current = "" // 重置
          }
        }, 2000) // 2秒静默后发送
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("[Test] Speech recognition error:", event.error)
        if (event.error !== "no-speech" && event.error !== "aborted") {
          setTimeout(() => {
            if (shouldListenRef.current && !isAISpeakingRef.current) {
              try {
                recognitionRef.current?.start()
              } catch (e) {
                console.error("[Test] Error restarting recognition:", e)
              }
            }
          }, 1000)
        }
      }

      recognitionRef.current.onend = () => {
        if (shouldListenRef.current && !isAISpeakingRef.current) {
          try {
            recognitionRef.current?.start()
          } catch (e) {
            console.error("[Test] Error restarting recognition:", e)
          }
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (isAISpeakingRef.current) {
      console.log("[Test] Not starting listening - AI is speaking")
      return
    }

    console.log("[Test] Starting to listen for user speech...")
    setStatus("listening")
    shouldListenRef.current = true
    setCurrentSpeaker(null)
    setCurrentText("")

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error("[Test] Error starting recognition:", error)
      }
    }
  }, [])

  const stopListening = useCallback(() => {
    console.log("[Test] Stopping listening")
    shouldListenRef.current = false
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error("[Test] Error stopping recognition:", error)
      }
    }
  }, [])

  const speakText = useCallback(
    async (text: string) => {
      if (!text || typeof text !== "string") {
        console.error("[Test] Invalid text for TTS:", text)
        startListening()
        return
      }

      stopListening()
      isAISpeakingRef.current = true

      setStatus("speaking")
      setElevenLabsError(null)
      setCurrentSpeaker("assistant")
      setCurrentText(text)

      try {
        console.log("[Test] Requesting ElevenLabs TTS for text:", text.substring(0, 50) + "...")

        const response = await fetch("/api/elevenlabs-tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        })

        if (!response.ok) {
          console.error("[Test] ElevenLabs TTS failed, falling back to browser TTS")
          useBrowserTTS(text)
          return
        }

        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)

        if (audioRef.current) {
          audioRef.current.src = audioUrl
          audioRef.current.onended = () => {
            console.log("[Test] Audio playback ended")
            isAISpeakingRef.current = false
            setTimeout(() => startListening(), 500)
          }
          audioRef.current.onerror = () => {
            console.error("[Test] Audio playback error, falling back to browser TTS")
            useBrowserTTS(text)
          }
          await audioRef.current.play()
        }

        console.log("[Test] ElevenLabs TTS playback started")
      } catch (error) {
        console.error("[Test] Error with ElevenLabs TTS, falling back to browser TTS:", error)
        useBrowserTTS(text)
      }
    },
    [startListening, stopListening],
  )

  // 浏览器内置 TTS 备用方案
  const useBrowserTTS = (text: string) => {
    console.log("[Test] Using browser TTS")
    setElevenLabsError("Using browser voice (ElevenLabs unavailable)")

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1.0
      utterance.volume = 1.0

      utterance.onend = () => {
        console.log("[Test] Browser TTS ended")
        isAISpeakingRef.current = false
        setTimeout(() => startListening(), 500)
      }

      utterance.onerror = () => {
        console.error("[Test] Browser TTS error")
        isAISpeakingRef.current = false
        startListening()
      }

      window.speechSynthesis.speak(utterance)
    } else {
      console.error("[Test] Browser TTS not supported")
      isAISpeakingRef.current = false
      startListening()
    }
  }

  const handleUserSpeech = useCallback(
    async (text: string) => {
      if (!text.trim()) return

      shouldListenRef.current = false
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          console.error("[Test] Error stopping recognition:", e)
        }
      }

      setStatus("processing")
      setCurrentSpeaker("user")
      setCurrentText(text)

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])

      try {
        console.log("[Test] Sending to AI:", text)

        const response = await fetch("/api/groq-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content
            })),
            userId: testUserId.current
          }),
        })

        console.log("[Test] API Response status:", response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.error("[Test] API Error response:", errorText)
          throw new Error(`Failed to get AI response: ${response.status}`)
        }

        const data = await response.json()
        console.log("[Test] AI Response received:", data)

        if (!data.message) {
          console.error("[Test] No message in response:", data)
          throw new Error("Invalid response format")
        }

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, aiMessage])
        console.log("[Test] Message added, will speak:", data.message)

        if (isAudioEnabled) {
          await speakText(data.message)
        } else {
          startListening()
        }
      } catch (error) {
        console.error("[Test] Error processing speech:", error)
        console.error("[Test] Error details:", error instanceof Error ? error.message : String(error))
        setStatus("idle")
        startListening()
      }
    },
    [messages, isAudioEnabled, speakText, startListening],
  )

  const startSession = useCallback(() => {
    setMessages([])
    setSessionDuration(0)

    sessionTimerRef.current = setInterval(() => {
      setSessionDuration((prev) => prev + 1)
    }, 1000)

    const greeting = "Hello, I'm Aria, your AI counselor. How are you feeling today?"
    const greetingMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: greeting,
      timestamp: new Date(),
    }
    setMessages([greetingMessage])

    if (isAudioEnabled) {
      speakText(greeting)
    } else {
      startListening()
    }
  }, [isAudioEnabled, speakText, startListening])

  const stopSession = useCallback(() => {
    console.log("[Test] Stopping session and resetting all state")

    shouldListenRef.current = false
    isAISpeakingRef.current = false

    // 清除所有计时器
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }

    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current)
      sessionTimerRef.current = null
    }

    // 停止语音识别
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.error("[Test] Error stopping recognition:", e)
      }
    }

    // 停止音频播放
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    // 停止浏览器 TTS
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    // 重置所有状态
    setStatus("idle")
    setCurrentSpeaker(null)
    setCurrentText("")
    setTranscript("")
    setMessages([]) // 清空对话历史
    setSessionDuration(0)
    setElevenLabsError(null)
    lastTranscriptRef.current = ""

    console.log("[Test] Session stopped, all state reset")
  }, [])

  const toggleAudio = useCallback(() => {
    setIsAudioEnabled((prev) => !prev)
    if (audioRef.current && !isAudioEnabled) {
      audioRef.current.pause()
    }
  }, [isAudioEnabled])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="relative h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50 flex flex-col">
      {/* Top Brand Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between bg-gradient-to-b from-white/80 via-white/60 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
              AI-Counselor
            </h1>
            <p className="text-xs text-slate-600">测试版 - 无限制</p>
          </div>
        </div>

        <div className="text-xs text-slate-600 bg-white/90 px-3 py-1 rounded-full">
          无需登录 | 无时长限制
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-0 sm:p-2 pt-16 sm:pt-20 pb-32 sm:pb-32">
        <div className="relative w-full h-full sm:h-[85vh] sm:max-w-6xl">
          <VideoAvatar
            isListening={status === "listening"}
            isSpeaking={status === "speaking"}
            currentSpeaker={currentSpeaker}
            currentText={currentText}
          />

               {/* Control panel overlay - positioned at bottom center of video */}
               <div className="absolute bottom-44 sm:bottom-16 left-0 right-0 flex flex-col items-center gap-3 sm:gap-4 px-4 z-50">
                 {/* Status indicator */}
                 <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/90 backdrop-blur-md rounded-full border border-indigo-200 shadow-lg shadow-indigo-200/50">
            <div
              className={`w-2 h-2 rounded-full ${
                status === "listening"
                  ? "bg-green-400 animate-pulse"
                  : status === "processing"
                    ? "bg-yellow-400 animate-pulse"
                    : status === "speaking"
                      ? "bg-blue-400 animate-pulse"
                      : "bg-gray-400"
              }`}
            />
                   <span className="text-xs sm:text-sm font-medium text-slate-700">
              {status === "idle"
                ? "Ready"
                : status === "listening"
                  ? "Listening..."
                  : status === "processing"
                    ? "Thinking..."
                    : status === "speaking"
                      ? "Speaking..."
                      : "Ready"}
            </span>
          </div>

                 {/* Subtitle/Transcript Display */}
                 {currentText && (
                   <div className="w-full max-w-md px-4">
                     <div className="bg-black/70 backdrop-blur-md rounded-xl px-4 py-3 shadow-2xl border border-white/10">
                       <p className="text-white text-sm leading-relaxed text-center">{currentText}</p>
                     </div>
                   </div>
                 )}

                 {transcript && status === "listening" && !currentText && (
                   <div className="w-full max-w-md px-4">
                     <div className="bg-green-500/20 backdrop-blur-md rounded-xl px-4 py-2 border border-green-400/30">
                       <p className="text-green-100 text-xs text-center italic">{transcript}</p>
                     </div>
                   </div>
                 )}

                 {/* Session duration */}
                 {status !== "idle" && (
                   <p className="text-xs sm:text-sm text-indigo-700 bg-white/90 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full inline-block border border-indigo-200 shadow-md font-medium">
                     Session: {formatTime(sessionDuration)}
                   </p>
                 )}

          {/* Call button - centered like phone interface with futuristic design */}
          <div className="flex justify-center">
          {status === "idle" ? (
            <button
              onClick={startSession}
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 shadow-2xl hover:shadow-cyan-400/60 transition-all duration-300 flex items-center justify-center group overflow-hidden"
              style={{
                boxShadow: '0 0 40px rgba(6, 182, 212, 0.5), 0 0 60px rgba(59, 130, 246, 0.3), inset 0 -5px 15px rgba(0, 0, 0, 0.2)'
              }}
              aria-label="Start Conversation"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/10 to-white/20 rounded-full"></div>
              <Phone className="w-8 h-8 sm:w-10 sm:h-10 text-white group-hover:scale-125 transition-transform drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]" />
            </button>
          ) : (
            <button
              onClick={stopSession}
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-red-500 via-pink-500 to-red-600 hover:from-red-400 hover:via-pink-400 hover:to-red-500 shadow-2xl hover:shadow-red-400/60 transition-all duration-300 flex items-center justify-center group overflow-hidden"
              style={{
                boxShadow: '0 0 40px rgba(239, 68, 68, 0.5), 0 0 60px rgba(236, 72, 153, 0.3), inset 0 -5px 15px rgba(0, 0, 0, 0.2)'
              }}
              aria-label="End call"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/10 to-white/20 rounded-full"></div>
              <PhoneOff className="w-8 h-8 sm:w-10 sm:h-10 text-white group-hover:scale-125 transition-transform drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]" />
            </button>
          )}
          </div>

                 {/* Audio toggle */}
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={toggleAudio}
                   className="text-indigo-700 hover:text-indigo-900 hover:bg-white/50 backdrop-blur-sm border border-indigo-200 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                 >
            {isAudioEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />}
            {isAudioEnabled ? "Audio On" : "Audio Off"}
          </Button>
        </div>

               {/* Error messages */}
               {elevenLabsError && (
                 <div className="absolute top-20 left-4 right-4 p-3 sm:p-4 bg-red-50 backdrop-blur-sm border border-red-200 rounded-lg shadow-lg">
                   <p className="text-xs sm:text-sm text-red-700 text-center font-medium">{elevenLabsError}</p>
                 </div>
               )}
        </div>
      </div>

      {/* Bottom Brand Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-50 px-4 py-3 sm:py-4 bg-gradient-to-t from-white/80 via-white/60 to-transparent backdrop-blur-sm">
        <div className="text-center">
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            测试版本 - Powered by Groq API + ElevenLabs TTS
          </p>
          <p className="text-xs text-slate-500 mt-1">
            /test-therapy-20251115 | 顶级真人语音
          </p>
        </div>
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  )
}
