import { Link, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { Home, Search, Film, MessageCircle, Bell, PlusSquare, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { AvatarRing } from "@/components/ui/avatar-ring"
import { useAuth } from "@/context/AuthContext"
import { useNotifications } from "@/hooks/useNotifications"
import { useChat } from "@/hooks/useChat" // ✅ IMPORT USECHAT

const mainNavItems = [
  { icon: Home, path: "/", label: "Home" },
  { icon: Search, path: "/explore", label: "Explore" },
  { icon: Film, path: "/reels", label: "Reels" },
  { icon: MessageCircle, path: "/chat", label: "Messages" },
  { icon: Bell, path: "/notifications", label: "Notifications" },
  { icon: PlusSquare, path: "/create", label: "Create" },
]

const secondaryNavItems = [
  { icon: Settings, path: "/settings", label: "Settings" },
]

export function Sidebar() {
  const location = useLocation()
  const { user: currentUser } = useAuth()
  const { unreadCount: unreadNotifications } = useNotifications()
  const { totalUnreadMessages } = useChat() // ✅ GET TOTAL UNREAD MESSAGES

  if (!currentUser) return null;

  return (
    <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-64 flex-col glass-strong border-r border-border/50 z-30">
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-hide">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          // Determine which count to show based on the tab
          let badgeCount = 0;
          if (item.label === "Notifications") badgeCount = unreadNotifications;
          if (item.label === "Messages") badgeCount = totalUnreadMessages;

          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all",
                  isActive
                    ? "bg-linear-to-r from-neon-indigo/20 via-neon-violet/20 to-neon-pink/20 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <div className="relative">
                  <Icon className={cn("w-5 h-5", isActive && "text-primary")} />

                  {/* Pulsing dot for new notifications/messages on the icon itself */}
                  {badgeCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                  )}
                </div>

                <span className="font-medium">{item.label}</span>

                {/* ✅ DYNAMIC BADGE COUNT (Replaces empty red dot) */}
                {badgeCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center shadow-sm">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </motion.div>
            </Link>
          )
        })}

        <div className="h-px bg-border/50 my-4" />

        {secondaryNavItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all",
                  isActive
                    ? "bg-linear-to-r from-neon-indigo/20 via-neon-violet/20 to-neon-pink/20 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
                <span className="font-medium">{item.label}</span>
              </motion.div>
            </Link>
          )
        })}
      </div>

      <Link to="/profile" className="p-4 border-t border-border/50">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
        >
          <AvatarRing
            src={currentUser.profilePic || "/default-avatar.png"}
            alt={currentUser.username}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{currentUser.name || currentUser.username}</p>
            <p className="text-sm text-muted-foreground truncate">@{currentUser.username}</p>
          </div>
        </motion.div>
      </Link>
    </aside>
  )
}