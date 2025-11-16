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

// 字幕显示的句子队列
type SubtitleSentence = {
  text: string
  startTime: number
  duration: number
}

export default function VoiceTherapyTestPage() {
  const [status, setStatus] = useState<SessionStatus>("idle")
  const [messages, setMessages] = useState<Message[]>([])
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [transcript, setTranscript] = useState("")
  const [sessionDuration, setSessionDuration] = useState(0)
  const [currentSpeaker, setCurrentSpeaker] = useState<"user" | "assistant" | null>(null)
  const [currentText, setCurrentText] = useState("")
  const [displayedSubtitle, setDisplayedSubtitle] = useState<string[]>([]) // 改为数组，最多显示5行
  const [elevenLabsError, setElevenLabsError] = useState<string | null>(null)
  const [waitingCountdown, setWaitingCountdown] = useState(0) // 倒计时：2秒等待（更灵敏）
  const [isUserSpeaking, setIsUserSpeaking] = useState(false) // 用户是否正在说话
  const [isAudioPlaying, setIsAudioPlaying] = useState(false) // 音频是否真正播放

  // Whisper 录音相关 refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioStreamRef = useRef<MediaStream | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const audioRef = useRef<HTMLAudioElement>(null)
  const shouldListenRef = useRef(false)
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isAISpeakingRef = useRef(false)
  const testUserId = useRef(`test-${Date.now()}`)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastTranscriptRef = useRef("")
  const subtitleTimerRef = useRef<NodeJS.Timeout | null>(null) // 字幕滚动计时器
  const currentSentenceIndexRef = useRef(0) // 当前显示到第几句
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null) // 2秒倒计时计时器
  const audioDurationRef = useRef(0) // 音频总时长（秒）
  const lastSpeechTimeRef = useRef<number>(Date.now()) // 上次检测到语音的时间

  // 将文本分割成单词，用于逐字显示（模拟真实TTS速度）
  const splitIntoWords = (text: string): string[] => {
    return text.split(' ').filter(w => w.length > 0)
  }

  // 智能字幕显示 - 根据音频时长精确同步
  const displaySubtitlesSyncWithSpeech = useCallback((fullText: string, audioDuration: number) => {
    const words = splitIntoWords(fullText)
    if (words.length === 0) return

    let currentWordIndex = 0
    setDisplayedSubtitle([]) // 清空之前的字幕

    // 计算每个单词的显示时间（音频时长/单词数）
    const msPerWord = (audioDuration * 1000) / words.length

    const showNextWord = () => {
      if (currentWordIndex >= words.length) {
        if (subtitleTimerRef.current) {
          clearInterval(subtitleTimerRef.current)
        }
        return
      }

      const word = words[currentWordIndex]

      setDisplayedSubtitle(prev => {
        const currentText = prev.join(' ') + (prev.length > 0 ? ' ' : '') + word

        // 每行35个字符（更宽，显示更多内容），最多5行
        const maxCharsPerLine = 35
        const lines: string[] = []
        let currentLine = ''

        currentText.split(' ').forEach(w => {
          if ((currentLine + ' ' + w).length > maxCharsPerLine && currentLine.length > 0) {
            lines.push(currentLine)
            currentLine = w
          } else {
            currentLine = currentLine.length > 0 ? currentLine + ' ' + w : w
          }
        })

        if (currentLine) {
          lines.push(currentLine)
        }

        // 只保留最后5行
        return lines.slice(-5)
      })

      currentWordIndex++
    }

    // 根据音频时长动态调整显示速度
    console.log(`[Subtitle] Audio duration: ${audioDuration}s, Words: ${words.length}, Speed: ${msPerWord}ms/word`)
    subtitleTimerRef.current = setInterval(showNextWord, msPerWord)
  }, [])

  // ==================== Whisper 语音识别（替代 Web Speech API）====================

  // 发送音频到 Whisper API
  const sendToWhisper = useCallback(async (audioBlob: Blob) => {
    if (audioBlob.size < 1000) {
      console.log("[Whisper] Audio too short, skipping")
      return
    }

    try {
      console.log("[Whisper] Sending audio to API:", audioBlob.size, "bytes")

      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const response = await fetch('/api/groq-whisper', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        console.error("[Whisper] API error:", response.status)
        return
      }

      const data = await response.json()
      const recognizedText = data.text?.trim()

      if (recognizedText && recognizedText.length > 0) {
        console.log("[Whisper] Recognized:", recognizedText)

        // 累积识别文本
        lastTranscriptRef.current += recognizedText + " "
        setTranscript(lastTranscriptRef.current)
        setIsUserSpeaking(true)
        lastSpeechTimeRef.current = Date.now()

        // 重置倒计时
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current)
        }
        setWaitingCountdown(0)
      }
    } catch (error) {
      console.error("[Whisper] Error:", error)
    }
  }, [])

  // 开始录音（使用 MediaRecorder）
  const startListening = useCallback(async () => {
    if (isAISpeakingRef.current) {
      console.log("[Whisper] Not starting - AI is speaking")
      return
    }

    console.log("[Whisper] Starting recording...")
    setStatus("listening")
    shouldListenRef.current = true
    setCurrentSpeaker(null)
    setCurrentText("")

    try {
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })

      audioStreamRef.current = stream

      // 创建 MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      // 收集音频数据
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && shouldListenRef.current) {
          const audioBlob = event.data
          // 异步发送到 Whisper API
          sendToWhisper(audioBlob)
        }
      }

      // 每 2 秒生成一个音频片段并发送
      mediaRecorder.start(2000)

      // 检测静默
      recordingIntervalRef.current = setInterval(() => {
        if (!shouldListenRef.current) return

        const timeSinceLastSpeech = Date.now() - lastSpeechTimeRef.current

        // 如果 2 秒内没有新语音，开始倒计时
        if (timeSinceLastSpeech > 2000 && lastTranscriptRef.current.trim()) {
          setIsUserSpeaking(false)

          // 开始 2 秒倒计时
          if (countdownTimerRef.current === null) {
            setWaitingCountdown(2)
            setTranscript("") // 清空显示，改为显示倒计时

            let countdown = 2
            countdownTimerRef.current = setInterval(() => {
              countdown--
              setWaitingCountdown(countdown)

              if (countdown <= 0) {
                if (countdownTimerRef.current) {
                  clearInterval(countdownTimerRef.current)
                  countdownTimerRef.current = null
                }

                // 倒计时结束，发送给 AI
                console.log("[Whisper] Sending to AI:", lastTranscriptRef.current)
                handleUserSpeech(lastTranscriptRef.current.trim())
                lastTranscriptRef.current = ""
                setWaitingCountdown(0)
              }
            }, 1000)
          }
        }
      }, 500)

      console.log("[Whisper] Recording started successfully")
    } catch (error) {
      console.error("[Whisper] Microphone access error:", error)
      setStatus("idle")
      alert("无法访问麦克风，请检查浏览器权限设置")
    }
  }, [sendToWhisper])

  // 停止录音
  const stopListening = useCallback(() => {
    console.log("[Whisper] Stopping recording")
    shouldListenRef.current = false

    // 清除定时器
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }

    // 停止 MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    // 停止音频流
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop())
      audioStreamRef.current = null
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

      // 初始状态：processing（思考中）
      setStatus("processing")
      setIsAudioPlaying(false)
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

          // 监听音频加载完成，获取时长
          audioRef.current.onloadedmetadata = () => {
            if (audioRef.current) {
              audioDurationRef.current = audioRef.current.duration
              console.log("[Test] Audio duration:", audioDurationRef.current, "seconds")
            }
          }

          // 监听音频开始播放事件 - 智能同步
          audioRef.current.onplay = () => {
            console.log("[Test] Audio started playing, starting subtitles")
            setStatus("speaking") // 音频真正播放时才改为 speaking
            setIsAudioPlaying(true)
            // 音频开始播放时，根据音频时长同步显示字幕
            displaySubtitlesSyncWithSpeech(text, audioDurationRef.current || 5)
          }

          audioRef.current.onended = () => {
            console.log("[Test] Audio playback ended")
            isAISpeakingRef.current = false
            setIsAudioPlaying(false)
            setDisplayedSubtitle([]) // 清空字幕
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
    [startListening, stopListening, displaySubtitlesSyncWithSpeech],
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
        setDisplayedSubtitle([]) // 清空字幕
        setTimeout(() => startListening(), 500)
      }

      utterance.onerror = () => {
        console.error("[Test] Browser TTS error")
        isAISpeakingRef.current = false
        setDisplayedSubtitle([]) // 清空字幕
        startListening()
      }

      window.speechSynthesis.speak(utterance)
    } else {
      console.error("[Test] Browser TTS not supported")
      isAISpeakingRef.current = false
      setDisplayedSubtitle([]) // 清空字幕
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

    const greeting = "Hello, I'm Arina, your AI counselor. How are you feeling today?"
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
    console.log("[Whisper] Stopping session and resetting all state")

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

    if (subtitleTimerRef.current) {
      clearInterval(subtitleTimerRef.current)
      subtitleTimerRef.current = null
    }

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }

    // 停止 MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch (e) {
        console.error("[Whisper] Error stopping MediaRecorder:", e)
      }
    }

    // 停止音频流
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop())
      audioStreamRef.current = null
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
    setDisplayedSubtitle([]) // 清空字幕
    setWaitingCountdown(0) // 清空倒计时
    lastTranscriptRef.current = ""
    currentSentenceIndexRef.current = 0

    console.log("[Whisper] Session stopped, all state reset")
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

               {/* Control panel overlay - positioned at TOP (forehead area) */}
               <div className="absolute top-12 sm:top-16 left-0 right-0 flex flex-col items-center gap-2 px-4 z-50">
                 {/* Status indicator */}
                 <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 bg-white/90 backdrop-blur-md rounded-full border border-indigo-200 shadow-lg">
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
                   <span className="text-xs font-medium text-slate-700">
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

                 {/* AI 思考中的加载动画 */}
                 {status === "processing" && (
                   <div className="w-[85%] max-w-sm px-2">
                     <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 backdrop-blur-md rounded-lg px-4 py-2 border border-purple-400/30 shadow-lg">
                       <div className="flex items-center justify-center gap-2">
                         <div className="flex gap-1">
                           <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                           <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                           <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                         </div>
                         <span className="text-purple-100 text-xs font-medium">AI is thinking...</span>
                       </div>
                     </div>
                   </div>
                 )}

                 {/* 等待用户说完话 - 2秒倒计时（只在停止说话后显示）*/}
                 {waitingCountdown > 0 && status === "listening" && (
                   <div className="w-[85%] max-w-sm px-2">
                     <div className="bg-gradient-to-r from-blue-500/20 to-green-500/20 backdrop-blur-md rounded-lg px-3 py-2 border border-blue-400/30 shadow-lg">
                       <div className="flex items-center justify-center gap-2">
                         <div className="relative">
                           <div className="w-8 h-8 rounded-full border-3 border-blue-300/30"></div>
                           <div className="absolute inset-0 flex items-center justify-center">
                             <span className="text-base font-bold text-blue-400">{waitingCountdown}</span>
                           </div>
                         </div>
                         <span className="text-blue-100 text-[10px] font-medium">
                           Processing in {waitingCountdown}s...
                         </span>
                       </div>
                     </div>
                   </div>
                 )}

                 {/* AI 说话字幕 - 逐字显示，最多5行，更宽显示 */}
                 {displayedSubtitle.length > 0 && status === "speaking" && (
                   <div className="w-[92%] sm:w-[75%] max-w-2xl px-2">
                     <div className="bg-black/85 backdrop-blur-md rounded-md px-3 py-1.5 shadow-2xl border border-white/10">
                       <div className="space-y-0.5">
                         {displayedSubtitle.map((line, index) => (
                           <p
                             key={index}
                             className="text-white text-[11px] sm:text-xs leading-snug text-center break-words"
                           >
                             {line}
                           </p>
                         ))}
                       </div>
                     </div>
                   </div>
                 )}

                 {/* 用户说话字幕 - 只在正在说话且没有倒计时时显示 */}
                 {transcript && status === "listening" && waitingCountdown === 0 && isUserSpeaking && (
                   <div className="w-[85%] max-w-sm px-2">
                     <div className="bg-green-500/20 backdrop-blur-md rounded-md px-3 py-1.5 border border-green-400/30">
                       <p className="text-green-100 text-[10px] leading-snug text-center italic break-words">{transcript}</p>
                     </div>
                   </div>
                 )}

                 {/* Session duration */}
                 {status !== "idle" && (
                   <p className="text-[10px] text-indigo-700 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full inline-block border border-indigo-200 shadow-sm font-medium">
                     Session: {formatTime(sessionDuration)}
                   </p>
                 )}
        </div>

          {/* Call button - centered at bottom, higher position for mobile browsers */}
          <div className="absolute bottom-20 sm:bottom-12 left-0 right-0 flex flex-col items-center gap-2 z-50 pb-safe">
          {status === "idle" ? (
            <button
              onClick={startSession}
              className="relative w-16 h-16 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 shadow-2xl hover:shadow-cyan-400/60 transition-all duration-300 flex items-center justify-center group overflow-hidden"
              style={{
                boxShadow: '0 0 40px rgba(6, 182, 212, 0.5), 0 0 60px rgba(59, 130, 246, 0.3), inset 0 -5px 15px rgba(0, 0, 0, 0.2)'
              }}
              aria-label="Start Conversation"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/10 to-white/20 rounded-full"></div>
              <Phone className="w-7 h-7 sm:w-6 sm:h-6 text-white group-hover:scale-125 transition-transform drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]" />
            </button>
          ) : (
            <button
              onClick={stopSession}
              className="relative w-16 h-16 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-red-500 via-pink-500 to-red-600 hover:from-red-400 hover:via-pink-400 hover:to-red-500 shadow-2xl hover:shadow-red-400/60 transition-all duration-300 flex items-center justify-center group overflow-hidden"
              style={{
                boxShadow: '0 0 40px rgba(239, 68, 68, 0.5), 0 0 60px rgba(236, 72, 153, 0.3), inset 0 -5px 15px rgba(0, 0, 0, 0.2)'
              }}
              aria-label="End call"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/10 to-white/20 rounded-full"></div>
              <PhoneOff className="w-7 h-7 sm:w-6 sm:h-6 text-white group-hover:scale-125 transition-transform drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]" />
            </button>
          )}

                 {/* Audio toggle */}
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={toggleAudio}
                   className="text-indigo-700 hover:text-indigo-900 hover:bg-white/50 backdrop-blur-sm border border-indigo-200 text-[10px] px-2 py-1"
                 >
            {isAudioEnabled ? <Volume2 className="w-3 h-3 mr-1" /> : <VolumeX className="w-3 h-3 mr-1" />}
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
