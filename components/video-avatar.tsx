"use client"

import { useEffect, useRef } from "react"

interface VideoAvatarProps {
  status: "idle" | "listening" | "speaking" | "processing"
}

export function VideoAvatar({ status }: VideoAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.log("[v0] Video autoplay blocked:", error.message)
      })
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      <div className="relative w-full h-full overflow-hidden rounded-none md:rounded-3xl shadow-2xl">
        <video
          ref={videoRef}
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TensorPix%20-%20%E8%83%8C%E6%99%AF%E8%A7%86%E9%A2%91-JeRdQXqiAgqy4khEcWu0IAyqG9Sxy7.mp4"
          loop
          muted
          playsInline
          autoPlay
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          x-webkit-airplay="deny"
          className="w-full h-full object-cover"
          style={{
            imageRendering: "auto",
            WebkitBackfaceVisibility: "hidden",
            backfaceVisibility: "hidden",
            transform: "translate3d(0, 0, 0)",
            willChange: "transform",
          }}
        />

        {/* Status overlay with subtle color tint */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${
            status === "listening"
              ? "bg-violet-500/10"
              : status === "speaking"
                ? "bg-cyan-500/10"
                : status === "processing"
                  ? "bg-blue-500/10"
                  : "bg-transparent"
          }`}
        />

        {/* Top header with AI Counselor title and status indicator in one row */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-3 sm:p-4 md:p-6">
          <div className="flex items-start justify-between gap-2">
            {/* Left side: AI Counselor title */}
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-xl md:text-2xl font-bold text-white leading-tight">AI Counselor</h1>
              <p className="text-xs sm:text-sm text-white/80 mt-0.5">with Arina</p>
            </div>

            {/* Right side: Status indicator */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-black/50 backdrop-blur-sm px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full flex-shrink-0">
              <div
                className={`w-1.5 sm:w-2 md:w-2.5 h-1.5 sm:h-2 md:h-2.5 rounded-full transition-colors ${
                  status === "listening"
                    ? "bg-violet-400 animate-pulse"
                    : status === "speaking"
                      ? "bg-cyan-400 animate-pulse"
                      : status === "processing"
                        ? "bg-blue-400 animate-pulse"
                        : "bg-gray-400"
                }`}
              />
              <span className="text-xs sm:text-sm text-white font-medium whitespace-nowrap">
                {status === "idle" && "Ready"}
                {status === "listening" && "Listening"}
                {status === "speaking" && "Speaking"}
                {status === "processing" && "Thinking"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
