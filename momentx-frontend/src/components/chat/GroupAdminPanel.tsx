import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Search, Users, Crown, UserPlus,
    LogOut, Camera
} from "lucide-react"; // ✅ Removed unused icons
import { AvatarRing } from "@/components/ui/avatar-ring";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/axios";

interface GroupMember {
    id: string;
    name: string;
    username: string;
    avatar: string;
    role: "admin" | "member";
    isOnline?: boolean;
}

interface AddableUser {
    id: string;
    name: string;
    username: string;
    avatar: string;
}

interface GroupAdminPanelProps {
    showPanel: boolean;
    onClose: () => void;
    members: GroupMember[];
    isCurrentUserAdmin: boolean;
    groupAvatar: string | null;
    onRemoveMember: (id: string) => void;
    onAddMember: (user: AddableUser) => void;
    onToggleAdmin: (id: string) => void;
    onGroupAvatarChange: (url: string) => void;
    onLeaveGroup: () => void;
    addableUsers: AddableUser[];
}

export default function GroupAdminPanel({
    showPanel,
    onClose,
    members,
    isCurrentUserAdmin,
    groupAvatar,
    onRemoveMember,
    onAddMember,
    onToggleAdmin,
    onGroupAvatarChange,
    onLeaveGroup,
}: GroupAdminPanelProps) {
    const [showAddMember, setShowAddMember] = useState(false);
    const [addSearch, setAddSearch] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [memberAction, setMemberAction] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Dynamic User Search for adding members
    const handleSearch = async (query: string) => {
        setAddSearch(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const { data } = await api.get(`/users/search?username=${query}`);
            const existingIds = members.map(m => m.id);
            // Filter out people who are already members
            const filtered = (data.data || []).filter((u: any) => !existingIds.includes(u._id));
            setSearchResults(filtered);
        } catch (error) {
            console.error("Search failed", error);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            onGroupAvatarChange(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleClose = () => {
        setShowAddMember(false);
        setAddSearch("");
        setSearchResults([]);
        setMemberAction(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {showPanel && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 28, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 w-[85%] max-w-sm z-50 glass-strong flex flex-col"
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                        />

                        {/* Panel Header */}
                        <div className="p-5 border-b border-border/50 text-center">
                            <div className="flex items-center justify-between mb-4">
                                <motion.button whileTap={{ scale: 0.9 }} onClick={handleClose}>
                                    <X className="w-5 h-5" />
                                </motion.button>
                                <h3 className="font-display font-bold gradient-text">Group Info</h3>
                                <div className="w-5" />
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="relative mb-3">
                                    <div className="w-24 h-24 rounded-full bg-gradient-primary p-0.75 overflow-hidden">
                                        {groupAvatar ? (
                                            <img src={groupAvatar} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                                                <Users className="w-10 h-10 text-primary" />
                                            </div>
                                        )}
                                    </div>
                                    {isCurrentUserAdmin && (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute -bottom-1 -right-1 p-2.5 bg-gradient-primary rounded-full ring-3 ring-background shadow-lg"
                                        >
                                            <Camera className="w-4 h-4 text-primary-foreground" />
                                        </button>
                                    )}
                                </div>
                                <h2 className="font-display font-bold text-lg">{members[0]?.name || "Group Settings"}</h2>
                            </div>
                        </div>

                        {/* Members List */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-xs font-bold uppercase text-muted-foreground">Members ({members.length})</p>
                                {isCurrentUserAdmin && (
                                    <button onClick={() => setShowAddMember(!showAddMember)}>
                                        <UserPlus className="w-4 h-4 text-primary" />
                                    </button>
                                )}
                            </div>

                            {/* Search for adding members */}
                            <AnimatePresence>
                                {showAddMember && (
                                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="mb-4 space-y-2">
                                        <div className="relative">
                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                            <Input value={addSearch} onChange={(e) => handleSearch(e.target.value)} placeholder="Search users..." className="pl-8 h-9 text-xs" />
                                        </div>
                                        <div className="max-h-40 overflow-y-auto space-y-1">
                                            {searchResults.map(user => (
                                                <div key={user._id} onClick={() => onAddMember({ id: user._id, name: user.name, username: user.username, avatar: user.profilePic })} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                                                    {/* ✅ FIXED: Size changed from "xs" to "sm" */}
                                                    <AvatarRing src={user.profilePic} size="sm" />
                                                    <div className="flex-1 text-xs">
                                                        <p className="font-bold">@{user.username}</p>
                                                    </div>
                                                    <UserPlus className="w-3 h-3 text-primary" />
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-1">
                                {members.map((member) => (
                                    <div key={member.id} className="relative group">
                                        <div
                                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/40 cursor-pointer"
                                            onClick={() => isCurrentUserAdmin && member.id !== "me" && setMemberAction(memberAction === member.id ? null : member.id)}
                                        >
                                            <AvatarRing src={member.avatar} size="sm" isOnline={member.isOnline} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-sm font-semibold truncate">{member.name}</p>
                                                    {member.role === "admin" && <Crown className="w-3 h-3 text-primary fill-primary" />}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground">@{member.username}</p>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {memberAction === member.id && (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 p-2 pt-0">
                                                    <button onClick={() => onToggleAdmin(member.id)} className="flex-1 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-bold">
                                                        {member.role === "admin" ? "Dismiss Admin" : "Make Admin"}
                                                    </button>
                                                    <button onClick={() => onRemoveMember(member.id)} className="flex-1 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-[10px] font-bold">
                                                        Remove
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-border/50">
                            <button
                                onClick={onLeaveGroup}
                                className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 transition-colors font-medium text-sm"
                            >
                                <LogOut className="w-4 h-4" />
                                Leave Group
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}