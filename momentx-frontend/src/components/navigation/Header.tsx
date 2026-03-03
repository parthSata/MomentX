import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Search, Bell, MessageCircle, PlusSquare, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./ThemeToggle"
import { useNotifications } from "@/hooks/useNotifications" // ✅ Imported
import { useChat } from "@/hooks/useChat" // ✅ Imported

interface HeaderProps {
  onMenuClick?: () => void
  showSearch?: boolean
}

export function Header({ onMenuClick, showSearch = true }: HeaderProps) {
  // ✅ Get the counts from hooks
  const { unreadCount: unreadNotifications } = useNotifications();
  const { totalUnreadMessages } = useChat();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass-strong border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="md:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <Link to="/" className="flex items-center gap-2">
            <motion.div
              className="relative w-9 h-9"
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute inset-0.5 bg-background rounded-[10px] flex items-center justify-center overflow-hidden">
                <img
                  src="/MomentX.png"
                  alt="MomentX Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            <span className="hidden sm:block text-xl font-display font-bold gradient-text">
              MomentX
            </span>
          </Link>
        </div>

        {showSearch && (
          <Link to="/search" className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <div className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/50 border border-border/50 text-sm text-muted-foreground flex items-center cursor-pointer hover:border-primary hover:shadow-neon transition-all">
                Search MomentX...
              </div>
            </div>
          </Link>
        )}

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/create">
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <PlusSquare className="w-5 h-5" />
            </Button>
          </Link>

          {/* ✅ UPDATED NOTIFICATIONS BADGE */}
          <Link to="/notifications">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full min-w-4 h-4 flex items-center justify-center shadow-md">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </Button>
          </Link>

          {/* ✅ UPDATED MESSAGES BADGE */}
          <Link to="/chat">
            <Button variant="ghost" size="icon" className="relative">
              <MessageCircle className="w-5 h-5" />
              {totalUnreadMessages > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full min-w-4 h-4 flex items-center justify-center shadow-md">
                  {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}