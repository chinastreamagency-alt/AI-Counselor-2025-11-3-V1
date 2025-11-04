"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"
import { loadUserProfile } from "@/lib/user-profile"
import { LoginModal } from "@/components/login-modal"
import { UserMenu } from "@/components/user-menu"

export default function VoiceTherapyChat() {
  const { data: session, status: sessionStatus } = useSession()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [purchasedHours, setPurchasedHours] = useState(0)
  const [usedMinutes, setUsedMinutes] = useState(0)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showUserAccount, setShowUserAccount] = useState(false)
  const [testModeNeedsPayment, setTestModeNeedsPayment] = useState(false)

  useEffect(() => {
    if (session?.user) {
      const profile = loadUserProfile(session.user.email!)
      setUser({
        email: session.user.email!,
        name: session.user.name || "User",
        image: session.user.image || "",
        provider: "google",
        sessionCount: profile?.sessionCount || 0,
      })
      setPurchasedHours(profile?.purchasedHours || 0)
      setUsedMinutes(profile?.usedMinutes || 0)
      setIsLoggedIn(true)
    } else {
      setUser(null)
      setIsLoggedIn(false)
    }
  }, [session])

  const handleLogin = useCallback((email: string) => {
    setShowLoginModal(false)
  }, [])

  const handleLogout = useCallback(() => {
    signOut({ callbackUrl: "/" })
    setUser(null)
    setIsLoggedIn(false)
    setPurchasedHours(0)
    setUsedMinutes(0)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {!isLoggedIn && (
        <div className="absolute top-4 right-4 z-50">
          <Button onClick={() => setShowLoginModal(true)} variant="outline">
            Sign In
          </Button>
        </div>
      )}

      {isLoggedIn && user && (
        <UserMenu
          user={user}
          purchasedHours={purchasedHours}
          usedMinutes={usedMinutes}
          onLogout={handleLogout}
          onViewAccount={() => setShowUserAccount(true)}
        />
      )}

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
        message={
          testModeNeedsPayment
            ? "Test mode ended. Sign in to continue with full features."
            : "Sign in to save your progress and access all features"
        }
      />
    </div>
  )
}
