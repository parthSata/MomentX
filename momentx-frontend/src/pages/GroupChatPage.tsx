import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Send, Mic, Smile, Camera, Image, MoreVertical,
    Users, Crown, Check, CheckCheck,
    X, Play, Music, Settings
} from "lucide-react";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";
import { useNavigate, useParams } from "react-router-dom";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import GroupAdminPanel from "@/components/chat/GroupAdminPanel";
import { SharedContentBubble } from "@/components/chat/SharedContentBubble";
import { PostViewDialog } from "@/components/feed/PostViewDialog";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/axios";
import { decryptMessage, encryptMessage } from "@/lib/cryptoUtils";
import { useTheme } from "@/components/theme/ThemeProvider";

interface GroupMember {
    id: string;
    name: string;
    username: string;
    avatar: string;
    role: "admin" | "member";
    isOnline?: boolean;
}

export default function GroupChatPage() {
    const navigate = useNavigate();
    const { id: chatId } = useParams();
    const { user: currentUser } = useAuth();
    const { theme } = useTheme();

    const { messages, sendMessage: sendSocketMessage, fetchMessages, socket } = useChat(chatId);

    const [messageText, setMessageText] = useState("");
    const [showPanel, setShowPanel] = useState(false);
    const [groupData, setGroupData] = useState<any>(null);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [groupAvatar, setGroupAvatar] = useState<string | null>(null);
    const [panelTab, setPanelTab] = useState<"members" | "settings">("members");

    const [viewPostData, setViewPostData] = useState<any | null>(null);
    const [isPostViewOpen, setIsPostViewOpen] = useState(false);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const [fullScreenVideo, setFullScreenVideo] = useState<string | null>(null);

    // Message Selection States
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
    const [showMenu, setShowMenu] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const onEmojiClick = (emojiData: EmojiClickData) => {
        setMessageText((prev) => prev + emojiData.emoji);
    };

    // Media Upload & Recording States
    const [selectedMedia, setSelectedMedia] = useState<{
        file: File;
        url: string;
        type: "image" | "video" | "audio";
    } | null>(null);
    const [uploading, setUploading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchGroupInfo = async () => {
        try {
            const { data } = await api.get(`/chats/group/${chatId}`);
            const chat = data.data;
            setGroupData(chat);
            setGroupAvatar(chat.groupAvatar);

            const mappedMembers = chat.participants.map((p: any) => ({
                id: p._id,
                name: p.name || p.username,
                username: p.username,
                avatar: p.profilePic,
                role: chat.groupAdmins.some((admin: any) => admin._id === p._id) ? "admin" : "member",
                isOnline: p.isOnline
            }));
            setMembers(mappedMembers);
        } catch (error) {
            toast.error("Unable to load group details");
            navigate("/chat");
        }
    };

    useEffect(() => {
        if (chatId) {
            fetchGroupInfo();
            fetchMessages();
        }
    }, [chatId]);

    useEffect(() => {
        if (!socket || !chatId) return;
        socket.emit("join_chat", chatId);
    }, [chatId, socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const isCurrentUserAdmin = members.find(m => m.id === currentUser?._id)?.role === "admin";

    const handleSendMessage = async () => {
        if (!messageText.trim() || !chatId) return;

        try {
            const encryptedText = encryptMessage(messageText);
            await sendSocketMessage(chatId, encryptedText, "text");
            setMessageText("");
        } catch (error) {
            toast.error("Message failed to send");
        }
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
        if (!selectedMedia) return;
        setUploading(true);

        const formData = new FormData();
        formData.append("file", selectedMedia.file);

        try {
            const { data } = await api.post("/chats/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (data.data?.url) {
                // Send the raw URL for media. Do NOT encrypt media URLs.
                await sendSocketMessage(chatId!, data.data.url, selectedMedia.type);
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

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const removeMember = async (memberId: string) => {
        try {
            await api.patch(`/chats/group/${chatId}/members`, { userId: memberId, action: 'remove' });
            fetchGroupInfo();
            toast.success("Member removed");
        } catch (error) { toast.error("Action failed"); }
    };

    const addMember = async (user: any) => {
        try {
            await api.patch(`/chats/group/${chatId}/members`, { userId: user.id || user._id, action: 'add' });
            fetchGroupInfo();
            toast.success("Member added");
        } catch (error) { toast.error("Action failed"); }
    };

    const toggleAdmin = async (memberId: string) => {
        try {
            await api.patch(`/chats/group/${chatId}/admin`, { userId: memberId });
            fetchGroupInfo();
        } catch (error) { toast.error("Role update failed"); }
    };

    const handleGroupNameChange = async (newName: string) => {
        if (!newName.trim()) return;
        try {
            await api.patch(`/chats/group/${chatId}/details`, { groupName: newName });
            fetchGroupInfo();
            toast.success("Group name updated");
        } catch (error) {
            toast.error("Failed to update group name");
        }
    };

    const handleViewSharedContent = async (postId: string) => {
        try {
            const { data } = await api.get(`/posts/${postId}`);
            setViewPostData(data.data);
            setIsPostViewOpen(true);
        } catch (error) {
            toast.error("Failed to load post");
        }
    };

    const handleGroupAvatarChange = async (file: File, previewUrl: string) => {
        try {
            // Optimistic update
            setGroupAvatar(previewUrl);

            const formData = new FormData();
            formData.append("groupAvatar", file);
            await api.patch(`/chats/group/${chatId}/details`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            fetchGroupInfo();
            toast.success("Group photo updated successfully");
        } catch (error) {
            toast.error("Failed to update group picture");
            fetchGroupInfo(); // revert optimistic update on failure
        }
    }

    const handleClearChat = async () => {
        if (!window.confirm("Are you sure you want to clear all messages? This cannot be undone.")) return;
        try {
            await api.delete(`/chats/${chatId}/messages`);
            fetchMessages();
            toast.success("Chat cleared");
            setShowMenu(false);
        } catch (error) {
            toast.error("Failed to clear chat");
        }
    }

    const handleDeleteSelected = async () => {
        if (selectedMessageIds.length === 0) return;
        try {
            await api.post('/chats/delete-messages', { chatId, messageIds: selectedMessageIds });
            fetchMessages();
            toast.success("Messages deleted");
            setIsSelectionMode(false);
            setSelectedMessageIds([]);
        } catch (error) {
            toast.error("Failed to delete messages");
        }
    }

    const toggleMessageSelection = (msgId: string) => {
        setSelectedMessageIds(prev => 
            prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId]
        );
    }

    const onlineCount = members.filter((m) => m.isOnline).length;
    const memberWithRole = (senderId: string) => members.find(m => m.id === senderId);

    return (
        <div className="h-full flex flex-col bg-background relative overflow-hidden w-full">
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="glass-strong p-4 flex items-center justify-between z-40"
            >
                <div className="flex items-center gap-3">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/chat")} className="p-2 glass rounded-full md:hidden">
                        <ArrowLeft className="w-5 h-5" />
                    </motion.button>
                    <motion.div
                        className="w-10 h-10 rounded-full bg-gradient-primary p-[2px] cursor-pointer overflow-hidden"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setPanelTab("members"); setShowPanel(true); }}
                    >
                        {groupAvatar ? (
                            <img src={groupAvatar} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                                <Users className="w-5 h-5 text-primary" />
                            </div>
                        )}
                    </motion.div>
                    <div className="cursor-pointer" onClick={() => { setPanelTab("members"); setShowPanel(true); }}>
                        <div className="flex items-center gap-1.5">
                            <h4 className="font-semibold font-display">{groupData?.groupName || "Loading..."}</h4>
                            {isCurrentUserAdmin && (
                                <span className="px-1.5 py-0.5 text-[8px] font-bold bg-primary/20 text-primary rounded-full uppercase tracking-wider flex items-center gap-0.5">
                                    <Crown className="w-2.5 h-2.5" />
                                    Admin
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">{members.length} members · {onlineCount} online</p>
                    </div>
                </div>

                <div className="relative">
                    <motion.button 
                        whileTap={{ scale: 0.9 }} 
                        onClick={() => setShowMenu(!showMenu)} 
                        className={`p-2 glass rounded-full ${showMenu ? 'bg-primary/20' : ''}`}
                    >
                        <MoreVertical className="w-5 h-5" />
                    </motion.button>

                    <AnimatePresence>
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 mt-2 w-48 glass-strong rounded-2xl shadow-xl border border-border/50 p-1.5 z-50 overflow-hidden"
                                >
                                    <button 
                                        onClick={() => { setPanelTab("settings"); setShowPanel(true); setShowMenu(false); }}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/10 rounded-xl transition-colors flex items-center gap-2"
                                    >
                                        <Settings className="w-4 h-4 text-primary" />
                                        Group Settings
                                    </button>
                                    <button 
                                        onClick={() => { setIsSelectionMode(true); setShowMenu(false); }}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/10 rounded-xl transition-colors flex items-center gap-2 border-b border-border/50"
                                    >
                                        <Check className="w-4 h-4 text-primary" />
                                        Select Messages
                                    </button>
                                    <button 
                                        onClick={() => { setShowMenu(false); navigate("/chat"); }}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-500/10 text-red-500 rounded-xl transition-colors flex items-center gap-2 border-b border-border/50"
                                    >
                                        <X className="w-4 h-4" />
                                        Close chat
                                    </button>
                                    <button 
                                        onClick={handleClearChat}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-500/10 text-red-500 rounded-xl transition-colors flex items-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        Clear Chat
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            <div
                className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide"
                onClick={() => setShowEmojiPicker(false)}
            >
                <AnimatePresence>
                    {messages.map((msg: any, index: number) => {
                        const isMe = msg.sender?._id === currentUser?._id;
                        const isSystem = msg.type === 'system';
                        const decryptedText = msg.text?.startsWith("U2FsdGVkX1") ? decryptMessage(msg.text) : msg.text;
                        const senderMember = memberWithRole(msg.sender?._id);

                        return (
                            <motion.div
                                key={msg._id || index}
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                {isSystem ? (
                                    <div className="flex justify-center">
                                        <motion.span
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="px-4 py-1.5 text-xs text-muted-foreground glass rounded-full"
                                        >
                                            {decryptedText}
                                        </motion.span>
                                    </div>
                                ) : (
                                    <div className={`flex ${isMe ? "justify-end" : "justify-start"} gap-2`}>
                                        {isSelectionMode && (
                                            <div 
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer self-center
                                                    ${selectedMessageIds.includes(msg._id) ? "bg-primary border-primary" : "border-muted-foreground"}`}
                                                onClick={() => toggleMessageSelection(msg._id)}
                                            >
                                                {selectedMessageIds.includes(msg._id) && <Check className="w-3 h-3 text-primary-foreground" />}
                                            </div>
                                        )}
                                        {!isMe && (
                                            <AvatarRing src={msg.sender?.profilePic} size="sm" />
                                        )}
                                        <div className="max-w-[75%]">
                                            {!isMe && (
                                                <div className="flex items-center gap-1.5 mb-0.5 ml-1">
                                                    <p className="text-[10px] text-primary font-semibold">{msg.sender?.username}</p>
                                                    {senderMember?.role === "admin" && (
                                                        <span className="px-1 py-px text-[8px] font-bold bg-primary/15 text-primary rounded flex items-center gap-0.5">
                                                            <Crown className="w-2 h-2" />
                                                            Admin
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            <div
                                                className={`
                                                  relative
                                                  ${msg.sharedPost
                                                        ? "p-0 bg-transparent shadow-none border-none"
                                                : `p-3 rounded-2xl shadow-sm ${isMe
                                                            ? "bg-linear-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-500 text-gray-900 border border-amber-400/20 rounded-br-none font-medium"
                                                            : "bg-secondary/10 dark:bg-muted/80 text-foreground border border-border/50 rounded-bl-none"}`
                                                    }
                                                `}
                                            >
                                                {msg.sharedPost ? (
                                                    <SharedContentBubble
                                                        content={msg.sharedPost}
                                                        onClick={() => handleViewSharedContent(msg.sharedPost.postId)}
                                                    />
                                                ) : msg.image ? (
                                                    <div
                                                        className="relative overflow-hidden cursor-pointer group bg-black/10 rounded-lg"
                                                        style={{ maxWidth: "240px", maxHeight: "300px" }}
                                                        onClick={() => setFullScreenImage(msg.image || "")}
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
                                                        className="relative w-full max-w-[240px] aspect-video rounded-lg overflow-hidden bg-black cursor-pointer group"
                                                        onClick={() => setFullScreenVideo(msg.video!)}
                                                    >
                                                        <video
                                                            src={msg.video}
                                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full group-hover:bg-white/30 transition-colors">
                                                                <Play className="w-5 h-5 text-white fill-white" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : msg.audio ? (
                                                    <div className="flex items-center gap-2 p-1 min-w-[200px]">
                                                        <div className="p-2 bg-white/20 rounded-full shrink-0">
                                                            <Music className="w-4 h-4" />
                                                        </div>
                                                        <audio src={msg.audio} controls className="w-full h-8" />
                                                    </div>
                                                ) : (
                                                    <p className="text-sm">{decryptedText}</p>
                                                )}
                                            </div>
                                            <div className={`flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5 ${isMe ? "justify-end" : ""}`}>
                                                <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {isMe && (msg.isRead ? <CheckCheck className="w-3 h-3 text-primary" /> : <Check className="w-3 h-3" />)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

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
                        <div className="bg-card w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
                            {selectedMedia.type === "image" ? (
                                <img
                                    src={selectedMedia.url}
                                    alt="Preview"
                                    className="w-full max-h-[60vh] object-contain bg-black/50"
                                />
                            ) : selectedMedia.type === "video" ? (
                                <video
                                    src={selectedMedia.url}
                                    controls
                                    className="w-full max-h-[60vh] object-contain bg-black/50"
                                />
                            ) : (
                                <div className="p-8 flex flex-col items-center gap-4 bg-muted/30">
                                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
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
                                className="flex-1 bg-gradient-primary text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                            >
                                {uploading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

            {/* Selection Action Bar */}
            <AnimatePresence>
                {isSelectionMode && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 inset-x-0 glass-strong p-4 flex items-center justify-between z-50 border-t border-border/50"
                    >
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => { setIsSelectionMode(false); setSelectedMessageIds([]); }}
                                className="p-2 hover:bg-white/10 rounded-full"
                            >
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                            <span className="font-medium">{selectedMessageIds.length} selected</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedMessageIds.length > 0 && (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleDeleteSelected}
                                    className="px-6 py-2 bg-red-500 text-white rounded-xl font-semibold flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Delete
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Component */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-strong p-4 relative">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                />

                {/* Emoji Picker */}
                <AnimatePresence>
                    {showEmojiPicker && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-full left-0 right-0 sm:left-auto sm:right-4 mb-2 z-50"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <EmojiPicker
                                onEmojiClick={onEmojiClick}
                                theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
                                searchDisabled
                                width="100%"
                                height={350}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center gap-2">
                    {!isRecording && (
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => triggerUpload("image/*,video/*")}
                            className="p-2 glass rounded-full"
                        >
                            <Camera className="w-5 h-5 text-primary" />
                        </motion.button>
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
                                    ref={inputRef}
                                    variant="glass"
                                    placeholder="Message group..."
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                                    className="pr-20 h-10"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button
                                        className="p-1.5 hover:bg-muted rounded-full transition-colors"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    >
                                        <Smile className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                    <button
                                        className="p-1.5 hover:bg-muted rounded-full transition-colors hidden sm:block"
                                        onClick={() => triggerUpload("image/*")}
                                    >
                                        <Image className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={messageText.trim() ? handleSendMessage : isRecording ? stopRecording : startRecording}
                        className={`p-3 rounded-full flex-shrink-0 neon-glow transition-colors ${isRecording ? "bg-red-500 text-white" : "bg-gradient-primary text-primary-foreground"
                            }`}
                    >
                        {messageText.trim() ? (
                            <Send className="w-5 h-5" />
                        ) : isRecording ? (
                            <div className="w-4 h-4 rounded-sm bg-white" />
                        ) : (
                            <Mic className="w-5 h-5" />
                        )}
                    </motion.button>
                </div>
            </motion.div>

            <GroupAdminPanel
                showPanel={showPanel}
                onClose={() => setShowPanel(false)}
                members={members}
                isCurrentUserAdmin={isCurrentUserAdmin}
                groupAvatar={groupAvatar}
                onRemoveMember={removeMember}
                onAddMember={addMember}
                onToggleAdmin={toggleAdmin}
                onGroupAvatarChange={handleGroupAvatarChange}
                onGroupNameChange={handleGroupNameChange}
                onLeaveGroup={async () => {
                    try {
                        await api.patch(`/chats/group/${chatId}/leave`);
                        toast.success("Left the group");
                        navigate("/chat");
                    } catch (error) {
                        toast.error("Failed to leave the group");
                    }
                }}
                addableUsers={[]} /* Left empty because we use dynamic search */
                currentUserId={currentUser?._id || ""}
                groupName={groupData?.groupName}
                initialTab={panelTab}
            />

            {/* ✅ POST/REEL VIEW DIALOG */}
            {isPostViewOpen && viewPostData && (
                <PostViewDialog
                    post={viewPostData}
                    isOpen={isPostViewOpen}
                    onClose={() => {
                        setIsPostViewOpen(false);
                        setViewPostData(null);
                    }}
                />
            )}

            {/* ✅ FULLSCREEN IMAGE */}
            <AnimatePresence>
                {fullScreenImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
                        onClick={() => setFullScreenImage(null)}
                    >
                        <button
                            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-all"
                            onClick={(e) => {
                                e.stopPropagation();
                                setFullScreenImage(null);
                            }}
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <motion.img
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            src={fullScreenImage}
                            alt="Fullscreen"
                            className="max-w-full max-h-full object-contain cursor-default"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ✅ FULLSCREEN VIDEO */}
            <AnimatePresence>
                {fullScreenVideo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
                        onClick={() => setFullScreenVideo(null)}
                    >
                        <button
                            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-all z-10"
                            onClick={(e) => {
                                e.stopPropagation();
                                setFullScreenVideo(null);
                            }}
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <motion.video
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            src={fullScreenVideo}
                            controls
                            autoPlay
                            className="max-w-full max-h-[90vh] object-contain cursor-default"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}