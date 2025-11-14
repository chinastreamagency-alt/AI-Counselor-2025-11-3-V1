"use client"

import { useEffect, useRef } from "react"

interface VideoAvatarProps {
  isListening: boolean
  isSpeaking: boolean
  currentSpeaker: "user" | "assistant" | null
  currentText: string
}

export function VideoAvatar({ isListening, isSpeaking, currentSpeaker, currentText }: VideoAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.log("[v0] Video autoplay blocked:", error.message)
      })
    }
  }, [])

  const getStatus = () => {
    if (isSpeaking) return "speaking"
    if (isListening) return "listening"
    return "idle"
  }

  const status = getStatus()

  return (
    <div className="relative w-full h-full
      rounded-2xl sm:rounded-3xl
      shadow-2xl
      overflow-hidden 
      bg-gradient-to-br from-slate-50 to-gray-100">
      
      {/* 轻微的反光效果 - 不遮挡内容 */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
      
      {/* 视频层 */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover relative z-10"
        loop
        muted
        playsInline
        preload="auto"
        poster="/ai-counselor-background.mp4"
      >
        <source
          src="/ai-counselor-background.mp4"
          type="video/mp4"
        />
      </video>

      {/* Ambient overlay with breathing effect */}
      <div className={`absolute inset-0 transition-all duration-1000 pointer-events-none ${
        status === "listening" 
          ? "bg-gradient-to-t from-green-500/10 via-transparent to-transparent"
          : status === "speaking"
            ? "bg-gradient-to-t from-blue-500/10 via-transparent to-transparent"
            : "bg-gradient-to-t from-purple-500/5 via-transparent to-transparent"
      }`} />
    </div>
  )
}
