import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Video, Hash, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("video/")) {
                toast.error("Please select a valid video file.");
                return;
            }
            if (file.size > 50 * 1024 * 1024) {
                toast.error("Video size should be less than 50MB.");
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
            {/* Header */}
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

                    {/* Step 1: Select Video */}
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
                                // ✅ FIX: Updated to aspect-9/16
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

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="video/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </motion.div>
                    )}

                    {/* Step 2: Details */}
                    {step === "details" && selectedVideo && (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-4 space-y-6"
                        >
                            {/* Preview */}
                            <div className="flex gap-4">
                                {/* ✅ FIX: Updated to aspect-9/16 */}
                                <div className="w-24 aspect-9/16 bg-gray-900 rounded-lg overflow-hidden relative">
                                    <video src={selectedVideo} className="w-full h-full object-cover" muted autoPlay loop />
                                </div>
                                <div className="flex-1">
                                    <Textarea
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        placeholder="Write a caption..."
                                        className="h-full bg-transparent border-none resize-none focus:ring-0 text-base"
                                    />
                                </div>
                            </div>

                            <div className="h-px bg-white/10" />

                            {/* Tags */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowTagInput(!showTagInput)}
                                    className="flex items-center gap-3 w-full py-2 hover:opacity-80"
                                >
                                    <Hash className="w-5 h-5 text-white/70" />
                                    <span className="text-lg">Add Topics</span>
                                </button>

                                {showTagInput && (
                                    <div className="bg-white/5 p-4 rounded-xl space-y-3">
                                        <div className="flex gap-2">
                                            <Input
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                placeholder="travel, food..."
                                                className="bg-black/50 border-white/10"
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                            />
                                            <Button onClick={handleAddTag} size="sm" variant="secondary">Add</Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {tags.map(t => (
                                                <span key={t} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-1 border border-primary/30">
                                                    #{t} <X className="w-3 h-3 cursor-pointer" onClick={() => handleRemoveTag(t)} />
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