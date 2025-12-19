import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Edit, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { useNavigate } from "react-router-dom";

const conversations = [
  {
    id: 1,
    user: {
      name: "Sarah Design",
      username: "sarah_design",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      isOnline: true,
    },
    lastMessage: "That sounds amazing! Can't wait to see the photos 📸",
    time: "2m",
    unread: 3,
  },
  {
    id: 2,
    user: {
      name: "Alex Photos",
      username: "alex_photos",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      isOnline: true,
    },
    lastMessage: "Just uploaded the new collection!",
    time: "15m",
    unread: 0,
  },
  {
    id: 3,
    user: {
      name: "Emma Wilson",
      username: "emma_w",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      isOnline: false,
    },
    lastMessage: "Thanks for the follow! 💜",
    time: "1h",
    unread: 1,
  },
  {
    id: 4,
    user: {
      name: "Mike Travel",
      username: "mike_travel",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      isOnline: false,
    },
    lastMessage: "The sunset was incredible yesterday",
    time: "3h",
    unread: 0,
  },
  {
    id: 5,
    user: {
      name: "Lisa Art",
      username: "lisa_art",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      isOnline: true,
    },
    lastMessage: "Sent you a voice note 🎤",
    time: "5h",
    unread: 2,
  },
];

export default function ChatListPage() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const filteredConversations = conversations.filter(c =>
    c.user.name.toLowerCase().includes(query.toLowerCase()) ||
    c.user.username.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 glass-strong p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-display font-bold gradient-text">Messages</h1>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 glass rounded-full"
            >
              <Edit className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            variant="glass"
            placeholder="Search messages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12"
          />
        </div>
      </motion.div>

      {/* Online Now */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Online Now</h3>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {conversations
            .filter(c => c.user.isOnline)
            .map((conv, index) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center gap-1 cursor-pointer"
                onClick={() => navigate(`/chat/${conv.id}`)}
              >
                <AvatarRing src={conv.user.avatar} isOnline size="md" />
                <span className="text-xs truncate max-w-[60px]">{conv.user.name.split(" ")[0]}</span>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Conversations */}
      <div className="px-4 space-y-2">
        {filteredConversations.map((conv, index) => (
          <motion.div
            key={conv.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ x: 4 }}
            onClick={() => navigate(`/chat/${conv.id}`)}
            className="flex items-center gap-3 p-3 glass rounded-2xl cursor-pointer hover:bg-white/10 transition-all group"
          >
            <AvatarRing src={conv.user.avatar} isOnline={conv.user.isOnline} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold truncate">{conv.user.name}</h4>
                <span className="text-xs text-muted-foreground">{conv.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className={`text-sm truncate ${conv.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {conv.lastMessage}
                </p>
                {conv.unread > 0 && (
                  <span className="ml-2 w-5 h-5 flex items-center justify-center bg-gradient-primary text-white text-xs font-bold rounded-full">
                    {conv.unread}
                  </span>
                )}
              </div>
            </div>
            <motion.button
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
