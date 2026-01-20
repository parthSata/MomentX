import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Edit, MoreHorizontal, Loader2, X, UserPlus, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { useNavigate } from "react-router-dom";
import { useChat } from "@/hooks/useChat";
import { formatDistanceToNowStrict } from "date-fns";
import { api } from "@/lib/axios";

// ✅ INTERFACE: Includes 'name' (Display Name)
interface SearchUser {
  _id: string;
  name: string;
  username: string;
  profilePic: string;
  isOnline: boolean;
}

export default function ChatListPage() {
  const { chats, fetchChats, loading } = useChat();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  // Handle Search & Default List
  useEffect(() => {
    if (!isNewChatOpen) return;

    const fetchUsers = async () => {
      setIsSearching(true);
      try {
        let endpoint = "/users/all";

        if (searchQuery.trim().length > 0) {
          endpoint = `/users/search?username=${searchQuery}`;
        }

        const { data } = await api.get(endpoint);

        // Safety check for array
        if (data && Array.isArray(data.message)) {
          setSearchResults(data.message);
        } else {
          setSearchResults([]);
        }

      } catch (error) {
        console.error("Failed to fetch users", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const delay = searchQuery.length > 0 ? 300 : 0;
    const timeoutId = setTimeout(fetchUsers, delay);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, isNewChatOpen]);

  const handleStartChat = async (userId: string) => {
    try {
      const { data } = await api.post("/chats", { userId });
      const chat = data.data;

      const targetUser = chat.participants?.find((u: any) => u._id === userId)
        || chat.users?.find((u: any) => u._id === userId);

      if (targetUser) {
        navigate(`/chat/${chat._id}`, { state: { user: targetUser } });
        setIsNewChatOpen(false);
      }
    } catch (error) {
      console.error("Failed to start chat", error);
    }
  };

  const filteredChats = chats.filter(c =>
    c.user?.name?.toLowerCase().includes(query.toLowerCase()) ||
    c.user?.username?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 relative">

      {/* NEW CHAT MODAL */}
      <AnimatePresence>
        {isNewChatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="absolute inset-0" onClick={() => setIsNewChatOpen(false)} />

            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  New Message
                </h2>
                <button onClick={() => setIsNewChatOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    autoFocus
                    placeholder="Search people..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-white/5 border-white/10 focus:border-primary/50"
                  />
                </div>
              </div>

              {/* User List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {isSearching ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (Array.isArray(searchResults) && searchResults.length > 0) ? (
                  searchResults.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => handleStartChat(user._id)}
                      className="flex items-center gap-3 p-3 hover:bg-white/10 rounded-xl cursor-pointer transition-colors group"
                    >
                      <AvatarRing src={user.profilePic} isOnline={user.isOnline} size="md" />
                      <div className="flex-1">
                        {/* ✅ FIX: Display 'name' (Display Name) primarily */}
                        <h4 className="font-medium text-sm text-white">
                          {user.name || user.username}
                        </h4>
                        {/* Display 'username' as subtitle */}
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                      <MessageCircle className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    {searchQuery.length > 1 ? "No users found." : "Type to search."}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="sticky top-0 z-40 glass-strong p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-display font-bold gradient-text">Messages</h1>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsNewChatOpen(true)} className="p-2 glass rounded-full hover:bg-primary/20 transition-colors">
            <Edit className="w-5 h-5" />
          </motion.button>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input variant="glass" placeholder="Search messages..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-12" />
        </div>
      </motion.div>

      {/* <div className="p-4">
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
      </div> */}

      {/* Loading State */}
      {loading && (<div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>)}

      {/* Online Users */}
      {!loading && chats.length > 0 && (
        <div className="p-4">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {chats.filter(c => c.user?.isOnline).map((chat, index) => (
              <motion.div key={chat._id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }} className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => navigate(`/chat/${chat._id}`, { state: { user: chat.user } })}>
                <AvatarRing src={chat.user?.profilePic} isOnline size="md" />
                <span className="text-xs truncate w-16 text-center">{chat.user?.username}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Chat List */}
      <div className="px-4 space-y-2">
        {!loading && filteredChats.length === 0 && (<p className="text-center text-muted-foreground mt-10">No conversations yet.</p>)}
        {filteredChats.map((chat, index) => (
          <motion.div key={chat._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ x: 4 }} onClick={() => navigate(`/chat/${chat._id}`, { state: { user: chat.user } })} className="flex items-center gap-3 p-3 glass rounded-2xl cursor-pointer hover:bg-white/10 transition-all group">
            <AvatarRing src={chat.user?.profilePic} isOnline={chat.user?.isOnline} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                {/* ✅ FIX: Show Name in Chat List too */}
                <h4 className="font-semibold truncate">{chat.user?.name || chat.user?.username}</h4>
                <span className="text-xs text-muted-foreground">{chat.lastMessageAt ? formatDistanceToNowStrict(new Date(chat.lastMessageAt), { addSuffix: true }) : ""}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className={`text-sm truncate text-muted-foreground`}>{chat.lastMessage || "Start a conversation"}</p>
              </div>
            </div>
            <motion.button initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} className="p-2 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="w-5 h-5 text-muted-foreground" /></motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}