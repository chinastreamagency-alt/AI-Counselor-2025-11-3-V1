export interface UserProfile {
  userId: string
  createdAt: string
  lastUpdated: string

  // Basic info
  name?: string
  age?: string
  status?: "student" | "working" | string

  // Key concerns and patterns
  mainConcerns: string[]
  topThreeConcerns: string[]
  difficultPeople: Array<{ name: string; relationship: string }>
  recurringThemes: string[]
  emotionalPatterns: string[]

  // Progress and insights
  strengths: string[]
  copingStrategies: string[]
  goals: string[]

  // Conversation history summary
  sessionCount: number
  lastSessionDate?: string
  keyInsights: string[]
}

export function createEmptyProfile(userId: string): UserProfile {
  return {
    userId,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    mainConcerns: [],
    topThreeConcerns: [],
    difficultPeople: [],
    recurringThemes: [],
    emotionalPatterns: [],
    strengths: [],
    copingStrategies: [],
    goals: [],
    sessionCount: 0,
    keyInsights: [],
  }
}

export function loadUserProfile(userId: string): UserProfile {
  if (typeof window === "undefined") return createEmptyProfile(userId)

  const stored = localStorage.getItem(`user-profile-${userId}`)
  if (stored) {
    return JSON.parse(stored)
  }
  return createEmptyProfile(userId)
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return

  profile.lastUpdated = new Date().toISOString()
  localStorage.setItem(`user-profile-${profile.userId}`, JSON.stringify(profile))
}
