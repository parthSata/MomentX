import { useState, useEffect } from "react";
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
    // ✅ Changed from postId: string to post: any to access all content details for sharing
    post: any;
}

export function ShareDialog({ isOpen, onClose, post }: ShareDialogProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);

    // Real State Variables
    const [targets, setTargets] = useState<ShareableTarget[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Fetch REAL Users and Groups dynamically when the dialog opens
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
            const usersPayload = usersRes.data?.message || usersRes.data?.users || usersRes.data?.docs || usersRes.data;
            const fetchedUsers = Array.isArray(usersPayload) ? usersPayload : [];

            const chatsPayload = chatsRes.data?.data || [];
            const fetchedGroups = Array.isArray(chatsPayload) ? chatsPayload.filter(c => c.isGroupChat) : [];

            // Map users to ShareableTarget
            const mappedUsers: ShareableTarget[] = fetchedUsers.map(u => ({
                _id: u._id,
                name: u.username || u.name || "Unknown",
                profilePic: u.profilePic || "/image.png",
                isGroup: false
            }));

            // Map groups to ShareableTarget
            const mappedGroups: ShareableTarget[] = fetchedGroups.map(g => ({
                _id: g._id, // group chat uses its own _id as receiverId
                name: g.groupName || "Unnamed Group",
                profilePic: g.groupAvatar || "/group-avatar.png",
                isGroup: true
            }));

            // Combine them, putting groups first, then users
            setTargets([...mappedGroups, ...mappedUsers]);
        }).finally(() => {
            setLoading(false);
        });
    }, [isOpen]);

    // Local filtering based on what is typed in the search bar
    const filteredProfiles = searchQuery
        ? targets.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : targets;

    const toggleProfile = (id: string) => {
        setSelectedProfiles((prev) =>
            prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
        );
    };

    // ✅ Actual Backend Share Logic
    const handleSend = async () => {
        if (selectedProfiles.length === 0 || !post) return;
        setIsSending(true);

        try {
            // Build the robust sharedPost payload
            const sharedData = {
                type: (post.videoUrl || post.isVideo) ? "reel" : "post",
                postId: post._id,
                thumbnail: post.thumbnailUrl || post.images?.[0] || post.imageUrl || post.videoUrl || "/placeholder-image.jpg",
                username: post.user?.username || "Unknown",
                userAvatar: post.user?.profilePic || post.user?.avatar || "/default-avatar.png",
                caption: post.caption
            };

            // Loop through selected users and send message via Chat API
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
        { icon: MessengerIcon, label: "Messenger", color: "bg-gradient-to-br from-purple-500 to-pink-500", action: () => { } },
        { icon: WhatsAppIcon, label: "WhatsApp", color: "bg-green-500", action: () => { } },
        { icon: MailIcon, label: "Email", color: "bg-white/10", action: () => { } },
        { icon: ThreadsIcon, label: "Threads", color: "bg-white/10", action: () => { } },
        { icon: XIcon, label: "X", color: "bg-white/10", action: () => { } },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-70"
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-70 bg-zinc-900 rounded-t-3xl max-h-[85vh] flex flex-col md:max-w-md md:left-1/2 md:-translate-x-1/2 md:bottom-4 md:rounded-3xl border border-white/10 shadow-2xl"
                    >
                        <div className="flex justify-center py-3 shrink-0 md:hidden">
                            <div className="w-10 h-1 bg-white/30 rounded-full" />
                        </div>
                        <div className="flex items-center justify-between px-4 pb-3 shrink-0">
                            <button onClick={onClose} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-6 h-6 text-white" />
                            </button>
                            <h2 className="text-white font-semibold text-lg">Share</h2>
                            <div className="w-10" />
                        </div>

                        <div className="px-4 pb-4 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 z-10" />
                                <input
                                    type="text"
                                    placeholder="Search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/10 text-white placeholder:text-white/50 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-white/20"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-0">
                            <div className="px-4 pb-4">
                                {loading ? (
                                    <div className="flex justify-center items-center py-10">
                                        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                                    </div>
                                ) : filteredProfiles.length === 0 ? (
                                    <div className="text-center text-white/50 py-10">
                                        No users found.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-4 gap-3">
                                        {filteredProfiles.map((profile, index) => (
                                            <motion.button
                                                key={profile._id}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.02 }}
                                                onClick={() => toggleProfile(profile._id)}
                                                className="flex flex-col items-center gap-2"
                                            >
                                                <div className="relative">
                                                    <div
                                                        className={cn(
                                                            "w-16 h-16 rounded-full overflow-hidden border-2 transition-all",
                                                            selectedProfiles.includes(profile._id)
                                                                ? "border-blue-500"
                                                                : "border-transparent"
                                                        )}
                                                    >
                                                        <img
                                                            src={profile.profilePic}
                                                            alt={profile.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    {selectedProfiles.includes(profile._id) && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                                                        >
                                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </motion.div>
                                                    )}
                                                    {profile.isGroup && (
                                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md">
                                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5V4H2v16h5m10 0v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5m10 0H7" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-white text-xs truncate w-full text-center">
                                                    {profile.name.length > 10
                                                        ? profile.name.slice(0, 10) + "..."
                                                        : profile.name}
                                                </span>
                                            </motion.button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-4 py-4 border-t border-white/10 shrink-0">
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                {shareOptions.map((option, index) => (
                                    <motion.button
                                        key={option.label}
                                        onClick={option.action}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex flex-col items-center gap-2 min-w-15 hover:opacity-80 transition-opacity"
                                    >
                                        <div
                                            className={cn(
                                                "w-12 h-12 rounded-full flex items-center justify-center text-white",
                                                option.color
                                            )}
                                        >
                                            <option.icon />
                                        </div>
                                        <span className="text-white text-xs">{option.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        <AnimatePresence>
                            {selectedProfiles.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-4 pb-6 shrink-0"
                                >
                                    <button
                                        onClick={handleSend}
                                        disabled={isSending}
                                        className="w-full bg-blue-500 text-white font-semibold py-3 rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isSending && <Loader2 className="w-5 h-5 animate-spin text-white" />}
                                        Send ({selectedProfiles.length})
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="h-4 shrink-0" />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}