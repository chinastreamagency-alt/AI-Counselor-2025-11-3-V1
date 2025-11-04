"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { signIn } from "next-auth/react"
import { useState } from "react"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (email: string) => void
  message?: string
}

export function LoginModal({ isOpen, onClose, onLogin, message }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await signIn("google", {
        callbackUrl: "/",
      })

      if (result) {
        onClose()
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("[v0] Google login error:", err)
      setIsLoading(false)
    }
  }

  const handleMicrosoftLogin = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await signIn("microsoft", {
        redirect: false,
        callbackUrl: "/",
      })

      if (result?.error) {
        setError("Failed to sign in with Microsoft")
        console.error("[v0] Microsoft sign in error:", result.error)
      } else if (result?.ok) {
        onClose()
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("[v0] Microsoft login error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center">Continue Your Journey</DialogTitle>
          <DialogDescription className="text-center pt-2">
            {message || "Sign in to save progress and purchase talk time"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>}

          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            variant="outline"
            className="w-full h-12 text-base bg-transparent"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isLoading ? "Signing in..." : "Continue with Google"}
          </Button>

          <Button
            onClick={handleMicrosoftLogin}
            disabled={isLoading}
            variant="outline"
            className="w-full h-12 text-base bg-transparent"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
            </svg>
            {isLoading ? "Signing in..." : "Continue with Microsoft"}
          </Button>

          <p className="text-xs text-muted-foreground text-center pt-2">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
