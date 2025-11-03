"use client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, Settings, LogOut, UserCircle } from "lucide-react"

interface UserMenuProps {
  user: {
    email: string
    name: string
    image: string
  } | null
  isLoggedIn: boolean
  onOpenAccount: () => void
  onOpenLogin: () => void
  onLogout: () => void
}

export function UserMenu({ user, isLoggedIn, onOpenAccount, onOpenLogin, onLogout }: UserMenuProps) {
  if (!isLoggedIn) {
    return (
      <Button
        onClick={onOpenLogin}
        className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white font-medium px-3 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base rounded-full shadow-lg"
      >
        <span className="hidden sm:inline">Login / Register</span>
        <span className="sm:hidden">Login</span>
      </Button>
    )
  }

  const shouldShowUserIcon =
    !user?.image ||
    user.image.length === 0 ||
    user.image.includes("ui-avatars.com") ||
    user.image.includes("placeholder.svg")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-violet-500/40 to-cyan-500/40 backdrop-blur-sm border-2 border-white/50 hover:border-white/70 hover:from-violet-500/50 hover:to-cyan-500/50 hover:scale-105 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/60 shadow-xl">
          {shouldShowUserIcon ? (
            <User className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white drop-shadow-lg" strokeWidth={2.5} />
          ) : (
            <img
              src={user.image || "/placeholder.svg"}
              alt={user.name}
              className="w-full h-full rounded-full object-cover"
            />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 sm:w-56 bg-slate-900/95 backdrop-blur-md border-white/20">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-white truncate">{user?.name}</p>
          <p className="text-xs text-white/70 truncate">{user?.email}</p>
        </div>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem onClick={onOpenAccount} className="text-white hover:bg-white/10 cursor-pointer">
          <UserCircle className="w-4 h-4 mr-2" />
          Personal Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="text-white hover:bg-white/10 cursor-pointer">
          <Settings className="w-4 h-4 mr-2" />
          Account Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem onClick={onLogout} className="text-red-400 hover:bg-white/10 cursor-pointer">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
