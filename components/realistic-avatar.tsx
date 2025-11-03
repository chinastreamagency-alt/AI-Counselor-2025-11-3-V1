"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

type AvatarStatus = "idle" | "listening" | "processing" | "speaking"

interface RealisticAvatarProps {
  status: AvatarStatus
}

export default function RealisticAvatar({ status }: RealisticAvatarProps) {
  const [currentExpression, setCurrentExpression] = useState(0)

  // Cycle through expressions based on status
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (status === "speaking") {
      // Cycle through speaking expressions
      interval = setInterval(() => {
        setCurrentExpression((prev) => (prev + 1) % 20)
      }, 200) // Change expression every 200ms when speaking
    } else if (status === "listening") {
      // Show attentive/listening expressions
      interval = setInterval(() => {
        setCurrentExpression((prev) => (prev >= 5 && prev < 10 ? prev + 1 : 5))
      }, 300)
    } else if (status === "processing") {
      // Show thinking expressions
      interval = setInterval(() => {
        setCurrentExpression((prev) => (prev >= 10 && prev < 15 ? prev + 1 : 10))
      }, 400)
    } else {
      // Idle - show calm expressions
      setCurrentExpression(0)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [status])

  return (
    <div className="relative w-48 h-48 sm:w-64 sm:h-64">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-400/20 via-blue-400/20 to-cyan-400/20 blur-2xl animate-pulse" />
      <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl ring-4 ring-white/50 dark:ring-gray-800/50">
        <Image
          src={`/beautiful-20-year-old-blonde-woman-with-blue-eyes-.jpg?height=400&width=400&query=beautiful 20 year old blonde woman with blue eyes, expression ${currentExpression + 1}, professional headshot, warm smile, friendly face, high quality portrait`}
          alt="AI Therapist Avatar"
          fill
          className="object-cover"
          priority
        />
      </div>
      {/* Status indicator */}
      <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full shadow-lg ring-2 ring-white dark:ring-gray-900">
        {status === "listening" && <div className="w-full h-full rounded-full bg-green-500 animate-pulse" />}
        {status === "speaking" && <div className="w-full h-full rounded-full bg-blue-500 animate-pulse" />}
        {status === "processing" && <div className="w-full h-full rounded-full bg-yellow-500 animate-spin" />}
        {status === "idle" && <div className="w-full h-full rounded-full bg-gray-400" />}
      </div>
    </div>
  )
}
