import { useRef, useState, useImperativeHandle, forwardRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { AvatarRing } from "@/components/ui/avatar-ring"
import { api } from "@/lib/axios"
import { toast } from "sonner"
import type { Story } from "@/hooks/useStories"
import { StoryUploadDialog } from "./StoryUploadDialog"

export interface StoriesBarRef {
  triggerUpload: () => void;
}

interface StoriesBarProps {
  stories: Story[];
  onStoryClick: (storyId: string) => void;
  onFileSelect?: (file: File) => void;
  currentUser: any;
  onUploadSuccess?: () => void;
}

export const StoriesBar = forwardRef<StoriesBarRef, StoriesBarProps>(({
  stories,
  onStoryClick,
  currentUser,
  onUploadSuccess
}, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const safeStories = Array.isArray(stories) ? stories : [];

  const getUserId = (user: any) => {
    if (!user) return "";
    return typeof user === 'object' ? user._id?.toString() : user.toString();
  }

  const getUserAvatar = (user: any) => {
    return user?.avatar || user?.profilePic || "/image.png";
  }

  // ✅ New helper to safely extract username without TS errors
  const getUserName = (user: any) => {
    if (typeof user === 'object' && user?.username) {
      return user.username;
    }
    return "User";
  }

  const currentUserId = getUserId(currentUser);
  const myStory = safeStories.find(s => getUserId(s.user) === currentUserId);
  const otherStories = safeStories.filter(s => getUserId(s.user) !== currentUserId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
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
      setSelectedFile(file)
      setIsDialogOpen(true)
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const handleUploadConfirm = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("files", selectedFile);

    try {
      await api.post("/stories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || 1;
          const current = progressEvent.loaded;
          const percentage = Math.round((current / total) * 100);
          setUploadProgress(percentage);
        },
      });

      toast.success("Story uploaded successfully!");
      setIsDialogOpen(false);
      setSelectedFile(null);

      if (onUploadSuccess) onUploadSuccess();
      else window.location.reload();

    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload story");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();

  useImperativeHandle(ref, () => ({
    triggerUpload
  }));

  return (
    <div className="glass-strong bg-background/40 p-4 rounded-3xl border border-white/5 shadow-xl overflow-hidden mb-6">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,video/*"
        onChange={handleFileChange}
      />

      <StoryUploadDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        file={selectedFile}
        onConfirm={handleUploadConfirm}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />

      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
        {/* === CURRENT USER STORY BUTTON === */}
        <motion.div
          className="relative flex flex-col items-center gap-2 shrink-0 group snap-start min-w-[80px]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="relative p-[2px] rounded-full">
            {/* Main Avatar: Triggers Viewer if story exists, else triggers upload */}
            <div
              className={cn(
                "p-0.5 rounded-full transition-all duration-500 cursor-pointer overflow-hidden",
                myStory ? "bg-gradient-to-tr from-amber-400 via-fuchsia-500 to-indigo-500 p-[2px] neon-glow" : "bg-white/5"
              )}
              onClick={() => {
                if (myStory) onStoryClick(myStory._id);
                else triggerUpload();
              }}
            >
              <div className="bg-background rounded-full p-0.5">
                <AvatarRing
                  src={getUserAvatar(currentUser)}
                  alt="Your Story"
                  size="lg"
                  hasStory={false}
                />
              </div>
            </div>

            {/* PLUS BUTTON: ALWAYS triggers upload directly */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                triggerUpload();
              }}
              className={cn(
                "absolute bottom-0 right-0 w-7 h-7 rounded-xl flex items-center justify-center border-2 border-background z-20 shadow-lg transition-all",
                myStory ? "bg-indigo-500 text-white" : "bg-primary text-primary-foreground"
              )}
              title="Upload Story"
            >
              <Plus className="w-4 h-4 font-bold" />
            </motion.button>

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-[2px] z-30">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/80">
              {isUploading ? "Uploading..." : "Your Story"}
            </span>
          </div>
        </motion.div>

        {/* Separator for clarity */}
        <div className="w-[1px] h-12 bg-white/5 shrink-0 self-center mx-2 opacity-50" />

        {/* === OTHER USERS STORIES === */}
        <AnimatePresence mode="popLayout">
          {otherStories.map((story, idx) => {
            const userName = getUserName(story.user);
            return (
              <motion.button
                key={story._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onStoryClick(story._id)}
                className="flex flex-col items-center gap-3 shrink-0 snap-start group"
              >
                <div className={cn(
                  "p-[2px] rounded-full transition-all duration-300",
                  story.isViewed ? "bg-white/5 opacity-60" : "bg-gradient-to-tr from-cyan-400 to-blue-500 neon-glow"
                )}>
                  <div className="bg-background rounded-full p-0.5">
                    <AvatarRing
                      src={getUserAvatar(story.user)}
                      alt={userName}
                      size="lg"
                      hasStory={false}
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center w-16">
                  <span className={cn(
                    "text-[9px] truncate w-full text-center font-black uppercase tracking-widest",
                    story.isViewed ? "text-muted-foreground/50" : "text-foreground"
                  )}>
                    {userName.split('.')[0]}
                  </span>
                  {!story.isViewed && (
                    <span className="flex items-center gap-1 text-[7px] text-cyan-400 font-bold uppercase mt-0.5 tracking-tighter">
                      <Sparkles className="w-1.5 h-1.5" /> NEW
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>


      </div>
    </div>
  )
})
