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
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50 z-50 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-8 space-y-6">
        {/* 返回按钮 */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-indigo-700 hover:text-indigo-900 hover:bg-white/50 rounded-full border border-indigo-200"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl font-bold text-indigo-900">Personal Account</h1>
        </div>

        {/* 用户信息卡片 */}
        <Card className="bg-white/80 backdrop-blur-md border-indigo-200 p-8 shadow-xl shadow-indigo-100/50">
          <div className="flex items-center gap-6">
            {user?.image ? (
              <img 
                src={user.image || "/placeholder.svg"} 
                alt={user.name} 
                className="w-20 h-20 rounded-full ring-4 ring-indigo-300/50 shadow-lg shadow-indigo-300/30" 
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center ring-4 ring-indigo-300/50 shadow-lg shadow-indigo-300/30">
                <User className="h-10 w-10 text-white" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-indigo-900">{user?.name || "User"}</h2>
              <p className="text-base text-slate-600 mt-1">{user?.email}</p>
            </div>
          </div>
        </Card>

        {/* 可用时间卡片 - 大号显示 */}
        <Card className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 backdrop-blur-md border-indigo-300 p-8 relative overflow-hidden shadow-xl shadow-indigo-200/50">
          {/* 背景光效 - 3D 效果 */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-200/30 via-purple-200/20 to-pink-200/30 opacity-50"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-300/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/80 rounded-xl border border-indigo-200 shadow-lg">
                  <Clock className="h-7 w-7 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-indigo-900">Available Time</h3>
              </div>
              <Button 
                onClick={handlePurchase}
                size="lg"
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-3 text-base shadow-lg shadow-indigo-300/50 hover:shadow-indigo-400/60 transition-all duration-300"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Recharge Now
              </Button>
            </div>
            <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 mb-3 drop-shadow-sm">
              {remainingHours}h {remainingMins}m
            </div>
            {remainingMinutes <= 3 && remainingMinutes > 0 && (
              <div className="flex items-center gap-2 mt-4 bg-amber-50 border-2 border-amber-300 rounded-xl px-4 py-3 shadow-md">
                <span className="text-2xl">⚠️</span>
                <p className="text-amber-700 font-medium">Less than 3 minutes remaining - Please recharge soon</p>
              </div>
            )}
            {remainingMinutes <= 0 && (
              <div className="flex items-center gap-2 mt-4 bg-red-50 border-2 border-red-300 rounded-xl px-4 py-3 shadow-md">
                <span className="text-2xl">🚨</span>
                <p className="text-red-700 font-medium">No time remaining - Please recharge to continue</p>
              </div>
            )}
          </div>
        </Card>

        {/* 最近会话卡片 */}
        <Card className="bg-white/80 backdrop-blur-md border-indigo-200 p-8 shadow-xl shadow-indigo-100/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/80 rounded-xl border border-indigo-200 shadow-lg">
              <Calendar className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-indigo-900">Recent Sessions</h3>
          </div>

          {sessionHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 text-base">No session history yet</p>
              <p className="text-slate-400 text-sm mt-2">Start your first conversation to see your history here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessionHistory.map((session) => (
                <div 
                  key={session.id} 
                  className="bg-gradient-to-r from-indigo-50 to-purple-50 backdrop-blur-sm border border-indigo-200 rounded-xl p-4 hover:shadow-md hover:border-indigo-300 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-base font-semibold text-indigo-900">
                      {new Date(session.startTime).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <span className="text-sm text-indigo-600 font-medium bg-white/60 px-3 py-1 rounded-lg">
                      {Math.floor((session.duration || 0) / 60)}m {(session.duration || 0) % 60}s
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{session.messages?.length || 0} messages exchanged</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 返回按钮 */}
        <Button 
          onClick={onClose} 
          className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold py-6 text-lg shadow-lg shadow-indigo-300/50"
        >
          Return to Counselor
        </Button>
      </div>
    </div>
  )
}
