import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Send, Smile, Camera, MoreVertical,
    Users, Crown, Check, CheckCheck
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import GroupAdminPanel from "@/components/chat/GroupAdminPanel";
import { useChat } from "@/hooks/useChat"; // ✅ Import your hook
import { useAuth } from "@/context/AuthContext"; // ✅ Import auth
import { api } from "@/lib/axios";
import { decryptMessage, encryptMessage } from "@/lib/cryptoUtils";

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

    // ✅ Initialize dynamic chat logic
    const { messages, sendMessage: sendSocketMessage, fetchMessages } = useChat(chatId);

    const [messageText, setMessageText] = useState("");
    const [groupData, setGroupData] = useState<any>(null);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [showPanel, setShowPanel] = useState(false);
    const [groupAvatar, setGroupAvatar] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Fetch real Group Metadata and Messages on load
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
                role: chat.groupAdmins.includes(p._id) ? "admin" : "member",
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
            fetchMessages(); // Fetches message history via hook
        }
    }, [chatId]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const isCurrentUserAdmin = members.find(m => m.id === currentUser?._id)?.role === "admin";

    // ✅ 2. Handle Dynamic Message Sending
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

    // ✅ 3. Dynamic Admin Actions (Calling real API)
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

    const onlineCount = members.filter((m) => m.isOnline).length;

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Header */}
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-strong p-4 flex items-center justify-between z-40">
                <div className="flex items-center gap-3">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/chat")} className="p-2 glass rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </motion.button>
                    <motion.div className="w-10 h-10 rounded-full bg-gradient-primary p-0.5 cursor-pointer overflow-hidden" onClick={() => setShowPanel(true)}>
                        {groupAvatar ? <img src={groupAvatar} className="w-full h-full rounded-full object-cover" /> :
                            <div className="w-full h-full rounded-full bg-card flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div>}
                    </motion.div>
                    <div className="cursor-pointer" onClick={() => setShowPanel(true)}>
                        <div className="flex items-center gap-1.5">
                            <h4 className="font-semibold font-display">{groupData?.groupName || "Loading..."}</h4>
                            {isCurrentUserAdmin && <span className="px-1.5 py-0.5 text-[8px] font-bold bg-primary/20 text-primary rounded-full uppercase flex items-center gap-0.5"><Crown className="w-2.5 h-2.5" /> Admin</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{members.length} members · {onlineCount} online</p>
                    </div>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowPanel(true)} className="p-2 glass rounded-full"><MoreVertical className="w-5 h-5" /></motion.button>
            </motion.div>

            {/* ✅ Dynamic Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                <AnimatePresence>
                    {messages.map((msg: any) => {
                        const isMe = msg.sender?._id === currentUser?._id;
                        const isSystem = msg.type === 'system';
                        const decryptedText = msg.text?.startsWith("U2FsdGVkX1") ? decryptMessage(msg.text) : msg.text;

                        return (
                            <motion.div key={msg._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                {isSystem ? (
                                    <div className="flex justify-center"><span className="px-4 py-1 text-xs text-muted-foreground glass rounded-full">{decryptedText}</span></div>
                                ) : (
                                    <div className={`flex ${isMe ? "justify-end" : "justify-start"} gap-2`}>
                                        {!isMe && <AvatarRing src={msg.sender?.profilePic} size="sm" />}
                                        <div className="max-w-[75%]">
                                            {!isMe && <div className="text-[10px] font-semibold text-primary mb-0.5 ml-1">{msg.sender?.username}</div>}
                                            <div className={`p-3 rounded-2xl ${isMe ? "bg-gradient-primary text-white rounded-br-none" : "glass rounded-bl-none"}`}>
                                                <p className="text-sm">{decryptedText}</p>
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

            {/* Input */}
            <div className="glass-strong p-4">
                <div className="flex items-center gap-2">
                    <motion.button whileTap={{ scale: 0.9 }} className="p-2 glass rounded-full"><Camera className="w-5 h-5 text-primary" /></motion.button>
                    <div className="flex-1 relative">
                        <Input
                            variant="glass"
                            placeholder="Message group..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            className="pr-12"
                        />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2"><Smile className="w-5 h-5 text-muted-foreground" /></button>
                    </div>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={handleSendMessage} className="p-3 bg-gradient-primary rounded-full shadow-lg">
                        <Send className="w-5 h-5 text-white" />
                    </motion.button>
                </div>
            </div>

            <GroupAdminPanel
                showPanel={showPanel}
                onClose={() => setShowPanel(false)}
                members={members}
                isCurrentUserAdmin={isCurrentUserAdmin}
                groupAvatar={groupAvatar}
                onRemoveMember={removeMember}
                onAddMember={addMember}
                onToggleAdmin={toggleAdmin}
                onGroupAvatarChange={fetchGroupInfo}
                onLeaveGroup={() => navigate("/chat")}
                addableUsers={[]}
            />
        </div>
    );
}