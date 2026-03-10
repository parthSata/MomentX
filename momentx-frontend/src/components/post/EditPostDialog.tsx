import { useState, useEffect } from "react" // ✅ Removed unused useCallback
import { motion, AnimatePresence } from "framer-motion"
import { X, MapPin, Tag, UserPlus, Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { AvatarRing } from "@/components/ui/avatar-ring"
import { api } from "@/lib/axios"
import { cn } from "@/lib/utils"

interface EditPostDialogProps {
    isOpen: boolean
    onClose: () => void
    caption: string
    initialLocation?: string
    initialTaggedUsers?: any[]
    onSave: (data: { caption: string; location: string; taggedUsers: string[] }) => void
}

export function EditPostDialog({ isOpen, onClose, caption, initialLocation, initialTaggedUsers, onSave }: EditPostDialogProps) {
    const [editCaption, setEditCaption] = useState(caption)
    const [location, setLocation] = useState(initialLocation || "")

    const [taggedUsers, setTaggedUsers] = useState<any[]>(initialTaggedUsers || [])
    const [userSearchQuery, setUserSearchQuery] = useState("")
    const [userSuggestions, setUserSuggestions] = useState<any[]>([])
    const [isSearchingUsers, setIsSearchingUsers] = useState(false)
    const [showUserTagInput, setShowUserTagInput] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setEditCaption(caption || "");
            setLocation(initialLocation || "");
            setTaggedUsers(initialTaggedUsers || []);
            setUserSearchQuery("");
            setUserSuggestions([]);
        }
    }, [isOpen, caption, initialLocation, initialTaggedUsers]);

    useEffect(() => {
        const searchUsers = async () => {
            if (userSearchQuery.length < 2) {
                setUserSuggestions([]);
                return;
            }
            setIsSearchingUsers(true);
            try {
                const { data } = await api.get(`/users/search?query=${userSearchQuery}`);
                setUserSuggestions(data.data || []);
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setIsSearchingUsers(false);
            }
        };

        const timeoutId = setTimeout(searchUsers, 400);
        return () => clearTimeout(timeoutId);
    }, [userSearchQuery]);

    const toggleTagUser = (user: any) => {
        if (taggedUsers.find(u => u._id === user._id)) {
            setTaggedUsers(taggedUsers.filter(u => u._id !== user._id));
        } else {
            setTaggedUsers([...taggedUsers, user]);
        }
        setUserSearchQuery("");
        setUserSuggestions([]);
    };

    const handleSave = () => {
        onSave({
            caption: editCaption,
            location,
            taggedUsers: taggedUsers.map(u => u._id)
        })
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-lg glass-strong bg-background/95 border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-border/50">
                            <h2 className="text-lg font-semibold">Edit Post</h2>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Caption</label>
                                <Textarea
                                    value={editCaption}
                                    onChange={(e) => setEditCaption(e.target.value)}
                                    placeholder="Write a caption..."
                                    className="min-h-24 bg-muted/30 border-border/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> Location
                                </label>
                                <Input
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Edit location..."
                                    className="bg-muted/30 border-border/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <button
                                    onClick={() => setShowUserTagInput(!showUserTagInput)}
                                    className="w-full flex items-center justify-between p-3 glass rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <UserPlus className="w-4 h-4 text-primary" />
                                        <span>Tag People</span>
                                    </div>
                                    <Tag className={cn("w-4 h-4 text-muted-foreground transition-transform", showUserTagInput && "rotate-180")} />
                                </button>

                                {showUserTagInput && (
                                    <div className="space-y-3 bg-secondary/20 p-3 rounded-xl border border-border/50">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                value={userSearchQuery}
                                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                                placeholder="Search users..."
                                                className="pl-9 h-9"
                                            />
                                            {isSearchingUsers && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />}

                                            {userSuggestions.length > 0 && (
                                                <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-xl overflow-hidden max-h-40 overflow-y-auto">
                                                    {userSuggestions.map(user => (
                                                        <button
                                                            key={user._id}
                                                            onClick={() => toggleTagUser(user)}
                                                            className="w-full flex items-center gap-3 p-2 hover:bg-muted transition-colors border-b border-border last:border-0"
                                                        >
                                                            {/* ✅ FIX: Changed size from "xs" to "sm" */}
                                                            <AvatarRing src={user.profilePic} size="sm" />
                                                            <div className="text-left">
                                                                <p className="text-xs font-bold">{user.username}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {taggedUsers.map(user => (
                                                <span key={user._id} className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center gap-1.5">
                                                    @{user.username}
                                                    <X className="w-3 h-3 cursor-pointer hover:opacity-70" onClick={() => toggleTagUser(user)} />
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button variant="ghost" className="flex-1" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button variant="gradient" className="flex-1" onClick={handleSave}>
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}