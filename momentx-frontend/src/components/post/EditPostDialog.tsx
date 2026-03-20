import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, MapPin, Tag, UserPlus, Loader2, Search, Plus } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

    const [locationSearchQuery, setLocationSearchQuery] = useState(initialLocation || "")
    const [locationSuggestions, setLocationSuggestions] = useState<any[]>([])
    const [isSearchingLocation, setIsSearchingLocation] = useState(false)

    const [showUserTagInput, setShowUserTagInput] = useState(false)
    const [isLocating, setIsLocating] = useState(false)

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

    useEffect(() => {
        const searchLocations = async () => {
            if (locationSearchQuery.length < 2 || locationSearchQuery === location) {
                setLocationSuggestions([]);
                return;
            }
            setIsSearchingLocation(true);
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearchQuery)}&limit=5&addressdetails=1`,
                    { headers: { 'Accept-Language': 'en' } }
                );
                const data = await response.json();
                setLocationSuggestions(data || []);
            } catch (error) {
                console.error("Location search failed:", error);
            } finally {
                setIsSearchingLocation(false);
            }
        };

        const timeoutId = setTimeout(searchLocations, 500);
        return () => clearTimeout(timeoutId);
    }, [locationSearchQuery, location]);

    const toggleTagUser = (user: any) => {
        if (taggedUsers.find(u => u._id === user._id)) {
            setTaggedUsers(taggedUsers.filter(u => u._id !== user._id));
        } else {
            setTaggedUsers([...taggedUsers, user]);
        }
        setUserSearchQuery("");
        setUserSuggestions([]);
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Reverse geocoding using Nominatim (OpenStreetMap)
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
                        { headers: { 'Accept-Language': 'en' } }
                    );
                    const data = await response.json();

                    if (data && data.address) {
                        const city = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.state;
                        const country = data.address.country;
                        const locationName = city ? `${city}, ${country}` : (data.name || data.display_name.split(',')[0]);

                        setLocation(locationName);
                        toast.success(`Signal locked: ${locationName}`);
                    } else {
                        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                        toast.success("Coordinates acquired (name resolution failed)");
                    }
                } catch (error) {
                    console.error("Reverse geocoding failed:", error);
                    setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                    toast.success("Coordinates acquired (fallback used)");
                } finally {
                    setIsLocating(false);
                }
            },
            (err) => {
                console.error("Geolocation error:", err);
                toast.error("Location access denied or signal lost");
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    const handleSave = () => {
        onSave({
            caption: editCaption,
            location,
            taggedUsers: taggedUsers.map(u => u._id)
        })
        onClose()
    }

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg glass-strong bg-background/95 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-[131]"
                    >
                        {/* Header */}
                        <div className="px-8 py-6 flex items-center justify-between border-b border-white/5 bg-card/10">
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10 group"
                            >
                                <X className="w-6 h-6 text-muted-foreground group-hover:text-white transition-colors" />
                            </button>
                            <h2 className="text-xl font-black tracking-tighter uppercase italic text-center flex-1">
                                Calibrate <span className="gradient-text">Transmission</span>
                            </h2>
                            <div className="w-10" />
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                            {/* Caption Section */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 ml-2">Internal Log (Caption)</label>
                                <div className="relative group">
                                    <Textarea
                                        value={editCaption}
                                        onChange={(e) => setEditCaption(e.target.value)}
                                        placeholder="Transmit your message..."
                                        className="min-h-32 bg-white/5 border-white/5 rounded-3xl p-5 focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all text-sm font-bold resize-none"
                                    />
                                    <div className="absolute bottom-4 right-4 text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">
                                        {editCaption.length} chars
                                    </div>
                                </div>
                            </div>

                            {/* Location Section */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 ml-2">Signal Coordinates</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        value={locationSearchQuery}
                                        onChange={(e) => setLocationSearchQuery(e.target.value)}
                                        placeholder="Search location..."
                                        className="bg-white/5 border-white/5 rounded-2xl pl-12 pr-28 h-14 focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all font-bold text-sm"
                                    />
                                    <button
                                        onClick={handleGetLocation}
                                        disabled={isLocating}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 h-9 px-4 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20 transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isLocating || isSearchingLocation ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <MapPin className="w-3 h-3" />
                                        )}
                                        Detect
                                    </button>

                                    {locationSuggestions.length > 0 && (
                                        <div className="absolute z-[160] w-full mt-2 bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col p-1.5 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="overflow-y-auto max-h-48 custom-scrollbar">
                                                {locationSuggestions.map((s, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => {
                                                            const name = s.address.city || s.address.town || s.address.village || s.display_name.split(',')[0];
                                                            const country = s.address.country;
                                                            const full = `${name}, ${country}`;
                                                            setLocation(full);
                                                            setLocationSearchQuery(full);
                                                            setLocationSuggestions([]);
                                                        }}
                                                        className="w-full text-left p-3 hover:bg-white/10 rounded-xl transition-all flex items-start gap-3 border border-transparent hover:border-white/5"
                                                    >
                                                        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                                        <div>
                                                            <p className="text-xs font-black tracking-tight leading-tight">{s.display_name.split(',')[0]}</p>
                                                            <p className="text-[10px] text-muted-foreground font-bold truncate tracking-tight">{s.display_name.split(',').slice(1).join(',')}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tagging Section */}
                            <div className="space-y-4">
                                <button
                                    onClick={() => setShowUserTagInput(!showUserTagInput)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-5 rounded-3xl border border-white/5 transition-all group/tag",
                                        showUserTagInput ? "bg-white/10 border-primary/20" : "bg-white/5 hover:bg-white/10"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                            <UserPlus className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <span className="text-xs font-black uppercase tracking-widest block">Tag Nodes</span>
                                            <span className="text-[10px] text-muted-foreground font-bold">{taggedUsers.length} Users Encrypted</span>
                                        </div>
                                    </div>
                                    <Tag className={cn("w-5 h-5 text-muted-foreground group-hover/tag:text-primary transition-all", showUserTagInput && "rotate-180")} />
                                </button>

                                <AnimatePresence>
                                    {showUserTagInput && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-4 bg-black/20 p-5 rounded-[2rem] border border-white/5 overflow-hidden"
                                        >
                                            <div className="relative group">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                                                <Input
                                                    value={userSearchQuery}
                                                    onChange={(e) => setUserSearchQuery(e.target.value)}
                                                    placeholder="Search People..."
                                                    className="bg-white/5 border-white/5 rounded-xl pl-10 h-12 focus:border-primary/30 transition-all font-bold text-xs"
                                                />
                                                {isSearchingUsers && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />}

                                                {userSuggestions.length > 0 && (
                                                    <div className="mt-4 bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col p-1.5 animate-in slide-in-from-top-2 duration-300">
                                                        <div className="px-4 py-3 text-[10px] font-black text-primary uppercase tracking-[0.2em] border-b border-white/5 mb-1 shrink-0 flex items-center justify-between">
                                                            <span>Nodes Detected</span>
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                        </div>
                                                        <div className="overflow-y-auto max-h-60 custom-scrollbar flex-1 px-1">
                                                            {userSuggestions.map(user => (
                                                                <button
                                                                    key={user._id}
                                                                    onClick={() => toggleTagUser(user)}
                                                                    className="w-full flex items-center gap-3 p-3 hover:bg-white/10 rounded-2xl transition-all group/suggestion border border-transparent hover:border-white/5 mb-1 last:mb-0"
                                                                >
                                                                    <AvatarRing src={user.avatar || user.profilePic || "/image.png"} size="sm" />
                                                                    <div className="text-left flex-1 min-w-0">
                                                                        <p className="text-sm font-black group-hover/suggestion:text-primary transition-colors italic truncate tracking-tight">@{user.username}</p>
                                                                        <p className="text-[10px] text-muted-foreground font-bold truncate opacity-60 tracking-tight">{user.name || user.displayName || "Unknown User"}</p>
                                                                    </div>
                                                                    <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center opacity-0 group-hover/suggestion:opacity-100 transition-opacity">
                                                                        <Plus className="w-4 h-4 text-primary" />
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {taggedUsers.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5 mt-4">
                                                    {taggedUsers.map(user => (
                                                        <span key={user._id} className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-primary/20 hover:bg-primary/20 transition-colors">
                                                            @{user.username}
                                                            <X className="w-3.5 h-3.5 cursor-pointer hover:text-white transition-colors" onClick={() => toggleTagUser(user)} />
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-8 pt-4 border-t border-white/5 flex gap-4 bg-card/5">
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 px-6 rounded-2xl border border-white/10 hover:bg-white/5 font-black uppercase tracking-widest text-[10px] transition-all"
                            >
                                Abort
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-[1.5] py-4 px-6 rounded-2xl bg-gradient-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] neon-glow"
                            >
                                Deploy Changes
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}