import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Phone, Video, Send, Image as ImageIcon,
  Mic, Smile, Camera, Music, Loader2, X, Play,
  MoreVertical, Trash2, CheckCircle2, Circle, Square
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { Input } from "@/components/ui/input";
import { useChat, type ChatUser } from "@/hooks/useChat";
import { useAuth } from "@/context/AuthContext";
import { useCall } from "@/context/CallContext";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";
import { api } from "@/lib/axios";
import { SharedContentBubble } from "@/components/chat/SharedContentBubble";
import { toast } from "sonner";
import { PostViewDialog } from "@/components/feed/PostViewDialog";

// ✅ IMPORT ONLY THE 2 FUNCTIONS NEEDED
import { encryptMessage, decryptMessage } from "@/lib/cryptoUtils";

const MessageText = ({ text, isMe }: { text: string; isMe: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  const WORD_LIMIT = 40;
  const words = text ? text.split(/\s+/) : [];

  if (words.length <= WORD_LIMIT) {
    return (
      <p className="px-1 text-sm sm:text-base wrap-break-word whitespace-pre-wrap leading-relaxed">
        {text}
      </p>
    );
  }

  return (
    <div className="px-1 text-sm sm:text-base wrap-break-word whitespace-pre-wrap leading-relaxed">
      {expanded ? text : words.slice(0, WORD_LIMIT).join(" ") + "..."}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        className={`block text-xs font-bold mt-1 hover:underline focus:outline-none ${isMe ? "text-white/90" : "text-primary"
          }`}
      >
        {expanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
};

export default function ChatPage() {
  const navigate = useNavigate();
  const { id: chatId } = useParams<{ id: string }>();
  const { state } = useLocation();
  const { user: currentUser } = useAuth();

  const {
    messages,
    fetchMessages,
    sendMessage,
    deleteMessages,
    chats,
    fetchChats,
    socket
  } = useChat(chatId);

  const { initiateCall } = useCall();

  const [inputText, setInputText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<{
    file: File;
    url: string;
    type: "image" | "video" | "audio";
  } | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [fullScreenVideo, setFullScreenVideo] = useState<string | null>(null);

  // ✅ AUDIO RECORDING STATES
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [viewPostData, setViewPostData] = useState<any | null>(null);
  const [isPostViewOpen, setIsPostViewOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [chatUser, setChatUser] = useState<ChatUser>(
    state?.user || {
      _id: "",
      name: "User",
      username: "user",
      profilePic: "",
      isOnline: false,
    }
  );

  // Reset chatUser whenever the chat changes (handles sidebar navigation without unmount)
  useEffect(() => {
    if (state?.user) {
      // state.user is passed from the sidebar on every navigation — always up to date
      setChatUser(state.user);
    }
  }, [chatId]);

  // Fallback: resolve user from chats list if state.user wasn't provided
  useEffect(() => {
    if (!chatId || chats.length === 0) return;
    const found = chats.find((c) => c._id === chatId);
    if (found?.user) {
      setChatUser((prev) =>
        // Only update if the user actually changed (different chat)
        prev._id === found.user._id ? prev : found.user
      );
    }
  }, [chats, chatId]);

  useEffect(() => {
    if (!chatId) return;
    fetchMessages();
    fetchChats();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, selectedMedia]);

  useEffect(() => {
    const fetchUserStatus = async () => {
      if (!chatUser._id) return;
      try {
        const { data } = await api.get(`/users/${chatUser._id}`);
        if (data.data) {
          setChatUser((prev) => ({
            ...prev,
            isOnline: data.data.isOnline,
            profilePic: data.data.profilePic || prev.profilePic,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch user status:", error);
      }
    };
    fetchUserStatus();
  }, [chatId, chatUser._id, socket]);

  useEffect(() => {
    if (socket && chatId) {
      socket.emit("join_chat", chatId);
    }
  }, [chatId, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleOnline = (userId: string) => {
      if (String(userId) === String(chatUser._id)) {
        setChatUser((prev) => ({ ...prev, isOnline: true }));
      }
    };

    const handleOffline = (userId: string) => {
      if (String(userId) === String(chatUser._id)) {
        setChatUser((prev) => ({ ...prev, isOnline: false }));
      }
    };

    const handleTyping = (data: any) => {
      if (data.chatId === chatId && data.senderId !== currentUser?._id) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = (data: any) => {
      if (data.chatId === chatId && data.senderId !== currentUser?._id) {
        setIsTyping(false);
      }
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
  }, [chatId, currentUser?._id, chatUser._id, socket]);

  const handleInitiateCall = (type: "voice" | "video") => {
    initiateCall(chatUser, type);
  };

  const handleDeleteSelected = async () => {
    if (selectedMessageIds.length === 0) return;
    if (!confirm(`Delete ${selectedMessageIds.length} messages?`)) return;

    await deleteMessages(selectedMessageIds);
    setIsSelectionMode(false);
    setSelectedMessageIds([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const isNowTyping = value.trim() !== "";
    setInputText(value);

    if (!socket || !chatId || !currentUser?._id) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (isNowTyping) {
      socket.emit("typing", { chatId, senderId: currentUser._id });
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { chatId, senderId: currentUser._id });
        typingTimeoutRef.current = null;
      }, 3000);
    } else {
      socket.emit("stopTyping", { chatId, senderId: currentUser._id });
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !chatUser._id) return;

    // ✅ ENCRYPT INSTANTLY (1 Argument)
    const encryptedText = encryptMessage(inputText);

    setInputText("");
    setShowEmojiPicker(false);

    try {
      await sendMessage(chatUser._id, encryptedText, "text");
    } catch (error) {
      console.error("Failed to send message:", error);
    }

    socket?.emit("stopTyping", { chatId, senderId: currentUser?._id });
  };

  const toggleMessageSelection = (msgId: string) => {
    setSelectedMessageIds((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video");
    if (isVideo && file.size > 100 * 1024 * 1024) {
      toast.error("Video size must be less than 100MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    } else if (!isVideo && file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const url = URL.createObjectURL(file);
    const type = isVideo
      ? "video"
      : file.type.startsWith("audio")
        ? "audio"
        : "image";

    setSelectedMedia({ file, url, type });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ✅ AUDIO RECORDING FUNCTIONS
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setSelectedMedia({ file, url, type: "audio" });
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Recording error:", error);
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      audioChunksRef.current = [];
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const confirmSendMedia = async () => {
    if (!selectedMedia || !chatUser._id) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", selectedMedia.file);

    try {
      const { data } = await api.post("/chats/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data.data?.url) {
        await sendMessage(chatUser._id, data.data.url, selectedMedia.type);
        setSelectedMedia(null);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Media upload failed");
    } finally {
      setUploading(false);
    }
  };

  const triggerUpload = (accept: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setInputText((prev) => prev + emojiData.emoji);
  };

  const handleViewSharedContent = async (postId: string) => {
    try {
      const { data } = await api.get(`/posts/${postId}`);
      setViewPostData(data.data);
      setIsPostViewOpen(true);
    } catch (error) {
      console.error("Failed to load post:", error);
      toast.error("Content not found or has been deleted.");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const allMessages = messages;

  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden w-full">


      <AnimatePresence>
        {fullScreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setFullScreenImage(null)}
          >
            <button
              onClick={() => setFullScreenImage(null)}
              className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={fullScreenImage}
              alt="Full View"
              className="max-w-full max-h-full rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {fullScreenVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setFullScreenVideo(null)}
          >
            <button
              onClick={() => setFullScreenVideo(null)}
              className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white z-50"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-5xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <video src={fullScreenVideo} controls autoPlay className="w-full h-full object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6"
          >
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex-1 flex items-center justify-center w-full max-w-2xl">
              {selectedMedia.type === "image" && (
                <img
                  src={selectedMedia.url}
                  alt="Preview"
                  className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-white/10" />
              )}
              {selectedMedia.type === "video" && (
                <video
                  src={selectedMedia.url}
                  controls
                  className="max-h-[70vh] max-w-full rounded-2xl shadow-2xl border border-white/10"
                />
              )}
              {selectedMedia.type === "audio" && (
                <div className="bg-white/10 p-8 rounded-3xl flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                    <Music className="w-10 h-10 text-primary" />
                  </div>
                  <audio src={selectedMedia.url} controls className="w-64" />
                </div>
              )}
            </div>

            <div className="w-full max-w-md mt-6 flex items-center gap-4">
              <button
                onClick={confirmSendMedia}
                disabled={uploading}
                className="flex-1 bg-linear-to-r from-amber-500 to-emerald-500 text-black font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-strong p-4 z-40 relative border-b border-border/50"
      >
        {isSelectionMode ? (
          <div className="flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedMessageIds([]);
                }}
                className="p-2 glass rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              <h4 className="font-semibold text-lg">{selectedMessageIds.length} Selected</h4>
            </div>
            <button
              onClick={handleDeleteSelected}
              disabled={selectedMessageIds.length === 0}
              className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-full disabled:opacity-50 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button onClick={() => navigate("/chat")} className="p-2 glass rounded-full md:hidden transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <AvatarRing src={chatUser.profilePic} isOnline={chatUser.isOnline} size="sm" />
              <div>
                <h4 className="font-semibold text-sm sm:text-base">
                  {chatUser.name || chatUser.username}
                </h4>
                <p
                  className={`text-xs font-medium transition-colors duration-300 ${chatUser.isOnline ? "text-green-500 animate-pulse" : "text-muted-foreground"
                    }`}
                >
                  {chatUser.isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={() => handleInitiateCall("voice")} className="p-2 hover:bg-muted rounded-full transition-colors">
                <Phone className="w-5 h-5 text-primary" />
              </button>
              <button onClick={() => handleInitiateCall("video")} className="p-2 hover:bg-muted rounded-full transition-colors">
                <Video className="w-5 h-5 text-primary" />
              </button>
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="p-2 glass rounded-full">
                  <MoreVertical className="w-5 h-5" />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-12 w-48 bg-popover border border-border rounded-xl shadow-xl z-20 overflow-hidden">
                      <button
                        onClick={() => {
                          setIsSelectionMode(true);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-muted flex items-center gap-2 text-sm transition-colors border-b border-border/50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Select Messages
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          navigate("/chat");
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-muted flex items-center gap-2 text-sm transition-colors text-red-500"
                      >
                        <X className="w-4 h-4" />
                        Close chat
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <div
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 scrollbar-hide relative"
        onClick={() => setShowEmojiPicker(false)}
      >
        <AnimatePresence initial={false}>
          {allMessages.map((msg, index) => {
            const senderId =
              typeof msg.sender === "string" ? msg.sender : msg.sender?._id;
            const isMe = senderId === currentUser?._id;
            const isSelected = selectedMessageIds.includes(msg._id!);

            const dateObj = new Date(msg.createdAt);
            const isValidDate = !isNaN(dateObj.getTime());
            const timeString = isValidDate
              ? dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "--:--";

            const displayText = msg.text?.startsWith("U2FsdGVkX1") ? decryptMessage(msg.text) : msg.text;

            return (
              <motion.div
                key={msg._id || index}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => isSelectionMode && toggleMessageSelection(msg._id!)}
                className={`flex items-start gap-3 ${isMe ? "justify-end" : "justify-start"} ${isSelectionMode ? "cursor-pointer hover:opacity-90" : ""
                  }`}
              >
                {isSelectionMode && (
                  <div className="shrink-0">
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-primary fill-primary/20" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground/50" />
                    )}
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] md:max-w-[60%]`}>
                  <div
                    className={`
                      relative
                      ${msg.sharedPost
                        ? "p-0 bg-transparent shadow-none border-none"
                        : `p-3 rounded-2xl shadow-sm ${isMe
                          ? "bg-linear-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-500 text-gray-900 border border-amber-400/20 rounded-br-none font-medium"
                          : "bg-secondary/10 dark:bg-muted/80 text-foreground border border-border/50 rounded-bl-none"}`
                      }
                      ${msg.isOptimistic ? "opacity-70" : "opacity-100"}
                      ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
                    `}
                  >
                    {msg.sharedPost ? (
                      <SharedContentBubble
                        content={msg.sharedPost}
                        onClick={() => handleViewSharedContent(msg.sharedPost.postId)}
                      />
                    ) : msg.image ? (
                      <div
                        className="relative overflow-hidden cursor-pointer group bg-black/10 dark:bg-black/20 rounded-lg"
                        style={{ maxWidth: "280px", maxHeight: "350px" }}
                        onClick={() => !isSelectionMode && setFullScreenImage(msg.image || "")}
                      >
                        <img
                          src={msg.image}
                          alt="Sent"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                      </div>
                    ) : msg.video ? (
                      <div
                        className="relative w-full aspect-video rounded-lg overflow-hidden bg-black cursor-pointer group"
                        onClick={() => !isSelectionMode && setFullScreenVideo(msg.video!)}
                      >
                        <video
                          src={msg.video}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full group-hover:bg-white/30 transition-colors">
                            <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white" />
                          </div>
                        </div>
                      </div>
                    ) : msg.audio ? (
                      <div className="flex items-center gap-2 sm:gap-3 p-1 sm:p-2 min-w-50 sm:min-w-65">
                        <div className="p-2 bg-white/20 rounded-full shrink-0">
                          <Music className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <audio
                          src={msg.audio}
                          controls
                          className={`w-full h-8 max-w-45 sm:max-w-55 ${isSelectionMode ? "pointer-events-none" : ""
                            }`}
                        />
                      </div>
                    ) : (
                      // ✅ INSTANT DECRYPT (1 Argument)
                      <MessageText text={displayText || ""} isMe={isMe} />
                    )}
                  </div>
                  <p className={`text-[10px] text-muted-foreground mt-1 ${isMe ? "text-right" : "text-left"}`}>
                    {timeString}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="glass p-3 rounded-2xl rounded-bl-none flex gap-1 items-center w-16 justify-center">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-0" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-300" />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {!isSelectionMode && (
        <div className="glass-strong p-3 sm:p-4 border-t border-border/50">
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute bottom-20 left-4 z-50"
              >
                <EmojiPicker 
                  onEmojiClick={onEmojiClick} 
                  theme={document.documentElement.classList.contains("light") ? Theme.LIGHT : Theme.DARK} 
                  searchDisabled 
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2">
            {!isRecording && (
              <button
                onClick={() => triggerUpload("image/*,video/*")}
                className="p-2 glass rounded-full hover:bg-muted shrink-0"
              >
                <Camera className="w-5 h-5 text-primary" />
              </button>
            )}

            <div className="flex-1 relative">
              {isRecording ? (
                <div className="flex items-center justify-between h-12 px-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-pulse">
                  <div className="flex items-center gap-2 text-red-500">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    <span className="text-sm font-medium">Recording {formatTime(recordingTime)}</span>
                  </div>
                  <button onClick={cancelRecording} className="text-xs font-bold text-muted-foreground hover:text-red-500 transition-colors">
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <Input
                    variant="glass"
                    placeholder="Message..."
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="pr-24 h-12"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-1.5 hover:bg-muted rounded-full"
                    >
                      <Smile className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <button
                      className="p-1.5 hover:bg-muted rounded-full hidden sm:block"
                      onClick={() => triggerUpload("image/*")}
                    >
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <button
                      className="p-1.5 hover:bg-muted rounded-full"
                      onClick={() => triggerUpload("audio/*")}
                    >
                      <Music className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                </>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={inputText.trim() ? handleSend : isRecording ? stopRecording : startRecording}
              className={`p-3 rounded-full shrink-0 transition-colors ${isRecording
                ? "bg-red-500 shadow-lg shadow-red-500/20"
                : "bg-linear-to-r from-amber-500 to-emerald-500"
                }`}
            >
              {inputText.trim() ? (
                <Send className="w-5 h-5 text-white" />
              ) : isRecording ? (
                <Square className="w-5 h-5 text-white fill-white" />
              ) : (
                <Mic className="w-5 h-5 text-white" />
              )}
            </motion.button>
          </div>
        </div>
      )}

      <PostViewDialog
        isOpen={isPostViewOpen}
        onClose={() => setIsPostViewOpen(false)}
        post={viewPostData}
      />
    </div>
  );
}