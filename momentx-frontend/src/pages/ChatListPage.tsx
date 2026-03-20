import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Edit, Loader2, X, UserPlus, MessageCircle, Trash2, ArrowLeft, Users } from "lucide-react"; // ✅ Removed MoreHorizontal
import { Input } from "@/components/ui/input";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { useNavigate } from "react-router-dom";
import { useChat } from "@/hooks/useChat";
import { formatDistanceToNowStrict } from "date-fns";
import { api } from "@/lib/axios";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { decryptMessage } from "@/lib/cryptoUtils";
import { CreateGroupDialog } from "@/components/chat/CreateGroupDialog";

interface SearchUser {
  _id: string;
  name: string;
  username: string;
  profilePic: string;
  isOnline: boolean;
}

export default function ChatListPage() {
  const { chats, fetchChats, loading, socket } = useChat();
  const { user: currentUser } = useAuth();

  const [localChats, setLocalChats] = useState<any[]>(chats);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; chatId: string } | null>(null);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false); // ✅ Toggle for Group Dialog
  // Sync local state when chats are fetched initially
  useEffect(() => {
    setLocalChats(chats);
  }, [chats]);

  // Initial Fetch on mount
  useEffect(() => {
    fetchChats();
  }, []);

  // REAL-TIME LISTENER: Updates Preview & Unread Count
  useEffect(() => {
    if (!socket) return;

    const handleNewMessageList = (newMessage: any) => {
      setLocalChats((prevChats) => {
        const existingChatIndex = prevChats.findIndex((c: any) => c._id === newMessage.chatId);

        let newChatsList = [...prevChats];

        if (existingChatIndex !== -1) {
          // Chat exists, update it
          const existingChat = prevChats[existingChatIndex];

          const updatedChat = {
            ...existingChat,
            // Update preview text
            lastMessage: newMessage.text || (newMessage.image ? "📷 Image" : newMessage.video ? "🎥 Video" : "Media"),
            lastMessageAt: new Date().toISOString(),
            // Increment unread count ONLY if I am not the sender
            unreadCount: (existingChat.unreadCount || 0) + (newMessage.sender?._id !== currentUser?._id ? 1 : 0)
          };

          // Remove from old position and add to top
          newChatsList.splice(existingChatIndex, 1);
          newChatsList.unshift(updatedChat);
        } else {
          // New chat we don't have locally yet -> fetch all to be safe
          fetchChats();
          return prevChats;
        }

        return newChatsList;
      });
      // ✅ BROADCAST UPDATE TO SIDEBAR & HEADER
      window.dispatchEvent(new Event('chats_updated'));
    };

    socket.on("newMessage", handleNewMessageList);

    return () => {
      socket.off("newMessage", handleNewMessageList);
    };
  }, [socket, currentUser?._id, fetchChats]);

  // Close context menu logic
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  // Search Logic
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
        setSearchResults(Array.isArray(data.data) ? data.data : []);
      } catch (error) {
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
      const targetUser = chat.participants?.find((u: any) => u._id === userId);
      if (targetUser) {
        navigate(`/chat/${chat._id}`, { state: { user: targetUser } });
        setIsNewChatOpen(false);
        fetchChats();
      }
    } catch (error) {
      toast.error("Could not start chat");
    }
  };

  const handleContextMenu = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, chatId });
  };

  const handleDeleteChat = async () => {
    if (!contextMenu) return;
    try {
      await api.delete(`/chats/${contextMenu.chatId}`);
      toast.success("Chat deleted");
      fetchChats();
    } catch (error) {
      toast.error("Failed to delete chat");
    }
  };

  const handleNavigateToChat = (chatId: string, user: any) => {
    // Optimistically clear unread count in local state
    setLocalChats((prev) =>
      prev.map(c => c._id === chatId ? { ...c, unreadCount: 0 } : c)
    );
    // ✅ BROADCAST UPDATE
    window.dispatchEvent(new Event('chats_updated'));
    navigate(`/chat/${chatId}`, { state: { user } });
  };

  // Dedup logic using Map
  const chatMap = new Map<string, any>();
  const groupChats: any[] = []; // Store group chats separately so we don't dedup them by user 

  localChats.forEach((chat: any) => {
    if (chat.isGroupChat) {
      groupChats.push(chat);
    } else {
      const otherUserId = chat.user?._id;
      if (!otherUserId) return;
      chatMap.set(otherUserId, chat);
    }
  });

  // Combine unique 1-on-1 chats with all group chats and sort by lastMessageAt
  const uniqueChats = [...Array.from(chatMap.values()), ...groupChats].sort((a, b) => {
    if (!a.lastMessageAt) return 1;
    if (!b.lastMessageAt) return -1;
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
  });

  const filteredChats = uniqueChats.filter((c: any) => {
    if (c.isGroupChat) {
      return c.groupName?.toLowerCase().includes(query.toLowerCase());
    }
    return c.user?.name?.toLowerCase().includes(query.toLowerCase()) ||
      c.user?.username?.toLowerCase().includes(query.toLowerCase());
  });

  const handleGroupCreated = async (groupData: any) => {
    try {
      const { data } = await api.post("/chats/group", {
        name: groupData.name,
        participants: groupData.members // It's already an array of IDs
      });
      setIsCreateGroupOpen(false);
      fetchChats();
      navigate(`/group-chat/${data.data._id}`); // Navigate to Group Chat UI
      toast.success("Group created successfully!");
    } catch (error) {
      toast.error("Failed to create group");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 relative text-foreground">
      {contextMenu && (
        <div
          className="fixed z-50 w-48 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleDeleteChat}
            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Delete Chat
          </button>
        </div>
      )}

      {/* New Chat Modal */}
      <AnimatePresence>
        {isNewChatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="absolute inset-0" onClick={() => setIsNewChatOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-50 dark:bg-white/5">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                  <UserPlus className="w-5 h-5 text-primary" />
                  <span>New Message</span>
                </h2>
                <button onClick={() => setIsNewChatOpen(false)} className="p-2 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                  <Input 
                    autoFocus 
                    placeholder="Search people..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="pl-9 h-11"
                    variant="glass"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {isSearching ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : (Array.isArray(searchResults) && searchResults.length > 0) ? (
                  searchResults.map((user) => (
                    <div 
                      key={user._id} 
                      onClick={() => handleStartChat(user._id)} 
                      className="flex items-center gap-3 p-3 hover:bg-muted/80 rounded-2xl cursor-pointer transition-all active:scale-[0.98] border border-transparent hover:border-border/30 group"
                    >
                      <AvatarRing src={user.profilePic} isOnline={user.isOnline} size="md" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate">{user.name || user.username}</h4>
                      <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                    </div>
                      <MessageCircle className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8 text-sm">{searchQuery.length > 1 ? "No users found." : "Type to search."}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ Create Group Dialog */}
      <CreateGroupDialog
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreated={handleGroupCreated}
      />

      {/* Header */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="sticky top-0 z-40 glass-strong p-4">

        {/* ✅ FIX: Added Back Button Next to Messages Title */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ x: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/")}
              className="flex items-center gap-2.5 px-3 py-2 glass rounded-2xl hover:bg-primary/10 transition-all border border-white/10 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden xs:inline">Back</span>
            </motion.button>
            <h1 className="text-2xl font-display font-bold bg-linear-to-r from-amber-400 to-emerald-400 bg-clip-text text-transparent">Messages</h1>
          </div>
          <div className="flex gap-2">
            {/* ✅ NEW: CREATE GROUP BUTTON */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsCreateGroupOpen(true)}
              className="p-2 glass rounded-full hover:bg-primary/20 transition-colors"
              title="Create Group"
            >
              <Users className="w-5 h-5 text-primary" />
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsNewChatOpen(true)} className="p-2 glass rounded-full hover:bg-primary/20 transition-colors">
              <Edit className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
          <Input variant="glass" placeholder="Search messages..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-12" />
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && (<div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>)}

      {/* Chat List */}
      {!loading && chats.length > 0 && (
        <div className="p-4">
          {/* Quick Access Horizontal List */}
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {uniqueChats.filter(c => c.user?.isOnline).map((chat: any, index) => (
              <motion.div key={chat._id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }} className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => handleNavigateToChat(chat._id, chat.user)}>
                <AvatarRing src={chat.user?.profilePic} isOnline size="md" />
                <span className="text-xs truncate w-16 text-center">{chat.user?.username}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Main Chat List */}
      <div className="px-4 space-y-2">
        {!loading && filteredChats.length === 0 && (<p className="text-center text-muted-foreground mt-10">No conversations yet.</p>)}
        {filteredChats.map((chat: any, index) => {
          const isGroup = chat.isGroupChat;
          const displayName = isGroup ? chat.groupName : (chat.user?.name || chat.user?.username);
          const avatarUrl = isGroup ? chat.groupAvatar : chat.user?.profilePic;
          const isOnline = isGroup ? false : chat.user?.isOnline;
          const targetPath = isGroup ? `/group-chat/${chat._id}` : `/chat/${chat._id}`;

          return (
            <motion.div
              key={chat._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 4 }}
              onClick={() => {
                if (isGroup) {
                  // Optimistically clear unread count
                  setLocalChats((prev) =>
                    prev.map(c => c._id === chat._id ? { ...c, unreadCount: 0 } : c)
                  );
                  window.dispatchEvent(new Event('chats_updated'));
                  navigate(targetPath);
                } else {
                  handleNavigateToChat(chat._id, chat.user);
                }
              }}
              onContextMenu={(e) => handleContextMenu(e, chat._id)}
              className="flex items-center gap-3 p-3 glass rounded-2xl cursor-pointer hover:bg-white/10 transition-all group relative"
            >
              {isGroup && !avatarUrl ? (
                <div className="w-12 h-12 shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              ) : (
                <AvatarRing src={avatarUrl} isOnline={isOnline} size="md" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold truncate text-foreground flex items-center gap-1.5">
                    {isGroup && <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                    {displayName}
                  </h4>
                  <span className="text-xs text-muted-foreground">{chat.lastMessageAt ? formatDistanceToNowStrict(new Date(chat.lastMessageAt), { addSuffix: true }) : ""}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p
                    className={`text-sm truncate ${chat.unreadCount > 0
                      ? "text-foreground font-bold"
                      : "text-muted-foreground"
                      }`}
                  >
                    {decryptMessage(chat.lastMessage)}
                  </p>

                  {chat.unreadCount > 0 && (
                    <span className="ml-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Three dots removed as per request - delete accessible via context menu */}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}