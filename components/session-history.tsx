"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Trash2, Clock, MessageCircle } from "lucide-react"
import { getSessions, deleteSession, type TherapySession } from "@/lib/session-storage"

type SessionHistoryProps = {
  onClose: () => void
}

export default function SessionHistory({ onClose }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<TherapySession[]>([])
  const [selectedSession, setSelectedSession] = useState<TherapySession | null>(null)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = () => {
    const allSessions = getSessions()
    // Sort by start time, most recent first
    setSessions(allSessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime()))
  }

  const handleDeleteSession = (sessionId: string) => {
    if (confirm("Are you sure you want to delete this session?")) {
      deleteSession(sessionId)
      loadSessions()
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null)
      }
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "Unknown"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="p-6 bg-card shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-foreground">Session History</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No sessions yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Session List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedSession?.id === session.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedSession(session)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground mb-1">{formatDate(session.startTime)}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(session.duration)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {session.messages.length} messages
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteSession(session.id)
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Session Details */}
          <div className="max-h-96 overflow-y-auto">
            {selectedSession ? (
              <div className="space-y-4">
                <div className="pb-4 border-b border-border">
                  <h4 className="font-semibold text-foreground mb-2">Session Details</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Start time: {formatDate(selectedSession.startTime)}</p>
                    {selectedSession.endTime && <p>End time: {formatDate(selectedSession.endTime)}</p>}
                    <p>Duration: {formatDuration(selectedSession.duration)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedSession.messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {message.timestamp.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-sm">Select a session to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
