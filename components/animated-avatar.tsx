"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

interface AnimatedAvatarProps {
  status: "idle" | "listening" | "speaking" | "processing"
}

const AVATAR_EXPRESSIONS = {
  idle: [
    "/avatars/aria-neutral.jpg",
    "/avatars/aria-peaceful.jpg",
    "/avatars/aria-calm.jpg",
    "/avatars/aria-gentle.jpg",
  ],
  listening: [
    "/avatars/aria-listening.jpg",
    "/avatars/aria-attentive.jpg",
    "/avatars/aria-engaged.jpg",
    "/avatars/aria-focused.jpg",
  ],
  speaking: [
    "/avatars/aria-speaking.jpg",
    "/avatars/aria-smiling.jpg",
    "/avatars/aria-encouraging.jpg",
    "/avatars/aria-warm.jpg",
    "/avatars/aria-empathetic.jpg",
    "/avatars/aria-understanding.jpg",
  ],
  processing: ["/avatars/aria-thinking.jpg", "/avatars/aria-contemplative.jpg", "/avatars/aria-thoughtful.jpg"],
}

export function AnimatedAvatar({ status }: AnimatedAvatarProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const expressions = AVATAR_EXPRESSIONS[status] || AVATAR_EXPRESSIONS.idle

  useEffect(() => {
    const interval = setInterval(
      () => {
        setIsTransitioning(true)
        setTimeout(() => {
          const randomIndex = Math.floor(Math.random() * expressions.length)
          setCurrentIndex(randomIndex)
          setIsTransitioning(false)
        }, 150)
      },
      status === "speaking" ? 1200 : 3000,
    )

    return () => clearInterval(interval)
  }, [status, expressions.length])

  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-100 to-cyan-100 dark:from-violet-900/30 dark:to-cyan-900/30 blur-2xl opacity-50" />

      <div
        className={`relative w-full h-full rounded-full overflow-hidden shadow-2xl transition-all duration-300 ${
          isTransitioning ? "opacity-90 scale-98" : "opacity-100 scale-100"
        }`}
      >
        <Image
          src={expressions[currentIndex] || "/placeholder.svg"}
          alt="Aria AI Therapist"
          fill
          className="object-cover"
          priority
        />

        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            status === "listening"
              ? "bg-violet-500/10"
              : status === "speaking"
                ? "bg-cyan-500/10"
                : status === "processing"
                  ? "bg-blue-500/10"
                  : "bg-transparent"
          }`}
        />
      </div>
    </div>
  )
}
