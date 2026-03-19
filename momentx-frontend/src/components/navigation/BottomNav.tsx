import { Link, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { Home, Search, PlusSquare, Film, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { icon: Home, path: "/", label: "Home" },
  { icon: Search, path: "/explore", label: "Search" },
  { icon: PlusSquare, path: "/create", label: "Create", isCenter: true },
  { icon: Film, path: "/reels", label: "Reels" },
  { icon: User, path: "/profile", label: "Profile" },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-border/50 safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          if (item.isCenter) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center justify-center w-16 h-full -mt-4"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30"
                >
                  <Icon className="w-6 h-6 text-white" />
                </motion.div>
              </Link>
            )
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center w-16 h-full"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  isActive && "bg-primary/10 text-primary border border-primary/20"
                )}
              >
                <Icon
                  className={cn(
                    "w-6 h-6 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </motion.div>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute bottom-0 w-1 h-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
