import { Link, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { 
  Home, Search, Film, MessageCircle, Bell, 
  PlusSquare, Settings, TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import { currentUser } from "@/data/mockData"
import { AvatarRing } from "@/components/ui/avatar-ring"

const mainNavItems = [
  { icon: Home, path: "/", label: "Home" },
  { icon: Search, path: "/explore", label: "Explore" },
  { icon: Film, path: "/reels", label: "Reels" },
  { icon: MessageCircle, path: "/chat", label: "Messages" },
  { icon: Bell, path: "/notifications", label: "Notifications" },
  { icon: PlusSquare, path: "/create", label: "Create" },
]

const secondaryNavItems = [
  { icon: TrendingUp, path: "/activity", label: "Activity" },
  { icon: Settings, path: "/settings", label: "Settings" },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-64 flex-col glass-strong border-r border-border/50 z-30">
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-hide">
        {mainNavItems.map((item) => {
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
                    ? "bg-gradient-to-r from-neon-indigo/20 via-neon-violet/20 to-neon-pink/20 text-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
                <span className="font-medium">{item.label}</span>
                {(item.label === "Messages" || item.label === "Notifications") && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-accent" />
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
                    ? "bg-gradient-to-r from-neon-indigo/20 via-neon-violet/20 to-neon-pink/20 text-foreground" 
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
            src={currentUser.avatar}
            alt={currentUser.displayName}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{currentUser.displayName}</p>
            <p className="text-sm text-muted-foreground truncate">@{currentUser.username}</p>
          </div>
        </motion.div>
      </Link>
    </aside>
  )
}
