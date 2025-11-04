"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Clock } from "lucide-react"

interface UserMenuProps {
  user: {
    email: string
    name: string
    image: string
  }
  purchasedHours: number
  usedMinutes: number
  onLogout: () => void
  onViewAccount: () => void
}

export function UserMenu({ user, purchasedHours, usedMinutes, onLogout, onViewAccount }: UserMenuProps) {
  const remainingMinutes = purchasedHours * 60 - usedMinutes
  const remainingHours = Math.floor(remainingMinutes / 60)
  const remainingMins = remainingMinutes % 60

  return (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
      <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-blue-600" />
          <span className="font-medium">
            {remainingHours}h {remainingMins}m remaining
          </span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full h-10 w-10 bg-transparent">
            {user.image ? (
              <img
                src={user.image || "/placeholder.svg"}
                alt={user.name}
                className="rounded-full h-full w-full object-cover"
              />
            ) : (
              <User className="h-5 w-5" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onViewAccount}>
            <User className="mr-2 h-4 w-4" />
            View Account
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
