export interface UserProfile {
  userId: string
  createdAt: string
  lastUpdated: string
  name?: string
  age?: string
  status?: "student" | "working" | string
  mainConcerns: string[]
  topThreeConcerns: string[]
  difficultPeople: Array<{ name: string; relationship: string }>
  recurringThemes: string[]
  emotionalPatterns: string[]
  strengths: string[]
  copingStrategies: string[]
  goals: string[]
  sessionCount: number
  lastSessionDate?: string
  keyInsights: string[]
  purchasedHours?: number
  usedMinutes?: number
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
    purchasedHours: 0,
    usedMinutes: 0,
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
