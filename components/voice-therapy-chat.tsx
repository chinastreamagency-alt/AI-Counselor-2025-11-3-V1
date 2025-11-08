"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, Phone, PhoneOff } from "lucide-react"
import { saveSession, getLastConversationSummary, type TherapySession } from "@/lib/session-storage"
import { loadUserProfile, saveUserProfile } from "@/lib/user-profile"
import { VideoAvatar } from "@/components/video-avatar"
import { LoginModal } from "@/components/login-modal"
import { PaymentModal } from "@/components/payment-modal"
import { UserAccountPage } from "@/components/user-account-page"
import { UserMenu } from "@/components/user-menu"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

type SessionStatus = "idle" | "listening" | "processing" | "speaking"

const FREE_TRIAL_DURATION = 60 // 1 minute free trial in seconds

export default function VoiceTherapyChat() {
  const [user, setUser] = useState<{
    email: string
    name: string
    image: string
    provider: string
    sessionCount: number
  } | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [freeTrialTimeLeft, setFreeTrialTimeLeft] = useState(FREE_TRIAL_DURATION)
  const [freeTrialActive, setFreeTrialActive] = useState(false)
  const [freeTrialEnded, setFreeTrialEnded] = useState(false)
  const [status, setStatus] = useState<SessionStatus>("idle")
  const [messages, setMessages] = useState<Message[]>([])
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [transcript, setTranscript] = useState("")
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [elevenLabsError, setElevenLabsError] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [sessionDuration, setSessionDuration] = useState(0)
  const [currentSpeaker, setCurrentSpeaker] = useState<"user" | "assistant" | null>(null)
  const [currentText, setCurrentText] = useState("")
  const [purchasedHours, setPurchasedHours] = useState(0)
  const [usedMinutes, setUsedMinutes] = useState(0)
  const [userSpeakingStartTime, setUserSpeakingStartTime] = useState<Date | null>(null)
  const [userSpeakingDuration, setUserSpeakingDuration] = useState(0)
  const [hasAskedToContinue, setHasAskedToContinue] = useState(false)
  const [showUserAccount, setShowUserAccount] = useState(false)
  const [showLowTimeWarning, setShowLowTimeWarning] = useState(false)
  const [sessionEndReason, setSessionEndReason] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const shouldListenRef = useRef(false)
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const userSpeakingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const freeTrialTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isAISpeakingRef = useRef(false)

  useEffect(() => {
    // 首先检查 URL 参数中是否有登录成功的标记
    const urlParams = new URLSearchParams(window.location.search)
    const loginSuccess = urlParams.get('login')
    const userEmail = urlParams.get('user')
    
    if (loginSuccess === 'success' && userEmail) {
      // 从服务器获取完整的用户信息
      fetch('/api/auth/custom-google/session')
        .then(res => res.json())
        .then(session => {
          if (session.user) {
            const userData = {
              email: session.user.email,
              name: session.user.name,
              image: session.user.image,
              provider: 'google',
              sessionCount: 0
            }
            
            // 保存到 localStorage
            localStorage.setItem("user", JSON.stringify(userData))
            setUser(userData)
            setIsLoggedIn(true)
            
            const profile = loadUserProfile(userData.email)
            setPurchasedHours(profile?.purchasedHours || 0)
            setUsedMinutes(profile?.usedMinutes || 0)
            
            // 清除 URL 参数
            window.history.replaceState({}, document.title, window.location.pathname)
          }
        })
        .catch(error => {
          console.error("Error fetching session:", error)
        })
    } else {
      // 检查 localStorage 中是否有已保存的用户信息
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
          setIsLoggedIn(true)

          const profile = loadUserProfile(parsedUser.email)
          setPurchasedHours(profile?.purchasedHours || 0)
          setUsedMinutes(profile?.usedMinutes || 0)
        } catch (error) {
          console.error("Error parsing stored user:", error)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (freeTrialActive && !isLoggedIn && freeTrialTimeLeft > 0) {
      freeTrialTimerRef.current = setInterval(() => {
        setFreeTrialTimeLeft((prev) => {
          if (prev <= 1) {
            setFreeTrialEnded(true)
            setFreeTrialActive(false)
            setShowLoginModal(true)
            stopSession()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        if (freeTrialTimerRef.current) {
          clearInterval(freeTrialTimerRef.current)
        }
      }
    }
  }, [freeTrialActive, isLoggedIn, freeTrialTimeLeft])

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onresult = (event: any) => {
        if (isAISpeakingRef.current) {
          console.log("[v0] Ignoring speech during AI playback")
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

        setTranscript(interimTranscript || finalTranscript)

        if (finalTranscript.trim()) {
          handleUserSpeech(finalTranscript.trim())
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("[v0] Speech recognition error:", event.error)
        if (event.error !== "no-speech" && event.error !== "aborted") {
          setTimeout(() => {
            if (shouldListenRef.current && !isAISpeakingRef.current) {
              try {
                recognitionRef.current?.start()
              } catch (e) {
                console.error("[v0] Error restarting recognition:", e)
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
            console.error("[v0] Error restarting recognition:", e)
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
      console.log("[v0] Not starting listening - AI is speaking")
      return
    }

    console.log("[v0] Starting to listen for user speech...")
    setStatus("listening")
    shouldListenRef.current = true
    setCurrentSpeaker(null)
    setCurrentText("")

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error("[v0] Error starting recognition:", error)
      }
    }
  }, [])

  const stopListening = useCallback(() => {
    console.log("[v0] Stopping listening")
    shouldListenRef.current = false
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error("[v0] Error stopping recognition:", error)
      }
    }
  }, [])

  const speakText = useCallback(
    async (text: string) => {
      if (!text || typeof text !== "string") {
        console.error("[v0] Invalid text for TTS:", text)
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
        console.log("[v0] Requesting ElevenLabs TTS for text:", text.substring(0, 50) + "...")

        const response = await fetch("/api/text-to-speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error("[v0] ElevenLabs TTS failed:", errorData)
          setElevenLabsError("Voice service error")
          isAISpeakingRef.current = false
          startListening()
          return
        }

        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)

        if (audioRef.current) {
          audioRef.current.src = audioUrl
          audioRef.current.onended = () => {
            console.log("[v0] Audio playback ended")
            isAISpeakingRef.current = false
            setTimeout(() => startListening(), 500)
          }
          audioRef.current.onerror = () => {
            console.error("[v0] Audio playback error")
            isAISpeakingRef.current = false
            startListening()
          }
          await audioRef.current.play()
        }

        console.log("[v0] ElevenLabs TTS playback started")
      } catch (error) {
        console.error("[v0] Error with ElevenLabs TTS:", error)
        setElevenLabsError("Network error")
        isAISpeakingRef.current = false
        startListening()
      }
    },
    [startListening, stopListening],
  )

  const handleUserSpeech = useCallback(
    async (text: string) => {
      if (!text.trim()) return

      if (!isLoggedIn && freeTrialEnded) {
        setShowLoginModal(true)
        return
      }

      setUserSpeakingStartTime(null)
      setUserSpeakingDuration(0)
      setHasAskedToContinue(false)
      if (userSpeakingTimerRef.current) {
        clearInterval(userSpeakingTimerRef.current)
      }

      shouldListenRef.current = false
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          console.error("[v0] Error stopping recognition:", e)
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
        const lastSummary = currentSessionId ? getLastConversationSummary(currentSessionId) : null

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            lastSummary,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to get AI response")
        }

        const data = await response.json()
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, aiMessage])

        if (isAudioEnabled) {
          await speakText(data.message)
        } else {
          startListening()
        }
      } catch (error) {
        console.error("[v0] Error processing speech:", error)
        setStatus("idle")
        startListening()
      }
    },
    [messages, currentSessionId, isAudioEnabled, speakText, startListening, isLoggedIn, freeTrialEnded],
  )

  const startSession = useCallback(() => {
    const sessionId = Date.now().toString()
    setCurrentSessionId(sessionId)
    setSessionStartTime(new Date())
    setMessages([])
    setSessionDuration(0)
    setSessionEndReason(null)

    if (!isLoggedIn) {
      setFreeTrialActive(true)
      setFreeTrialTimeLeft(FREE_TRIAL_DURATION)
    }

    sessionTimerRef.current = setInterval(() => {
      setSessionDuration((prev) => prev + 1)
    }, 1000)

    const greeting = "Hello, I'm your AI counselor. How are you feeling today?"
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
  }, [isAudioEnabled, speakText, startListening, isLoggedIn])

  const stopSession = useCallback(() => {
    shouldListenRef.current = false
    isAISpeakingRef.current = false

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.error("[v0] Error stopping recognition:", e)
      }
    }

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current)
    }

    if (freeTrialTimerRef.current) {
      clearInterval(freeTrialTimerRef.current)
    }

    setStatus("idle")
    setCurrentSpeaker(null)
    setCurrentText("")
    setFreeTrialActive(false)

    if (currentSessionId && sessionStartTime && messages.length > 0) {
      const session: TherapySession = {
        id: currentSessionId,
        startTime: sessionStartTime,
        endTime: new Date(),
        duration: sessionDuration,
        messages,
        userEmail: user?.email || "guest",
      }
      saveSession(session)

      if (user) {
        const profile = loadUserProfile(user.email)
        const newUsedMinutes = (profile?.usedMinutes || 0) + Math.ceil(sessionDuration / 60)
        saveUserProfile(user.email, {
          ...profile,
          usedMinutes: newUsedMinutes,
          sessionCount: (profile?.sessionCount || 0) + 1,
        })
        setUsedMinutes(newUsedMinutes)
      }
    }

    setCurrentSessionId(null)
    setSessionStartTime(null)
  }, [currentSessionId, sessionStartTime, sessionDuration, messages, user])

  const handleLogin = useCallback((email: string) => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      setIsLoggedIn(true)

      const profile = loadUserProfile(parsedUser.email)
      setPurchasedHours(profile?.purchasedHours || 0)
      setUsedMinutes(profile?.usedMinutes || 0)

      setFreeTrialEnded(false)
      setFreeTrialActive(false)
      setFreeTrialTimeLeft(FREE_TRIAL_DURATION)
    }
    setShowLoginModal(false)
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem("user")
    setUser(null)
    setIsLoggedIn(false)
    setPurchasedHours(0)
    setUsedMinutes(0)
    stopSession()
  }, [stopSession])

  const handleSocialLogin = useCallback((provider: string) => {
    console.log(`[v0] Social login with ${provider}`)
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
    <div className="relative min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      {/* Video Avatar - centered and large */}
      <div className="w-full max-w-2xl">
        <div className="relative mb-8">
          <VideoAvatar
            isListening={status === "listening"}
            isSpeaking={status === "speaking"}
            currentSpeaker={currentSpeaker}
            currentText={currentText}
          />
        </div>

        {/* Status indicator */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
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
            <span className="text-sm font-medium text-white">
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
        </div>

        {/* Free trial timer */}
        {!isLoggedIn && freeTrialActive && (
          <div className="text-center mb-4">
            <p className="text-sm text-white/80 font-medium">Free trial: {formatTime(freeTrialTimeLeft)}</p>
          </div>
        )}

        {/* Session duration */}
        {status !== "idle" && (
          <div className="text-center mb-4">
            <p className="text-sm text-white/70">Session: {formatTime(sessionDuration)}</p>
            {transcript && <p className="text-xs text-white/50 mt-2">{transcript}</p>}
          </div>
        )}

        {/* Call button - centered like phone interface */}
        <div className="flex justify-center mb-6">
          {status === "idle" ? (
            <button
              onClick={startSession}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 flex items-center justify-center group"
              aria-label="Start Conversation"
            >
              <Phone className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
            </button>
          ) : (
            <button
              onClick={stopSession}
              className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 shadow-2xl hover:shadow-red-500/50 transition-all duration-300 flex items-center justify-center group"
              aria-label="End call"
            >
              <PhoneOff className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        {/* Audio toggle */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAudio}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            {isAudioEnabled ? <Volume2 className="w-5 h-5 mr-2" /> : <VolumeX className="w-5 h-5 mr-2" />}
            {isAudioEnabled ? "Audio On" : "Audio Off"}
          </Button>
        </div>

        {/* Error messages */}
        {elevenLabsError && (
          <div className="text-center mt-4 p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-lg">
            <p className="text-sm text-red-200">{elevenLabsError}</p>
          </div>
        )}
      </div>

      {/* Login button - top right corner */}
      <div className="absolute top-4 right-4 z-50">
        {isLoggedIn && user ? (
          <UserMenu
            user={user}
            purchasedHours={purchasedHours}
            usedMinutes={usedMinutes}
            onViewAccount={() => setShowUserAccount(true)}
            onLogout={handleLogout}
          />
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowLoginModal(true)}
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
          >
            Login / Register
          </Button>
        )}
      </div>

      {/* Modals */}
      <audio ref={audioRef} className="hidden" />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
        onSocialLogin={handleSocialLogin}
        message={
          freeTrialEnded
            ? "Your free 1-minute trial has ended. Please sign in to continue."
            : "Sign in to save your progress and access unlimited sessions"
        }
      />

      {showPaymentModal && <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} />}

      {showUserAccount && user && (
        <UserAccountPage
          user={user}
          purchasedHours={purchasedHours}
          usedMinutes={usedMinutes}
          onClose={() => setShowUserAccount(false)}
        />
      )}
    </div>
  )
}
