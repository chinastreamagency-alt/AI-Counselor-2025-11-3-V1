export type TherapySession = {
  id: string
  startTime: Date
  endTime?: Date
  messages: Array<{
    role: "user" | "assistant"
    content: string
    timestamp: Date
  }>
  duration?: number
  userId?: string
  userEmail?: string
}

const STORAGE_KEY = "therapy_sessions"
const RETENTION_DAYS = 7

export function saveSession(session: TherapySession): void {
  if (typeof window === "undefined") return

  try {
    const sessions = getSessions()
    const existingIndex = sessions.findIndex((s) => s.id === session.id)

    if (existingIndex >= 0) {
      sessions[existingIndex] = session
    } else {
      sessions.push(session)
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - RETENTION_DAYS)
    const recentSessions = sessions.filter((s) => new Date(s.startTime).getTime() > sevenDaysAgo.getTime())

    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentSessions))
  } catch (error) {
    console.error("Error saving session:", error)
  }
}

export function getSessions(): TherapySession[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const sessions = JSON.parse(stored)
    return sessions.map((s: any) => ({
      ...s,
      startTime: new Date(s.startTime),
      endTime: s.endTime ? new Date(s.endTime) : undefined,
      messages: s.messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
    }))
  } catch (error) {
    console.error("Error loading sessions:", error)
    return []
  }
}

export function getSession(id: string): TherapySession | undefined {
  return getSessions().find((s) => s.id === id)
}

export function deleteSession(id: string): void {
  if (typeof window === "undefined") return

  try {
    const sessions = getSessions().filter((s) => s.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch (error) {
    console.error("Error deleting session:", error)
  }
}

export function clearAllSessions(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("Error clearing sessions:", error)
  }
}

export function getLastIncompleteSession(userId: string): TherapySession | undefined {
  const sessions = getSessions()
  const userSessions = sessions.filter((s) => s.userId === userId)
  const sortedSessions = userSessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
  return sortedSessions[0]
}

export function getLastConversationSummary(userId: string): string[] {
  const lastSession = getLastIncompleteSession(userId)
  if (!lastSession || !lastSession.messages || lastSession.messages.length === 0) {
    return []
  }

  const lastMessages = lastSession.messages.slice(-3)
  return lastMessages.map((m) => `${m.role === "user" ? "You" : "Aria"}: ${m.content}`)
}
