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
      sm:w-full sm:h-screen sm:rounded-none sm:shadow-none
      md:max-w-4xl md:aspect-video md:rounded-3xl md:shadow-3xl md:transform md:perspective-1000 md:rotate-y-2 md:hover:rotate-y-0 md:transition-all md:duration-500 md:hover:scale-105 md:float-animation md:breathing-glow
      lg:max-w-5xl lg:shadow-4xl lg:hover:shadow-4xl
      xl:max-w-6xl
      overflow-hidden bg-gradient-to-br from-slate-50 to-gray-100">
      
      {/* 3D 高级反光效果层 - 仅桌面显示 */}
      <div className="absolute inset-0 premium-gradient pointer-events-none hidden md:block"></div>
      
      {/* 玻璃态效果层 - 仅桌面显示 */}
      <div className="absolute inset-0 glass-effect pointer-events-none hidden md:block opacity-30"></div>
      
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
      
      {/* 3D 高级边框效果 - 仅桌面显示 */}
      <div className="absolute inset-0 border-2 border-white/40 rounded-3xl pointer-events-none hidden md:block shadow-inner"></div>
      
      {/* 环境光效果 - 仅桌面显示 */}
      <div className="absolute -inset-4 bg-gradient-radial from-blue-200/20 via-purple-200/10 to-transparent rounded-full blur-xl pointer-events-none hidden lg:block animate-pulse"></div>

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
