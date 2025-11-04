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
    <div className="relative w-full max-w-2xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-purple-100 to-blue-100">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        loop
        muted
        playsInline
        poster="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=450&fit=crop"
      >
        <source
          src="https://assets.mixkit.co/videos/preview/mixkit-woman-smiling-at-camera-1759-large.mp4"
          type="video/mp4"
        />
      </video>

      {/* Status overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

      {/* Header with title and status */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-white text-2xl font-bold drop-shadow-lg">AI Counselor</h2>
          <p className="text-white/90 text-sm drop-shadow-md">with Arina</p>
        </div>

        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
          <div
            className={`w-2 h-2 rounded-full ${
              status === "listening"
                ? "bg-green-400 animate-pulse"
                : status === "speaking"
                  ? "bg-blue-400 animate-pulse"
                  : "bg-gray-400"
            }`}
          />
          <span className="text-white text-sm font-medium drop-shadow-md">
            {status === "idle" && "Ready"}
            {status === "listening" && "Listening"}
            {status === "speaking" && "Speaking"}
          </span>
        </div>
      </div>

      {/* Current text display */}
      {currentText && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
            <p className="text-white text-sm leading-relaxed">{currentText}</p>
          </div>
        </div>
      )}
    </div>
  )
}
