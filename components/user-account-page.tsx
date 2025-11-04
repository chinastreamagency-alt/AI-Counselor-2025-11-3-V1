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
      .slice(0, 5)
    setSessionHistory(userSessions)
  }, [user])

  const remainingMinutes = purchasedHours * 60 - usedMinutes
  const remainingHours = Math.floor(remainingMinutes / 60)
  const remainingMins = remainingMinutes % 60

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Personal Account</h1>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            {user?.image ? (
              <img src={user.image || "/placeholder.svg"} alt={user.name} className="w-16 h-16 rounded-full" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold">{user?.name || "User"}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Available Consultation Time</h3>
          </div>
          <div className="text-3xl font-bold text-primary">
            {remainingHours}h {remainingMins}m
          </div>
          {remainingMinutes <= 3 && remainingMinutes > 0 && (
            <p className="text-sm text-amber-600 mt-2">⚠️ Less than 3 minutes remaining</p>
          )}
          {remainingMinutes <= 0 && (
            <p className="text-sm text-destructive mt-2">⚠️ No time remaining - Please recharge</p>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Recent Sessions</h3>
          </div>

          {sessionHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No session history yet</p>
          ) : (
            <div className="space-y-3">
              {sessionHistory.map((session) => (
                <div key={session.id} className="border-l-2 border-primary pl-4 py-2">
                  <p className="text-sm font-medium">
                    {new Date(session.startTime).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Math.floor((session.duration || 0) / 60)}m {(session.duration || 0) % 60}s
                  </p>
                  <p className="text-xs text-muted-foreground">{session.messages?.length || 0} messages exchanged</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Button onClick={onClose} className="w-full">
          Return to Call
        </Button>
      </div>
    </div>
  )
}
