import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Phone, Video, Send, Image, Mic, Smile, Camera,
  Music, Loader2, X, Play, MoreVertical, Trash2, CheckCircle2, Circle
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { Input } from "@/components/ui/input";
import { useChat, type ChatUser } from "@/hooks/useChat";
import { useAuth } from "@/context/AuthContext";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";
import { api } from "@/lib/axios";

export default function ChatPage() {
  const navigate = useNavigate();
  const { id: chatId } = useParams();
  const { state } = useLocation();
  const { user: currentUser } = useAuth();

  // ✅ FIX 1: Removed 'setMessages' which caused the type error
  const { messages, fetchMessages, sendMessage, socketRef, deleteMessages } = useChat(chatId);
  const [inputText, setInputText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Header Menu State
  const [showMenu, setShowMenu] = useState(false);
  // SELECTION MODE STATE
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  // State for Upload Preview
  const [selectedMedia, setSelectedMedia] = useState<{ file: File; url: string; type: 'image' | 'video' | 'audio' } | null>(null);
  // State for Full Screen Viewers
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [fullScreenVideo, setFullScreenVideo] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [chatUser, setChatUser] = useState<ChatUser>(
    state?.user || { _id: "", name: "User", username: "user", profilePic: "", isOnline: false }
  );

  useEffect(() => { fetchMessages(); }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, selectedMedia]);

 useEffect(() => {
    const fetchUserStatus = async () => {
      if (!chatUser._id) return;
      try {
        const { data } = await api.get(`/users/${chatUser._id}`);
        if (data.data) {
          setChatUser(prev => ({
            ...prev,
            isOnline: data.data.isOnline,
            profilePic: data.data.profilePic || prev.profilePic
          }));
        }
      } catch (error) {
        console.error("Failed to fetch user status");
      }
    };
    fetchUserStatus();
  }, [chatId, chatUser._id]);

  // ✅ 2. Socket Listeners for Real-time Updates
  useEffect(() => {
    if (!socketRef.current) return;
    const socket = socketRef.current;

    const handleOnline = (userId: string) => {
      if (userId === chatUser._id) {
        setChatUser((prev) => ({ ...prev, isOnline: true }));
      }
    };

    const handleOffline = (userId: string) => {
      if (userId === chatUser._id) {
        setChatUser((prev) => ({ ...prev, isOnline: false }));
      }
    };

    const handleTyping = (data: any) => {
      if (data.chatId === chatId && data.senderId !== currentUser?._id) setIsTyping(true);
    };
    
    const handleStopTyping = (data: any) => {
      if (data.chatId === chatId && data.senderId !== currentUser?._id) setIsTyping(false);
    };

    socket.on("user_online", handleOnline);
    socket.on("user_offline", handleOffline);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("user_online", handleOnline);
      socket.off("user_offline", handleOffline);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [chatId, currentUser?._id, socketRef, chatUser._id]);

  const handleDeleteSelected = async () => {
    if (selectedMessageIds.length === 0) return;
    if (!confirm(`Delete ${selectedMessageIds.length} messages?`)) return;

    // Use the function from the hook
    await deleteMessages(selectedMessageIds);

    // Reset Selection Mode
    setIsSelectionMode(false);
    setSelectedMessageIds([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (socketRef.current) {
      socketRef.current.emit("typing", { chatId, senderId: currentUser?._id });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit("stopTyping", { chatId, senderId: currentUser?._id });
      }, 2000);
    }
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    if (chatUser._id) {
      sendMessage(chatUser._id, inputText, "text");
      setInputText("");
      setShowEmojiPicker(false);
      socketRef.current?.emit("stopTyping", { chatId, senderId: currentUser?._id });
    }
  };

  // HANDLE SELECTION TOGGLE
  const toggleMessageSelection = (msgId: string) => {
    setSelectedMessageIds((prev) =>
      prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId]
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const type = file.type.startsWith("video") ? "video" : file.type.startsWith("audio") ? "audio" : "image";

    setSelectedMedia({ file, url: objectUrl, type });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const confirmSendMedia = async () => {
    if (!selectedMedia || !chatUser._id) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedMedia.file);

    try {
      const { data } = await api.post("/chats/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (data.data?.url) {
        sendMessage(chatUser._id, data.data.url, selectedMedia.type);
        setSelectedMedia(null);
      }
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }
  };

  const triggerUpload = (type: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type;
      fileInputRef.current.click();
    }
  }

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setInputText((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="h-screen flex flex-col bg-background relative overflow-hidden">

      {/* FULL SCREEN IMAGE VIEWER */}
      <AnimatePresence>
        {fullScreenImage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            // ✅ FIX 3: Changed z-[100] to z-50 for standard compliance
            className="absolute inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setFullScreenImage(null)}
          >
            <button onClick={() => setFullScreenImage(null)} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              src={fullScreenImage} alt="Full View"
              className="max-w-full max-h-full rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL SCREEN VIDEO VIEWER */}
      <AnimatePresence>
        {fullScreenVideo && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            // ✅ FIX 3: Changed z-[100] to z-50
            className="absolute inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setFullScreenVideo(null)}
          >
            <button onClick={() => setFullScreenVideo(null)} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50">
              <X className="w-6 h-6" />
            </button>
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="w-full max-w-5xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <video src={fullScreenVideo} controls autoPlay className="w-full h-full object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UPLOAD PREVIEW */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6"
          >
            <button onClick={() => setSelectedMedia(null)} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            {/* ... Upload Preview Content ... */}
            <div className="flex-1 flex items-center justify-center w-full max-w-2xl">
              {selectedMedia.type === 'image' && <img src={selectedMedia.url} alt="Preview" className="max-h-[70vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10" />}
              {selectedMedia.type === 'video' && <video src={selectedMedia.url} controls className="max-h-[70vh] max-w-full rounded-2xl shadow-2xl border border-white/10" />}
              {selectedMedia.type === 'audio' && (
                <div className="bg-white/10 p-8 rounded-3xl flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center"><Music className="w-10 h-10 text-primary" /></div>
                  <audio src={selectedMedia.url} controls className="w-64" />
                </div>
              )}
            </div>
            <div className="w-full max-w-md mt-6 flex items-center gap-4">
              <button onClick={confirmSendMedia} disabled={uploading} className="flex-1 bg-gradient-primary text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
                {uploading ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Sending...</span></> : <><Send className="w-5 h-5" /><span>Send</span></>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER: DYNAMIC (Selection Mode vs Normal Mode) */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-strong p-4 z-40 relative">
        {isSelectionMode ? (
          <div className="flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <button onClick={() => { setIsSelectionMode(false); setSelectedMessageIds([]); }} className="p-2 glass rounded-full hover:bg-white/10"><X className="w-5 h-5" /></button>
              <h4 className="font-semibold text-lg">{selectedMessageIds.length} Selected</h4>
            </div>
            <button onClick={handleDeleteSelected} disabled={selectedMessageIds.length === 0} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-full disabled:opacity-50 transition-colors"><Trash2 className="w-5 h-5" /></button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button onClick={() => navigate("/chat")} className="p-2 glass rounded-full"><ArrowLeft className="w-5 h-5" /></motion.button>
              <AvatarRing src={chatUser.profilePic} isOnline={chatUser.isOnline} size="sm" />
              <div>
                <h4 className="font-semibold text-sm sm:text-base">{chatUser.name || chatUser.username}</h4>

                {/* ✅ WHATSAPP STYLE STATUS */}
                <p className={`text-xs font-medium transition-colors duration-300 ${chatUser.isOnline ? "text-green-500 animate-pulse" : "text-muted-foreground"}`}>
                  {chatUser.isOnline ? "Online" : "Offline"}
                </p>

              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button className="p-2 glass rounded-full"><Phone className="w-5 h-5" /></button>
              <button className="p-2 glass rounded-full"><Video className="w-5 h-5" /></button>
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="p-2 glass rounded-full"><MoreVertical className="w-5 h-5" /></button>
                {showMenu && (
                  <><div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div><div className="absolute right-0 top-12 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden"><button onClick={() => { setIsSelectionMode(true); setShowMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-2 text-sm transition-colors"><CheckCircle2 className="w-4 h-4" />Select Messages</button></div></>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* MESSAGES AREA */}
      <div
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 scrollbar-hide relative"
        onClick={() => setShowEmojiPicker(false)}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isMe = msg.sender?._id === currentUser?._id;
            const isSelected = selectedMessageIds.includes(msg._id!);

            return (
              <motion.div
                key={msg._id || index}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                // ✅ FIX 4: Used correct function name 'toggleMessageSelection'
                onClick={() => isSelectionMode && toggleMessageSelection(msg._id!)}
                className={`flex items-center gap-3 ${isMe ? "justify-end" : "justify-start"} ${isSelectionMode ? "cursor-pointer hover:opacity-90" : ""}`}
              >

                {/* SELECTION CHECKBOX */}
                {isSelectionMode && (
                  // ✅ FIX 5: Changed flex-shrink-0 to shrink-0
                  <div className={`${isMe ? "order-1" : "order-1"} shrink-0`}>
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-primary fill-primary/20" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground/50" />
                    )}
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] md:max-w-[60%] ${isMe ? "order-2" : "order-2"}`}>
                  <div className={`p-2 rounded-2xl overflow-hidden ${isMe ? "bg-gradient-primary text-white rounded-br-none" : "glass rounded-bl-none"} ${msg.isOptimistic ? "opacity-70" : "opacity-100"} ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}>

                    {msg.image ? (
                      <div
                        className="relative w-full max-w-55 sm:max-w-85 aspect-square rounded-lg overflow-hidden cursor-pointer group bg-black/20"
                        onClick={() => !isSelectionMode && setFullScreenImage(msg.image || "")}
                      >
                        <img src={msg.image} alt="Sent" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </div>
                    ) : msg.video ? (
                      <div
                        className="relative w-full max-w-55 sm:max-w-85 aspect-video rounded-lg overflow-hidden bg-black cursor-pointer group"
                        onClick={() => !isSelectionMode && setFullScreenVideo(msg.video!)}
                      >
                        <video src={msg.video} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full group-hover:bg-white/30 transition-colors">
                            <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white" />
                          </div>
                        </div>
                      </div>
                    ) : msg.audio ? (
                      <div className="flex items-center gap-2 sm:gap-3 p-1 sm:p-2 min-w-50 sm:min-w-65">
                        <div className="p-2 bg-white/20 rounded-full shrink-0"><Music className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                        <audio src={msg.audio} controls className={`w-full h-8 max-w-45 sm:max-w-55 ${isSelectionMode ? "pointer-events-none" : ""}`} />
                      </div>
                    ) : (
                      <p className="px-2 py-1 text-sm sm:text-base wrap-break-word whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    )}
                  </div>
                  <p className={`text-[10px] text-muted-foreground mt-1 ${isMe ? "text-right" : "text-left"}`}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {isTyping && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
            <div className="glass p-3 rounded-2xl rounded-bl-none flex gap-1 items-center w-16 justify-center">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-0"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-300"></span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area (Hide when selecting to give more space/focus) */}
      {!isSelectionMode && (
        <div className="glass-strong p-3 sm:p-4">
          {/* ... (Existing Input Code) ... */}
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
          <AnimatePresence>{showEmojiPicker && (<motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="absolute bottom-20 left-4 z-50"><EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.DARK} searchDisabled /></motion.div>)}</AnimatePresence>
          <div className="flex items-center gap-2">
            <button onClick={() => triggerUpload("image/*,video/*")} className="p-2 glass rounded-full hover:bg-white/10 shrink-0"><Camera className="w-5 h-5 text-primary" /></button>
            <div className="flex-1 relative">
              <Input variant="glass" placeholder="Message..." value={inputText} onChange={handleInputChange} onKeyDown={(e) => e.key === "Enter" && handleSend()} className="pr-24" />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1.5 hover:bg-white/10 rounded-full"><Smile className="w-5 h-5 text-muted-foreground" /></button>
                <button className="p-1.5 hover:bg-white/10 rounded-full hidden sm:block" onClick={() => triggerUpload("image/*")}><Image className="w-5 h-5 text-muted-foreground" /></button>
                <button className="p-1.5 hover:bg-white/10 rounded-full" onClick={() => triggerUpload("audio/*")}><Music className="w-5 h-5 text-muted-foreground" /></button>
              </div>
            </div>
            <motion.button onClick={handleSend} className="p-3 bg-gradient-primary rounded-full shrink-0">{inputText.trim() ? <Send className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}</motion.button>
          </div>
        </div>
      )}
    </div>
  );
}