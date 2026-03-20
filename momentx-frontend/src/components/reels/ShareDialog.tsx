import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Link as LinkIconLucide, Mail, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/axios";

// Match your MongoDB User schema
interface ShareableTarget {
    _id: string; // User ID or Chat ID
    name: string;
    profilePic: string;
    isGroup?: boolean;
}

const FacebookIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

const MessengerIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26 6.559-6.963 3.131 3.259 5.889-3.259-6.561 6.963z" />
    </svg>
);

const WhatsAppIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

const ThreadsIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.332-3.023.88-.73 2.132-1.13 3.628-1.154 1.041-.017 2.005.09 2.881.318-.058-1.925-.753-2.746-2.312-2.857-.992-.056-1.986.282-2.467.866l-1.662-1.28c.859-1.078 2.39-1.72 4.103-1.615 1.352.084 2.457.514 3.284 1.278.908.84 1.37 2.053 1.373 3.604v.156c.658.274 1.25.638 1.752 1.09.883.795 1.487 1.855 1.793 3.15.254 1.073.247 2.324-.02 3.72-.42 2.188-1.56 4.034-3.296 5.342C17.593 23.24 15.108 24 12.186 24zm-.09-8.355c-1.272.018-2.161.278-2.645.776-.37.38-.54.841-.506 1.372.032.503.277.94.73 1.3.577.458 1.396.657 2.308.603 1.077-.058 1.88-.444 2.454-1.18.476-.608.783-1.456.915-2.527-.988-.224-2.058-.357-3.256-.344z" />
    </svg>
);

const XIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const LinkIcon = () => <LinkIconLucide className="w-5 h-5" />;
const MailIcon = () => <Mail className="w-5 h-5" />;

interface ShareDialogProps {
    isOpen: boolean;
    onClose: () => void;
    post: any;
}

