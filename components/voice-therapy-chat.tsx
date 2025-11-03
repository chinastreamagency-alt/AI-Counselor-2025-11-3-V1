"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { MicOff, Volume2, VolumeX, TestTube } from "lucide-react"
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

export default function VoiceTherapyChat() {
  const [user, setUser] = useState<{
    email: string
    name: string
    image: string
    provider: string
    sessionCount: number
  } | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isTestMode, setIsTestMode] = useState(false)
  const [testModeNeedsPayment, setTestModeNeedsPayment] = useState(false)

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
  const [userSpeakingStartTime, setUserSpeakingStartTime] = useState<number | null>(null)
  const [userSpeakingDuration, setUserSpeakingDuration] = useState(0)
  const [hasAskedToContinue, setHasAskedToContinue] = useState(false)
  const [showUserAccount, setShowUserAccount] = useState(false)
  const [showLowTimeWarning, setShowLowTimeWarning] = useState(false)
  const [sessionEndReason, setSessionEndReason] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const shouldListenRef = useRef(false)
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const userSpeakingTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        setIsLoggedIn(true)
      } catch (error) {
        console.error("[v0] Error parsing stored user:", error)
      }
    }
  }, [])

  const startListening = useCallback(() => {
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

  const speakText = useCallback(
    async (text: string) => {
      if (!text || typeof text !== "string") {
        console.error("[v0] Invalid text for TTS:", text)
        startListening()
        return
      }

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
          startListening()
          return
        }

        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)

        if (audioRef.current) {
          audioRef.current.src = audioUrl
          audioRef.current.onended = () => {
            console.log("[v0] Audio playback ended, starting to listen...")
            startListening()
          }
          audioRef.current.onpause = () => {
            if (audioRef.current && audioRef.current.currentTime > 0 && !audioRef.current.ended) {
              console.log("[v0] Audio was interrupted by user")
              startListening()
            }
          }
          await audioRef.current.play()
        }

        console.log("[v0] ElevenLabs TTS playback started")
      } catch (error) {
        console.error("[v0] Error with ElevenLabs TTS:", error)
        setElevenLabsError("Network error")
        startListening()
      }
    },
    [startListening],
  )

  const handleUserSpeech = useCallback(
    async (text: string) => {
      if (!text.trim()) return

      setUserSpeakingStartTime(null)
      setUserSpeakingDuration(0)
      setHasAskedToContinue(false)
      if (userSpeakingTimerRef.current) {
        clearInterval(userSpeakingTimerRef.current)
      }

      shouldListenRef.current = false
      recognitionRef.current?.stop()

      setStatus("processing")
      setTranscript("")

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text,
        timestamp: new Date(),
      }

      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)

      try {
        const response = await fetch("/api/therapy-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            userProfile: user,
          }),
        })

        if (!response.ok) {
          console.error("[v0] Therapy chat API error:", response.status)
          throw new Error(`API request failed with status ${response.status}`)
        }

        const data = await response.json()

        if (!data || !data.message) {
          console.error("[v0] Invalid response data:", data)
          throw new Error("Invalid response from therapy chat API")
        }

        if (data.profileUpdate && user) {
          const updatedProfile = {
            ...user,
            ...data.profileUpdate,
          }
          setUser(updatedProfile)
          saveUserProfile(updatedProfile)
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])

        if (isAudioEnabled) {
          await speakText(data.message)
        } else {
          startListening()
        }
      } catch (error) {
        console.error("Error processing speech:", error)
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered a technical issue. Please try again.",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
        startListening()
      }
    },
    [messages, user, isAudioEnabled, speakText, startListening],
  )

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = ""
      recognitionRef.current.maxAlternatives = 3

      recognitionRef.current.onstart = () => {
        console.log("[v0] Speech recognition started")
        setUserSpeakingStartTime(Date.now())
        setHasAskedToContinue(false)
      }

      recognitionRef.current.onresult = (event: any) => {
        console.log("[v0] Speech recognition result received")
        if (status === "speaking" && audioRef.current && !audioRef.current.paused) {
          console.log("[v0] User interrupted AI, stopping audio playback")
          audioRef.current.pause()
          audioRef.current.currentTime = 0
          setStatus("listening")
        }

        let interimTranscript = ""
        let finalTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        const displayTranscript = interimTranscript || finalTranscript
        setTranscript(displayTranscript)
        setCurrentSpeaker("user")
        setCurrentText(displayTranscript)
        console.log("[v0] Transcript:", displayTranscript)

        if (finalTranscript && finalTranscript.trim().length > 0) {
          console.log("[v0] Final transcript captured:", finalTranscript)
          handleUserSpeech(finalTranscript.trim())
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("[v0] Speech recognition error:", event.error)
        if (event.error === "no-speech") {
          console.log("[v0] No speech detected, continuing to listen...")
        }
      }

      recognitionRef.current.onend = () => {
        console.log("[v0] Speech recognition ended, shouldListen:", shouldListenRef.current)
        if (shouldListenRef.current) {
          console.log("[v0] Restarting speech recognition...")
          try {
            recognitionRef.current?.start()
          } catch (error) {
            console.error("[v0] Error restarting recognition:", error)
          }
        }
      }
    }

    return () => {
      shouldListenRef.current = false
      recognitionRef.current?.stop()
    }
  }, [status, handleUserSpeech])

  useEffect(() => {
    if (userSpeakingStartTime && status === "listening") {
      userSpeakingTimerRef.current = setInterval(() => {
        const duration = Math.floor((Date.now() - userSpeakingStartTime) / 1000)
        setUserSpeakingDuration(duration)

        if (duration >= 120 && !hasAskedToContinue) {
          console.log("[v0] User has been speaking for 2 minutes, asking to continue")
          setHasAskedToContinue(true)
          const checkMessage =
            "You seem to have more to share. Would you like to continue? I can wait for you to finish."
          speakText(checkMessage)
        } else if (duration >= 300 && duration < 305) {
          console.log("[v0] User has been speaking for 5 minutes, asking again")
          const checkMessage = "Take your time. I'm here to listen whenever you're ready to continue or finish."
          speakText(checkMessage)
        }
      }, 1000)
    }

    return () => {
      if (userSpeakingTimerRef.current) {
        clearInterval(userSpeakingTimerRef.current)
      }
    }
  }, [userSpeakingStartTime, status, hasAskedToContinue, speakText])

  useEffect(() => {
    if (status !== "idle" && !isLoggedIn && sessionStartTime && !isTestMode) {
      sessionTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000)
        setSessionDuration(elapsed)

        if (elapsed >= 60 && !showLoginModal) {
          console.log("[v0] 1 minute elapsed, showing login modal")
          setShowLoginModal(true)
          shouldListenRef.current = false
          recognitionRef.current?.stop()
          audioRef.current?.pause()
        }
      }, 1000)
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current)
      }
    }
  }, [status, isLoggedIn, sessionStartTime, showLoginModal, isTestMode])

  useEffect(() => {
    if (status !== "idle" && isLoggedIn && sessionStartTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000 / 60)
        setUsedMinutes(elapsed)

        const remainingMinutes = purchasedHours * 60 - elapsed

        if (remainingMinutes <= 1 && remainingMinutes > 0) {
          setShowLowTimeWarning(true)
          if (!showPaymentModal) {
            setShowPaymentModal(true)
          }
        } else {
          setShowLowTimeWarning(false)
        }

        // End session when time runs out
        if (remainingMinutes <= 0) {
          console.log("[v0] User ran out of time, ending session")
          setSessionEndReason("This call ended due to insufficient time. Remaining time: 0 minutes")
          stopSession()
          setShowPaymentModal(true)
        }
      }, 60000)

      return () => clearInterval(interval)
    }
  }, [status, isLoggedIn, sessionStartTime, purchasedHours, showPaymentModal])

  const stopSession = () => {
    if (currentSessionId && sessionStartTime) {
      const endTime = new Date()
      const duration = Math.floor((endTime.getTime() - sessionStartTime.getTime()) / 1000)

      const session: TherapySession = {
        id: currentSessionId,
        startTime: sessionStartTime,
        endTime,
        duration,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        })),
        userId: user?.email || "default-user",
      }
      saveSession(session)
    }

    setStatus("idle")
    setCurrentSessionId(null)
    setSessionStartTime(null)
    shouldListenRef.current = false
    recognitionRef.current?.stop()
    audioRef.current?.pause()
    setCurrentSpeaker(null)
    setCurrentText("")
    setShowLowTimeWarning(false)

    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current)
    }
    setSessionDuration(0)
  }

  const startSession = () => {
    const sessionId = `session_${Date.now()}`
    const startTime = new Date()

    setCurrentSessionId(sessionId)
    setSessionStartTime(startTime)
    setStatus("speaking")
    setMessages([])
    setTranscript("")
    setElevenLabsError(null)
    setSessionDuration(0)
    setCurrentSpeaker(null)
    setCurrentText("")
    setSessionEndReason(null)
    setShowLowTimeWarning(false)

    const userId = user?.email || "default-user"
    const profile = loadUserProfile(userId)
    setUser(profile)

    const lastConversation = getLastConversationSummary(userId)

    let greeting: string

    if (lastConversation.length > 0 && profile.sessionCount > 0) {
      const summary = lastConversation.join(". ")
      greeting = `Welcome back! I've restored your previous conversation. We were discussing: ${summary}. Would you like to continue from where we left off?`
    } else if (user && user.sessionCount > 0) {
      greeting = user.name
        ? `Welcome back, ${user.name}! It's great to see you again. What would you like to talk about today?`
        : `Welcome back! It's great to see you again. What's on your mind today?`
    } else {
      greeting =
        "Hi! I'm Aria, your personal AI counselor. It's wonderful to meet you. I'm here to listen and support you. How are you feeling today?"
    }

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
  }

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled)
    if (isAudioEnabled && audioRef.current) {
      audioRef.current.pause()
    }
  }

  const handleLogin = async (email: string) => {
    console.log("[v0] User logged in with email:", email)
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      setIsLoggedIn(true)
    }
    setShowLoginModal(false)

    if (testModeNeedsPayment) {
      console.log("[v0] Login completed from test mode, enabling test mode and showing payment modal")
      setIsTestMode(true)
      setTestModeNeedsPayment(false)
      setShowPaymentModal(true)
    } else {
      setShowPaymentModal(true)
    }
  }

  const handleSocialLogin = async (provider: string) => {
    console.log("[v0] User logged in with:", provider)
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      setIsLoggedIn(true)
    }
    setShowLoginModal(false)

    if (testModeNeedsPayment) {
      console.log("[v0] Social login completed from test mode, enabling test mode and showing payment modal")
      setIsTestMode(true)
      setTestModeNeedsPayment(false)
      setShowPaymentModal(true)
    } else {
      setShowPaymentModal(true)
    }
  }

  const handlePaymentSuccess = (hours: number) => {
    console.log("[v0] User purchased", hours, "hours")
    setPurchasedHours((prev) => prev + hours)
    setShowPaymentModal(false)
    setSessionEndReason(null)

    if (status === "idle") {
      startSession()
    } else if (status === "listening" || status === "processing") {
      startListening()
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    setUser(null)
    setIsLoggedIn(false)
    setPurchasedHours(0)
    setUsedMinutes(0)
    if (status !== "idle") {
      stopSession()
    }
  }

  const handleTestModeToggle = () => {
    const newTestMode = !isTestMode

    if (newTestMode) {
      if (!isLoggedIn) {
        console.log("[v0] Test mode enabled but user not logged in, showing login modal")
        setTestModeNeedsPayment(true)
        setShowLoginModal(true)
        return
      } else {
        console.log("[v0] Test mode enabled and user logged in, showing payment modal")
        setIsTestMode(true)
        setShowPaymentModal(true)
      }
    } else {
      setIsTestMode(false)
      setTestModeNeedsPayment(false)
    }
  }

  if (showUserAccount && status === "idle") {
    return (
      <UserAccountPage
        user={user}
        purchasedHours={purchasedHours}
        usedMinutes={usedMinutes}
        onClose={() => setShowUserAccount(false)}
      />
    )
  }

  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute bottom-4 left-4 z-10">
        <Button
          onClick={handleTestModeToggle}
          variant="outline"
          size="sm"
          className={`${isTestMode ? "bg-green-500/20 border-green-500/50 text-green-300" : "bg-white/10 border-white/20 text-white/70"} backdrop-blur-sm hover:bg-white/20`}
        >
          <TestTube className="w-4 h-4 mr-2" />
          {isTestMode ? "Test Mode ON" : "Test Mode OFF"}
        </Button>
      </div>

      <div className="relative w-full h-full md:w-[80%] md:h-[85%] md:max-w-[900px] lg:w-[65%] lg:h-[80%] lg:max-w-[1200px] md:rounded-3xl md:shadow-2xl overflow-hidden">
        <div className="relative flex-1 w-full h-full">
          <VideoAvatar status={status} />

          <div className="absolute top-16 sm:top-20 md:top-24 right-4 z-10">
            <UserMenu
              user={user}
              isLoggedIn={isLoggedIn}
              onOpenAccount={() => setShowUserAccount(true)}
              onOpenLogin={() => setShowLoginModal(true)}
              onLogout={handleLogout}
            />
          </div>

          <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none">
            {showLowTimeWarning && status !== "idle" && (
              <div className="pointer-events-auto mb-4 bg-yellow-500/20 backdrop-blur-md border border-yellow-500/30 rounded-2xl p-4 max-w-2xl mx-auto">
                <p className="text-sm text-yellow-200 text-center">
                  ⚠️ Your service time is about to expire.{" "}
                  {isLoggedIn
                    ? "Please purchase more time to continue."
                    : "Please log in and purchase more time to continue."}
                </p>
              </div>
            )}

            {sessionEndReason && status === "idle" && (
              <div className="pointer-events-auto mb-4 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-2xl p-4 max-w-2xl mx-auto">
                <p className="text-sm text-red-200 text-center">{sessionEndReason}</p>
              </div>
            )}

            <div className="pointer-events-auto mb-4 sm:mb-6 max-h-[40vh] overflow-y-auto">
              {currentText && (
                <div className="bg-black/70 backdrop-blur-md rounded-2xl p-4 sm:p-6 max-w-2xl mx-auto">
                  <p className="text-xs sm:text-sm font-medium text-white/70 mb-2 text-center">
                    {currentSpeaker === "user" ? "You" : "Aria"}
                  </p>
                  <p className="text-base sm:text-lg leading-relaxed text-white text-center break-words">
                    {currentText}
                  </p>
                  {currentSpeaker === "user" && userSpeakingDuration > 60 && (
                    <p className="text-xs text-white/50 mt-2 text-center">
                      Speaking for {Math.floor(userSpeakingDuration / 60)}:
                      {(userSpeakingDuration % 60).toString().padStart(2, "0")}
                    </p>
                  )}
                </div>
              )}
              {!currentText && status !== "idle" && (
                <div className="bg-black/70 backdrop-blur-md rounded-2xl p-3 sm:p-4 max-w-md mx-auto">
                  <p className="text-sm sm:text-base text-white/70 text-center">
                    {status === "listening" && "Listening..."}
                    {status === "processing" && "Thinking..."}
                    {status === "speaking" && "Speaking..."}
                  </p>
                </div>
              )}
            </div>

            <div className="pointer-events-auto flex justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              {status === "idle" ? (
                <Button
                  size="lg"
                  onClick={startSession}
                  className="px-8 sm:px-10 py-6 sm:py-7 text-lg sm:text-xl font-semibold rounded-full shadow-2xl hover:shadow-3xl transition-all bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white border-0"
                >
                  Start Conversation
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={stopSession}
                    className="px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-full shadow-xl hover:shadow-2xl transition-all bg-red-500 hover:bg-red-600"
                  >
                    <MicOff className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    End
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={toggleAudio}
                    className="px-5 sm:px-6 py-5 sm:py-6 rounded-full bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white"
                  >
                    {isAudioEnabled ? (
                      <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </Button>
                </>
              )}
            </div>

            {status !== "idle" && !isLoggedIn && sessionDuration > 0 && !isTestMode && (
              <div className="pointer-events-auto text-center mb-3 sm:mb-4">
                <div className="inline-block bg-black/70 backdrop-blur-md rounded-full px-4 sm:px-6 py-2 sm:py-3">
                  <p className="text-xs sm:text-sm text-white/90">
                    Free trial remaining: {Math.floor((60 - sessionDuration) / 60)}:
                    {((60 - sessionDuration) % 60).toString().padStart(2, "0")}
                    {sessionDuration >= 50 && " • Ending soon"}
                  </p>
                </div>
              </div>
            )}

            {status !== "idle" && isTestMode && (
              <div className="pointer-events-auto text-center mb-3 sm:mb-4">
                <div className="inline-block bg-green-500/20 backdrop-blur-md rounded-full px-4 sm:px-6 py-2 sm:py-3 border border-green-500/30">
                  <p className="text-xs sm:text-sm text-green-300">🧪 Test Mode Active - No time limit</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <audio ref={audioRef} className="hidden" />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false)
          setTestModeNeedsPayment(false)
        }}
        onLogin={handleLogin}
        onSocialLogin={handleSocialLogin}
        message={testModeNeedsPayment ? "Please login first to access test mode" : undefined}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        userEmail={user?.email}
      />
    </div>
  )
}
