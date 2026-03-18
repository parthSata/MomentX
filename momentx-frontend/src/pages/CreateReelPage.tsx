import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Video, Hash, X, Loader2, UserPlus, ChevronRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { toast } from "sonner";
import { api } from "@/lib/axios";

export default function CreateReelPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState<"select" | "details">("select");

    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);

    const [caption, setCaption] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [showTagInput, setShowTagInput] = useState(false);

    // User Tagging State
    const [taggedUsers, setTaggedUsers] = useState<any[]>([]);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [showUserTagInput, setShowUserTagInput] = useState(false);

    // User Search Logic
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
                console.error("User search failed", error);
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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("video/")) {
                toast.error("Please select a valid video file.");
                return;
            }
            if (file.size > 100 * 1024 * 1024) {
                toast.error("Video size should be less than 100MB.");
                return;
            }

            setVideoFile(file);
            const videoUrl = URL.createObjectURL(file);
            setSelectedVideo(videoUrl);
            setStep("details");
        }
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim().replace(/^#/, "")]);
            setTagInput("");
        }
    };

    const handleRemoveTag = (tag: string) => {
        setTags(tags.filter((t) => t !== tag));
    };

    const handlePost = async () => {
        if (!videoFile) return;
        setIsPosting(true);

        try {
            const formData = new FormData();
            formData.append("video", videoFile);
            formData.append("caption", caption);
            formData.append("hashtags", tags.join(","));

            // Send Tagged User IDs as stringified JSON
            if (taggedUsers.length > 0) {
                formData.append("taggedUsers", JSON.stringify(taggedUsers.map(u => u._id)));
            }

            await api.post("/reels/create", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("Reel shared successfully!");
            navigate("/");
        } catch (error: any) {
            console.error("Post Error:", error);
            toast.error("Failed to share reel", {
                description: error.response?.data?.message || "Something went wrong"
            });
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10"
            >
                <div className="max-w-md mx-auto p-4 flex items-center justify-between">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            if (step === "select") navigate(-1);
                            else setStep("select");
                        }}
                        className="p-2 hover:bg-white/10 rounded-full"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </motion.button>

                    <h1 className="text-lg font-bold">
                        {step === "select" ? "New Reel" : "Reel Details"}
                    </h1>

                    {step === "details" ? (
                        <Button
                            variant="gradient"
                            size="sm"
                            onClick={handlePost}
                            disabled={isPosting}
                            className="min-w-20"
                        >
                            {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Share"}
                        </Button>
                    ) : (
                        <div className="w-10" />
                    )}
                </div>
            </motion.div>

            <div className="max-w-md mx-auto pb-20">
                <AnimatePresence mode="wait">
                    {step === "select" && (
                        <motion.div
                            key="select"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="p-4 flex flex-col items-center justify-center h-[80vh]"
                        >
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full max-w-xs aspect-9/16 border-2 border-dashed border-white/20 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/5 transition-all"
                            >
                                <div className="p-4 bg-white/10 rounded-full">
                                    <Video className="w-12 h-12 text-primary" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-lg">Select Video</p>
                                    <p className="text-sm text-white/50">Up to 60 seconds</p>
                                </div>
                            </div>
                            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
                        </motion.div>
                    )}

                    {step === "details" && selectedVideo && (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-4 space-y-6"
                        >
                            <div className="flex gap-4">
                                <div className="w-24 aspect-9/16 bg-gray-900 rounded-lg overflow-hidden relative">
                                    <video src={selectedVideo} className="w-full h-full object-cover" muted autoPlay loop />
                                </div>
                                <div className="flex-1">
                                    <Textarea
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        placeholder="Write a caption..."
                                        className="h-full bg-transparent border-none resize-none focus:ring-0 text-base placeholder:text-white/30"
                                    />
                                </div>
                            </div>

                            <div className="h-px bg-white/10" />

                            {/* Tag People */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowUserTagInput(!showUserTagInput)}
                                    className="flex items-center justify-between w-full py-2 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <UserPlus className="w-5 h-5 text-primary" />
                                        <span className="text-lg">Tag People</span>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 text-white/50 transition-transform ${showUserTagInput ? 'rotate-90' : ''}`} />
                                </button>

                                {showUserTagInput && (
                                    <div className="bg-white/5 p-4 rounded-2xl space-y-4 border border-white/5">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 z-10" />
                                            <Input
                                                value={userSearchQuery}
                                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                                placeholder="Search for people..."
                                                className="pl-10 bg-black/50 border-white/10 focus:border-primary"
                                            />
                                            {isSearchingUsers && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />}

                                            {userSuggestions.length > 0 && (
                                                <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                                                    {userSuggestions.map(user => (
                                                        <button
                                                            key={user._id}
                                                            onClick={() => toggleTagUser(user)}
                                                            className="w-full flex items-center gap-3 p-3 hover:bg-zinc-800 transition-colors border-b border-white/5 last:border-0"
                                                        >
                                                            <AvatarRing src={user.profilePic} size="sm" />
                                                            <div className="text-left">
                                                                <p className="text-sm font-bold">@{user.username}</p>
                                                                <p className="text-[10px] text-white/50">{user.name}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {taggedUsers.map(user => (
                                                <span key={user._id} className="px-3 py-1.5 bg-primary/20 text-primary rounded-full text-xs font-medium flex items-center gap-2 border border-primary/30">
                                                    @{user.username}
                                                    <X className="w-3.5 h-3.5 cursor-pointer hover:text-white" onClick={() => toggleTagUser(user)} />
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="h-px bg-white/10" />

                            {/* Topics */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowTagInput(!showTagInput)}
                                    className="flex items-center justify-between w-full py-2 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <Hash className="w-5 h-5 text-white/70" />
                                        <span className="text-lg">Add Topics</span>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 text-white/50 transition-transform ${showTagInput ? 'rotate-90' : ''}`} />
                                </button>

                                {showTagInput && (
                                    <div className="bg-white/5 p-4 rounded-2xl space-y-3 border border-white/5">
                                        <div className="flex gap-2">
                                            <Input
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                placeholder="travel, food..."
                                                className="bg-black/50 border-white/10 focus:border-primary"
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                            />
                                            <Button onClick={handleAddTag} size="sm" variant="secondary">Add</Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {tags.map(t => (
                                                <span key={t} className="px-3 py-1 bg-white/10 text-white rounded-full text-sm flex items-center gap-1 border border-white/10">
                                                    #{t} <X className="w-3 h-3 cursor-pointer hover:text-red-400" onClick={() => handleRemoveTag(t)} />
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
