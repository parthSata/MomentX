import { motion } from "framer-motion";
import { MessageSquare, LayoutGrid, Settings, Play, Bell, Compass, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { AvatarRing } from "@/components/ui/avatar-ring";

export default function ChatRail() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: MessageSquare, label: "Chats", path: "/chat", color: "text-emerald-500" },
    { icon: Play, label: "Reels", path: "/reels", color: "text-pink-500" },
    { icon: Compass, label: "Explore", path: "/explore", color: "text-blue-500" },
    { icon: LayoutGrid, label: "Feed", path: "/", color: "text-orange-500" },
    { icon: Bell, label: "Alerts", path: "/notifications", color: "text-yellow-500" },
  ];

  return (
    <div className="w-[60px] md:w-[68px] h-full flex flex-col items-center py-4 bg-[#111b21] dark:bg-[#202c33]/40 border-r border-white/5 backdrop-blur-xl shrink-0 z-50 overflow-hidden">
      {/* Logo/Pulse */}
      <motion.div 
         whileHover={{ scale: 1.1, rotate: 10 }}
         onClick={() => navigate("/")}
         className="mb-8 cursor-pointer relative"
      >
        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 relative">
           <Sparkles className="w-6 h-6 text-white" />
        </div>
      </motion.div>

      {/* Menu Navigation */}
      <div className="flex-1 flex flex-col gap-6 w-full items-center">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <motion.div
              key={item.label}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.path)}
              className="relative group cursor-pointer"
            >
              {isActive && (
                <motion.div 
                  layoutId="rail-active"
                  className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-emerald-500 rounded-r-full" 
                />
              )}
              <div className={`p-3 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? "bg-white/10 text-white shadow-2xl" 
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}>
                <item.icon className={`w-6 h-6 ${isActive ? item.color : "text-gray-400 group-hover:text-white transition-colors"}`} />
              </div>
              
              {/* Tooltip */}
              <div className="absolute left-[70px] top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[100] border border-white/10 shadow-xl">
                 {item.label}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Settings & Profile */}
      <div className="mt-auto flex flex-col gap-4 items-center">
         <motion.button 
            whileHover={{ rotate: 90 }}
            onClick={() => navigate("/settings")}
            className="p-3 text-gray-500 hover:text-white transition-colors"
         >
            <Settings className="w-6 h-6" />
         </motion.button>
         
         <motion.div 
            whileHover={{ scale: 1.1 }}
            onClick={() => navigate("/profile")}
            className="cursor-pointer relative p-0.5 rounded-full border-2 border-emerald-500/50 hover:border-emerald-500 transition-colors"
         >
            <AvatarRing src={user?.profilePic || ""} size="sm" isOnline={true} />
         </motion.div>
      </div>
    </div>
  );
}
