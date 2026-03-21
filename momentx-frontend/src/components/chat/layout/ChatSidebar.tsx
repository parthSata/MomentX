import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Edit, Loader2, X, UserPlus, Trash2, ArrowLeft, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { useNavigate, useLocation } from "react-router-dom";
import { useChat } from "@/hooks/useChat";
import { formatDistanceToNowStrict } from "date-fns";
import { api } from "@/lib/axios";
import { toast } from "sonner";
import { decryptMessage } from "@/lib/cryptoUtils";
import { CreateGroupDialog } from "@/components/chat/CreateGroupDialog";

interface SearchUser {
  _id: string;
  name: string;
  username: string;
  profilePic: string;
  isOnline: boolean;
}

export default function ChatSidebar() {
  const { chats, fetchChats, loading, markChatAsRead } = useChat();

  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<"all" | "unread" | "groups">("all");

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; chatId: string } | null>(null);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Re-fetch chats when a chat is opened (confirms unread counts from server)
  useEffect(() => {
    const handleChatsUpdated = () => fetchChats();
    window.addEventListener("chats_updated", handleChatsUpdated);
    return () => window.removeEventListener("chats_updated", handleChatsUpdated);
  }, [fetchChats]);

  // Handle Context Menu (Right Click)
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

  const handleNavigateToChat = (chatId: string, user: any, isGroup = false) => {
    // Instantly clear unread badge (optimistic update — no API call)
    markChatAsRead(chatId);
    if (isGroup) {
      navigate(`/group-chat/${chatId}`);
    } else {
      navigate(`/chat/${chatId}`, { state: { user } });
    }
  };

  const chatMap = new Map<string, any>();
  const groupChats: any[] = [];

  chats.forEach((chat: any) => {
    if (chat.isGroupChat) {
      groupChats.push(chat);
    } else {
      const otherUserId = chat.user?._id;
      if (!otherUserId) return;
      chatMap.set(otherUserId, chat);
    }
  });

  const uniqueChats = [...Array.from(chatMap.values()), ...groupChats].sort((a, b) => {
    if (!a.lastMessageAt) return 1;
    if (!b.lastMessageAt) return -1;
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
  });

  const filteredChats = uniqueChats.filter((c: any) => {
    let matchesSearch = false;
    if (c.isGroupChat) {
      matchesSearch = c.groupName?.toLowerCase().includes(query.toLowerCase());
    } else {
      matchesSearch = c.user?.name?.toLowerCase().includes(query.toLowerCase()) ||
        c.user?.username?.toLowerCase().includes(query.toLowerCase());
    }

    if (!matchesSearch) return false;
    if (activeTab === "unread") return c.unreadCount > 0;
    if (activeTab === "groups") return c.isGroupChat;
    return true;
  });

  const handleGroupCreated = async (groupData: any) => {
    try {
      const formData = new FormData();
      formData.append("name", groupData.name);
      
      // Send as JSON string for the backend to parse
      formData.append("participants", JSON.stringify(groupData.members));
      
      if (groupData.avatar) {
        formData.append("groupAvatar", groupData.avatar);
      }

      const { data } = await api.post("/chats/group", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setIsCreateGroupOpen(false);
      fetchChats();
      navigate(`/group-chat/${data.data._id}`);
      toast.success("Group created successfully!");
    } catch (error) {
      toast.error("Failed to create group");
    }
  };

  const currentChatId = location.pathname.split("/").pop();

  return (
    <div className="flex flex-col h-full overflow-hidden text-foreground relative w-full border-r border-border/50">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-40 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.1, 1], x: [0, 20, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], x: [0, -20, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[100px]"
        />
      </div>

      {contextMenu && (
        <div
          className="fixed z-50 w-48 bg-popover border border-border rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleDeleteChat}
            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-muted flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Delete Chat
          </button>
        </div>
      )}

      {/* New Chat Dialog */}
      <AnimatePresence>
        {isNewChatOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNewChatOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-background w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[80vh] border border-border">
              <div className="p-4 border-b border-border flex items-center justify-between bg-card">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-amber-500" />
                  <span>New Chat</span>
                </h2>
                <button onClick={() => setIsNewChatOpen(false)} className="p-2 rounded-full hover:bg-muted"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input autoFocus placeholder="Search contacts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" variant="glass" /></div></div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {isSearching ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : searchResults.length > 0 ? searchResults.map(user => (
                  <div key={user._id} onClick={() => handleStartChat(user._id)} className="flex items-center gap-3 p-3 hover:bg-muted/80 rounded-2xl cursor-pointer transition-colors"><AvatarRing src={user.profilePic} isOnline={user.isOnline} size="md" /><div className="flex-1"><h4 className="font-semibold text-sm">{user.name || user.username}</h4><p className="text-xs text-muted-foreground">@{user.username}</p></div></div>
                )) : <p className="text-center text-muted-foreground py-8 text-sm">No users found.</p>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CreateGroupDialog isOpen={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} onCreated={handleGroupCreated} />

      {/* Header */}
      <div className="flex-shrink-0 p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-2 hover:bg-muted rounded-full flex items-center justify-center transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-2xl font-bold font-display text-foreground">Chats</h1>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setIsCreateGroupOpen(true)} className="p-2 hover:bg-muted rounded-full" title="Create Group"><Users className="w-5 h-5" /></button>
          <button onClick={() => setIsNewChatOpen(true)} className="p-2 hover:bg-muted rounded-full" title="New Chat"><Edit className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-2 z-10">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search or start a new chat" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10 !ring-0 !border-none" variant="glass" /></div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide shrink-0 z-10 border-b border-border">
        {(["all", "unread", "groups"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all capitalize whitespace-nowrap ${activeTab === tab ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-500 border border-amber-500/30" : "bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent"}`}>{tab}</button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide bg-background z-10">
        {loading && <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
        {!loading && filteredChats.length === 0 && <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm font-medium"><p>No conversations found.</p></div>}
        {!loading && filteredChats.map((chat: any) => {
          const isGroup = chat.isGroupChat;
          const displayName = isGroup ? chat.groupName : (chat.user?.name || chat.user?.username);
          const avatarUrl = isGroup ? chat.groupAvatar : chat.user?.profilePic;
          const isSelected = currentChatId === chat._id;
          return (
            <div key={chat._id} onClick={() => handleNavigateToChat(chat._id, chat.user, isGroup)} onContextMenu={(e) => handleContextMenu(e, chat._id)} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${isSelected ? "bg-primary/10 border-l-4 border-primary" : "hover:bg-muted/40 border-l-4 border-transparent"}`}>
              <AvatarRing src={avatarUrl} isOnline={!isGroup && chat.user?.isOnline} size="md" />
              <div className="flex-1 min-w-0 border-b border-border/40 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-[15px] truncate flex items-center gap-1.5 text-foreground">{isGroup && <Users className="w-3.5 h-3.5 text-muted-foreground" />}{displayName}</h4>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">{chat.lastMessageAt ? formatDistanceToNowStrict(new Date(chat.lastMessageAt)) : ""}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-[13px] truncate pr-4 ${chat.unreadCount > 0 ? "text-foreground font-bold" : "text-muted-foreground/80 font-medium"}`}>{chat.lastMessage ? (chat.lastMessage.startsWith("U2FsdGVkX1") ? decryptMessage(chat.lastMessage) : chat.lastMessage) : ""}</p>
                  {chat.unreadCount > 0 && <span className="shrink-0 bg-primary text-primary-foreground text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg shadow-primary/20">{chat.unreadCount}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
