import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight, Trash2, Eye, Heart, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { AvatarRing } from "@/components/ui/avatar-ring"
import { type Story } from "@/hooks/useStories"
import { formatDistanceToNowStrict } from "date-fns"

interface StoryViewerProps {
  isOpen: boolean
  onClose: () => void
  initialIndex: number
  stories: Story[]
  onViewStory: (id: string) => void
  onDeleteStory?: (id: string) => void
  onLikeStory?: (id: string) => void
  onReplyStory?: (id: string, message: string) => Promise<void>
  currentUserId?: string
}

export function StoryViewer({
  isOpen,
  onClose,
  initialIndex,
  stories,
  onViewStory,
  onDeleteStory,
  onLikeStory,
  onReplyStory,
  currentUserId
}: StoryViewerProps) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isViewersOpen, setIsViewersOpen] = useState(false)

  // Interaction State
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)

  const currentStory = stories[currentStoryIndex]

  // Reset state on open or slide change
  useEffect(() => {
    if (isOpen) {
      setProgress(0)
      setIsPaused(false)
      setIsViewersOpen(false)
      setMessage("")
      setIsInputFocused(false)

      // Reset Like state based on story data
      // Check if the current user's ID exists in the likes array
      // Using 'any' cast to handle potential TS mismatch if type isn't updated yet
      if (currentStory && (currentStory as any).likes && currentUserId) {
        setIsLiked((currentStory as any).likes.includes(currentUserId));
      } else {
        setIsLiked(false);
      }
    }
  }, [isOpen, currentStoryIndex, currentStory, currentUserId])

  // Sync index when initialIndex changes
  useEffect(() => {
    setCurrentStoryIndex(initialIndex);
  }, [initialIndex]);

  // Safety check & Close timeout
  useEffect(() => {
    if (isOpen && !currentStory) {
      const timer = setTimeout(() => onClose(), 0);
      return () => clearTimeout(timer);
    }
  }, [currentStory, isOpen, onClose])

  // Mark as Viewed logic
  useEffect(() => {
    if (isOpen && currentStory && !currentStory.isViewed) {
      const timer = setTimeout(() => {
        onViewStory(currentStory._id)
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentStoryIndex, isOpen, currentStory, onViewStory])

  // Handlers
  const handlePrev = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    }
  }, [currentStoryIndex]);

  const handleNext = useCallback(() => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentStoryIndex, stories.length, onClose]);

  // Pause Logic: Stop if input is focused or menu is open
  const isActuallyPaused = isPaused || isViewersOpen || isDeleting || isInputFocused;

  // Progress Bar
  useEffect(() => {
    if (!isOpen || isActuallyPaused || !currentStory || currentStory.type === 'video') return

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 2
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isOpen, isActuallyPaused, currentStory, handleNext])

  const handleDelete = async () => {
    if (!currentStory || !onDeleteStory) return;
    if (!window.confirm("Are you sure you want to delete this story?")) return;

    setIsDeleting(true);
    try {
      await onDeleteStory(currentStory._id);
      if (stories.length <= 1) onClose();
    } catch (error) {
      console.error("Delete failed", error);
      setIsDeleting(false);
    }
  }

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    if (onLikeStory && currentStory) {
      onLikeStory(currentStory._id);
    }
  };

  // ✅ MESSAGE HANDLER
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!message.trim() || !onReplyStory || !currentStory) return;

    setIsSending(true);
    try {
      // Call the function passed from parent (which calls useStories -> replyStory)
      await onReplyStory(currentStory._id, message);
      setMessage("");
      setIsInputFocused(false); // Resume story
    } catch (error) {
      console.error("Failed to send reply", error);
    } finally {
      setIsSending(false);
    }
  };

  if (!currentStory) return null

  // User & Logic Helpers
  const storyUser = typeof currentStory.user === 'object' ? currentStory.user : null;
  const storyOwnerId = storyUser ? (storyUser._id as any).toString() : (currentStory.user as unknown as string);
  const isOwner = currentUserId && storyOwnerId ? currentUserId.toString() === storyOwnerId.toString() : false;
  const viewersList = Array.isArray(currentStory.viewers) ? currentStory.viewers : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-2000 bg-black/95 backdrop-blur-sm flex items-center justify-center"
        >
          <div className="relative w-full h-full max-w-md mx-auto flex flex-col justify-center">

            {/* Progress Bars */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
              {stories.map((_, index) => (
                <div key={index} className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden">
                  <motion.div
                    className="h-full bg-white"
                    initial={{ width: 0 }}
                    animate={{
                      width: index < currentStoryIndex ? "100%" : index === currentStoryIndex ? `${progress}%` : "0%",
                    }}
                    transition={{ duration: 0.1, ease: "linear" }}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-20 text-white">
              <div className="flex items-center gap-3">
                <AvatarRing
                  src={(storyUser?.avatar || storyUser?.profilePic) || "/default-avatar.png"}
                  alt={storyUser?.username || "User"}
                  size="sm"
                  hasStory={false}
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-sm drop-shadow-md text-white">
                    {storyUser?.username || "User"}
                  </span>
                  <span className="text-xs text-white/80">
                    {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {isOwner && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-2 bg-black/20 hover:bg-red-500/80 backdrop-blur-md rounded-full transition-colors pointer-events-auto"
                  >
                    <Trash2 className="w-5 h-5 text-white/90" />
                  </button>
                )}
                <button onClick={onClose} className="p-2 bg-black/20 hover:bg-white/20 backdrop-blur-md rounded-full transition-colors pointer-events-auto">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Story Content */}
            <div
              className="w-full aspect-9/16 relative bg-[#1a1a1a] overflow-hidden rounded-none md:rounded-xl shadow-2xl"
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => !isViewersOpen && !isInputFocused && setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => !isViewersOpen && !isInputFocused && setIsPaused(false)}
            >
              {currentStory.type === 'video' ? (
                <video
                  src={currentStory.url}
                  className="w-full h-full object-contain bg-black"
                  autoPlay={!isActuallyPaused}
                  muted
                  playsInline
                  onEnded={handleNext}
                  onTimeUpdate={(e) => {
                    if (!isActuallyPaused) {
                      const vid = e.currentTarget;
                      if (vid.duration) setProgress((vid.currentTime / vid.duration) * 100);
                    }
                  }}
                />
              ) : (
                <img
                  src={currentStory.url}
                  alt="Story"
                  className="w-full h-full object-contain bg-black"
                  onError={() => setIsPaused(true)}
                />
              )}

              {/* Interaction Layer */}
              <div className="absolute bottom-0 left-0 right-0 p-4 z-30 bg-linear-to-t from-black/80 to-transparent pt-20">
                {isOwner ? (
                  // OWNER: Viewers Button
                  !isViewersOpen && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsViewersOpen(true);
                        setIsPaused(true);
                      }}
                      className="mx-auto flex flex-col items-center gap-1 group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 group-hover:bg-white/20 transition-all">
                        <Eye className="w-4 h-4 text-white" />
                        <span className="text-sm font-bold text-white">{viewersList.length}</span>
                      </div>
                      <span className="text-[10px] text-white/80 uppercase tracking-wider font-bold">Viewers</span>
                    </button>
                  )
                ) : (
                  // VIEWER: Message Input & Like
                  <div className="flex items-center gap-3">
                    <form
                      onSubmit={handleSendMessage}
                      className="flex-1 relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        placeholder="Send message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onFocus={() => {
                          setIsInputFocused(true);
                          setIsPaused(true);
                        }}
                        onBlur={() => {
                          setIsInputFocused(false);
                          setIsPaused(false);
                        }}
                        className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all pr-10"
                      />
                      {message.trim() && (
                        <button
                          type="submit"
                          disabled={isSending}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/20 rounded-full transition-colors"
                        >
                          <Send className="w-4 h-4 text-white" />
                        </button>
                      )}
                    </form>

                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      onClick={handleLike}
                      className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors"
                    >
                      <Heart
                        className={cn("w-6 h-6 transition-all", isLiked ? "fill-red-500 text-red-500" : "text-white")}
                      />
                    </motion.button>
                  </div>
                )}
              </div>
            </div>

            {/* Nav Arrows */}
            <button
              onClick={handlePrev}
              className={cn(
                "hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-20 text-white backdrop-blur-sm",
                currentStoryIndex === 0 && "opacity-50 pointer-events-none"
              )}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <button
              onClick={handleNext}
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-20 text-white backdrop-blur-sm"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Mobile Touch Areas (Disabled when typing) */}
            {!isInputFocused && (
              <>
                <div className="md:hidden absolute inset-y-0 left-0 w-1/3 z-10" onClick={handlePrev} />
                <div className="md:hidden absolute inset-y-0 right-0 w-1/3 z-10" onClick={handleNext} />
              </>
            )}

            {/* Viewers Sheet */}
            <AnimatePresence>
              {isViewersOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm"
                    onClick={() => {
                      setIsViewersOpen(false);
                      setIsPaused(false);
                    }}
                  />
                  <motion.div
                    initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="absolute bottom-0 w-full bg-[#121212] rounded-t-3xl z-50 border-t border-white/10 flex flex-col max-h-[60vh] shadow-2xl"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-white font-semibold text-lg">{viewersList.length} Viewers</h3>
                      </div>
                      <button
                        onClick={() => {
                          setIsViewersOpen(false);
                          setIsPaused(false);
                        }}
                        className="p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <X className="w-6 h-6 text-white/70 hover:text-white" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {viewersList.length === 0 ? (
                        <div className="text-center text-white/40 py-12 flex flex-col items-center gap-2">
                          <Eye className="w-8 h-8 opacity-20" />
                          <p>No views yet</p>
                        </div>
                      ) : (
                        viewersList.map((viewer: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                              <AvatarRing
                                src={viewer.user?.avatar || viewer.user?.profilePic}
                                size="sm"
                                alt={viewer.user?.username}
                                hasStory={false}
                              />
                              <div className="flex flex-col">
                                <span className="text-white text-sm font-medium">{viewer.user?.username || "Unknown User"}</span>
                                <span className="text-white/50 text-xs">{viewer.user?.displayName}</span>
                              </div>
                            </div>
                            <span className="text-white/30 text-[10px] font-medium">
                              {viewer.viewedAt ? formatDistanceToNowStrict(new Date(viewer.viewedAt), { addSuffix: true }) : ""}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}