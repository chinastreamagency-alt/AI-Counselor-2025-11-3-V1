"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Clock, User, Calendar } from "lucide-react"
import { getSessions } from "@/lib/session-storage"

type UserAccountPageProps = {
  user: {
    email: string
    name: string
    image: string
  } | null
  purchasedHours: number
  usedMinutes: number
  onClose: () => void
}

export function UserAccountPage({ user, purchasedHours, usedMinutes, onClose }: UserAccountPageProps) {
  const [sessionHistory, setSessionHistory] = useState<any[]>([])

  useEffect(() => {
    const sessions = getSessions()
    const userSessions = sessions
      .filter((s) => s.userId === user?.email)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 5) // Show last 5 sessions
    setSessionHistory(userSessions)
  }, [user])

  const remainingMinutes = purchasedHours * 60 - usedMinutes
  const remainingHours = Math.floor(remainingMinutes / 60)
  const remainingMins = remainingMinutes % 60

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-50 overflow-y-auto">
      <div className="min-h-screen p-4 sm:p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Personal Account</h1>
          </div>

          {/* User Info Card */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              {user?.image ? (
                <img src={user.image || "/placeholder.svg"} alt={user.name} className="w-16 h-16 rounded-full" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold text-white">{user?.name || "User"}</h2>
                <p className="text-sm text-white/70">{user?.email}</p>
              </div>
            </div>

            {/* Available Time */}
            <div className="bg-gradient-to-r from-violet-500/20 to-cyan-500/20 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Available Consultation Time</h3>
              </div>
              <p className="text-3xl font-bold text-white">
                {remainingHours}h {remainingMins}m
              </p>
              {remainingMinutes <= 3 && remainingMinutes > 0 && (
                <p className="text-sm text-yellow-400 mt-2">⚠️ Less than 3 minutes remaining</p>
              )}
              {remainingMinutes <= 0 && (
                <p className="text-sm text-red-400 mt-2">⚠️ No time remaining - Please recharge</p>
              )}
            </div>
          </Card>

          {/* Session History */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-violet-400" />
              <h3 className="text-lg font-semibold text-white">Recent Sessions</h3>
            </div>

            {sessionHistory.length === 0 ? (
              <p className="text-white/50 text-center py-8">No session history yet</p>
            ) : (
              <div className="space-y-3">
                {sessionHistory.map((session) => (
                  <div key={session.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-white">
                        {new Date(session.startTime).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-white/70">
                        {Math.floor((session.duration || 0) / 60)}m {(session.duration || 0) % 60}s
                      </p>
                    </div>
                    <p className="text-xs text-white/50">{session.messages?.length || 0} messages exchanged</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Return Button */}
          <Button
            onClick={onClose}
            className="w-full mt-6 py-6 text-lg font-semibold rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white"
          >
            Return to Call
          </Button>
        </div>
      </div>
    </div>
  )
}
