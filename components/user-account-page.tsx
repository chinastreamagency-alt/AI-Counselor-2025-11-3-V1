"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Clock, User, Calendar, CreditCard } from "lucide-react"
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
  const router = useRouter()
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

  const handlePurchase = () => {
    router.push('/payment')
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 z-50 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-8 space-y-6">
        {/* 返回按钮 */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl font-bold text-white">Personal Account</h1>
        </div>

        {/* 用户信息卡片 */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8">
          <div className="flex items-center gap-6">
            {user?.image ? (
              <img 
                src={user.image || "/placeholder.svg"} 
                alt={user.name} 
                className="w-20 h-20 rounded-full ring-4 ring-cyan-500/50 shadow-lg shadow-cyan-500/30" 
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 via-purple-500 to-violet-600 flex items-center justify-center ring-4 ring-cyan-500/50 shadow-lg shadow-cyan-500/30">
                <User className="h-10 w-10 text-white" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-white">{user?.name || "User"}</h2>
              <p className="text-base text-white/70 mt-1">{user?.email}</p>
            </div>
          </div>
        </Card>

        {/* 可用时间卡片 - 大号显示 */}
        <Card className="bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-violet-600/20 backdrop-blur-md border-cyan-500/30 p-8 relative overflow-hidden">
          {/* 背景光效 */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-600/10 opacity-50"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Clock className="h-7 w-7 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Available Time</h3>
              </div>
              <Button 
                onClick={handlePurchase}
                size="lg"
                className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 text-white font-semibold px-6 py-3 text-base shadow-lg shadow-cyan-500/50 hover:shadow-cyan-400/60 transition-all duration-300"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Recharge Now
              </Button>
            </div>
            <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-3">
              {remainingHours}h {remainingMins}m
            </div>
            {remainingMinutes <= 3 && remainingMinutes > 0 && (
              <div className="flex items-center gap-2 mt-4 bg-amber-500/20 border border-amber-500/40 rounded-lg px-4 py-3">
                <span className="text-2xl">⚠️</span>
                <p className="text-amber-300 font-medium">Less than 3 minutes remaining - Please recharge soon</p>
              </div>
            )}
            {remainingMinutes <= 0 && (
              <div className="flex items-center gap-2 mt-4 bg-red-500/20 border border-red-500/40 rounded-lg px-4 py-3">
                <span className="text-2xl">🚨</span>
                <p className="text-red-300 font-medium">No time remaining - Please recharge to continue</p>
              </div>
            )}
          </div>
        </Card>

        {/* 最近会话卡片 */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Recent Sessions</h3>
          </div>

          {sessionHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/60 text-base">No session history yet</p>
              <p className="text-white/40 text-sm mt-2">Start your first conversation to see your history here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessionHistory.map((session) => (
                <div 
                  key={session.id} 
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-base font-semibold text-white">
                      {new Date(session.startTime).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <span className="text-sm text-cyan-400 font-medium">
                      {Math.floor((session.duration || 0) / 60)}m {(session.duration || 0) % 60}s
                    </span>
                  </div>
                  <p className="text-sm text-white/60">{session.messages?.length || 0} messages exchanged</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 返回按钮 */}
        <Button 
          onClick={onClose} 
          className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white font-semibold py-6 text-lg shadow-lg"
        >
          Return to Counselor
        </Button>
      </div>
    </div>
  )
}