export function ShareDialog({ isOpen, onClose, post }: ShareDialogProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
    const [targets, setTargets] = useState<ShareableTarget[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery("");
            setSelectedProfiles([]);
            return;
        }

        setLoading(true);
        Promise.all([
            api.get("/users/all").catch(() => ({ data: [] })),
            api.get("/chats").catch(() => ({ data: { data: [] } }))
        ]).then(([usersRes, chatsRes]) => {
            const usersPayload = usersRes.data?.data || usersRes.data?.users || usersRes.data?.docs || usersRes.data;
            const fetchedUsers = Array.isArray(usersPayload) ? usersPayload : [];
            const chatsPayload = chatsRes.data?.data || [];
            const fetchedGroups = Array.isArray(chatsPayload) ? chatsPayload.filter(c => c.isGroupChat) : [];

            const mappedUsers: ShareableTarget[] = fetchedUsers.map(u => ({
                _id: u._id,
                name: u.username || u.name || "Unknown",
                profilePic: u.profilePic || "/image.png",
                isGroup: false
            }));

            const mappedGroups: ShareableTarget[] = fetchedGroups.map(g => ({
                _id: g._id,
                name: g.groupName || "Unnamed Group",
                profilePic: g.groupAvatar || "/group-avatar.png",
                isGroup: true
            }));

            setTargets([...mappedGroups, ...mappedUsers]);
        }).finally(() => {
            setLoading(false);
        });
    }, [isOpen]);

    const filteredProfiles = searchQuery
        ? targets.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : targets;

    const toggleProfile = (id: string) => {
        setSelectedProfiles((prev) =>
            prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
        );
    };

    const handleSend = async () => {
        if (selectedProfiles.length === 0 || !post) return;
        setIsSending(true);

        try {
            const sharedData = {
                type: (post.videoUrl || post.isVideo) ? "reel" : "post",
                postId: post._id,
                thumbnail: post.thumbnailUrl || post.images?.[0] || post.imageUrl || post.videoUrl || "/placeholder-image.jpg",
                username: post.user?.username || "Unknown",
                userAvatar: post.user?.profilePic || post.user?.avatar || "/default-avatar.png",
                caption: post.caption
            };

            await Promise.all(
                selectedProfiles.map(userId =>
                    api.post(`/chats/send/${userId}`, { sharedPost: sharedData })
                )
            );

            toast.success(`Sent to ${selectedProfiles.length} chat${selectedProfiles.length > 1 ? 's' : ''}!`);
            onClose();
        } catch (error) {
            console.error("Failed to share", error);
            toast.error("Failed to send post.");
        } finally {
            setIsSending(false);
            setSelectedProfiles([]);
        }
    };

    const handleCopyLink = () => {
        if (!post?._id) return;
        navigator.clipboard.writeText(`${window.location.origin}/p/${post._id}`);
        toast.success("Link copied to clipboard!");
        onClose();
    };

    const shareOptions = [
        { icon: LinkIcon, label: "Copy link", color: "bg-white/10", action: handleCopyLink },
        { icon: FacebookIcon, label: "Facebook", color: "bg-blue-600", action: () => { } },
        { icon: MessengerIcon, label: "Messenger", color: "bg-gradient-to-br from-amber-500 to-teal-500", action: () => { } },
        { icon: WhatsAppIcon, label: "WhatsApp", color: "bg-green-500", action: () => { } },
        { icon: MailIcon, label: "Email", color: "bg-white/10", action: () => { } },
        { icon: ThreadsIcon, label: "Threads", color: "bg-white/10", action: () => { } },
        { icon: XIcon, label: "X", color: "bg-white/10", action: () => { } },
    ];

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-lg bg-background/95 glass-strong border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col z-[121] max-h-[85vh]"
                    >
                        <div className="flex justify-center py-4 shrink-0 sm:hidden">
                            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                        </div>

                        <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-card/10">
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10 group"
                            >
                                <X className="w-6 h-6 text-muted-foreground group-hover:text-white transition-colors" />
                            </button>
                            <h2 className="text-xl font-black tracking-tighter uppercase italic">
                                Transmission <span className="gradient-text">Hub</span>
                            </h2>
                            <div className="w-10" />
                        </div>

                        <div className="p-6 pb-2">
                            <div className="relative group/search">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within/search:text-primary transition-colors z-10" />
                                <input
                                    type="text"
                                    placeholder="Search recipients..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/5 text-white placeholder:text-muted-foreground/50 rounded-2xl pl-12 pr-4 py-4 outline-none border border-transparent focus:border-primary/30 focus:bg-white/10 transition-all font-bold text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-4">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-4">
                                    <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Scanning Signal...</p>
                                </div>
                            ) : filteredProfiles.length === 0 ? (
                                <div className="text-center py-10 opacity-30">
                                    <Search className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-xs font-black uppercase tracking-widest">No Frequencies Found</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-4 p-2">
                                    {filteredProfiles.map((profile, index) => (
                                        <motion.button
                                            key={profile._id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.02 }}
                                            onClick={() => toggleProfile(profile._id)}
                                            className="flex flex-col items-center gap-2 group/target"
                                        >
                                            <div className="relative">
                                                <div
                                                    className={cn(
                                                        "w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 transition-all duration-300",
                                                        selectedProfiles.includes(profile._id)
                                                            ? "border-primary p-1 scale-110 shadow-[0_0_20px_rgba(255,191,0,0.3)]"
                                                            : "border-transparent group-hover/target:border-white/20"
                                                    )}
                                                >
                                                    <img
                                                        src={profile.profilePic || "/image.png"}
                                                        alt={profile.name}
                                                        className="w-full h-full object-cover rounded-full"
                                                    />
                                                </div>
                                                <AnimatePresence>
                                                    {selectedProfiles.includes(profile._id) && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            exit={{ scale: 0 }}
                                                            className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-lg shadow-primary/20"
                                                        >
                                                            <svg className="w-3.5 h-3.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                                {profile.isGroup && !selectedProfiles.includes(profile._id) && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border border-background">
                                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 20h5V4H2v16h5m10 0v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5m10 0H7" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-tighter truncate w-full text-center group-hover/target:text-primary transition-colors",
                                                selectedProfiles.includes(profile._id) ? "text-primary" : "text-muted-foreground"
                                            )}>
                                                {profile.name}
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-6 border-t border-white/5 bg-card/5">
                            <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide">
                                {shareOptions.map((option, index) => (
                                    <motion.button
                                        key={option.label}
                                        onClick={option.action}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex flex-col items-center gap-2 group/social shrink-0"
                                    >
                                        <div
                                            className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all group-hover/social:scale-110 group-hover/social:-translate-y-1 shadow-lg",
                                                option.color
                                            )}
                                        >
                                            <option.icon />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover/social:text-white transition-colors">
                                            {option.label}
                                        </span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        <AnimatePresence>
                            {selectedProfiles.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, y: 20 }}
                                    animate={{ opacity: 1, height: "auto", y: 0 }}
                                    exit={{ opacity: 0, height: 0, y: 20 }}
                                    className="px-6 pb-8 pt-2 shrink-0 bg-card/20"
                                >
                                    <button
                                        onClick={handleSend}
                                        disabled={isSending}
                                        className="w-full bg-gradient-primary text-primary-foreground font-black uppercase tracking-[0.2em] py-4 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 neon-glow text-xs"
                                    >
                                        {isSending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <span>Deploy Signal to {selectedProfiles.length} Node{selectedProfiles.length > 1 ? 's' : ''}</span>
                                            </>
                                        )}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="h-6 shrink-0 sm:hidden" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}