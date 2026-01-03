import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { AvatarRing } from "@/components/ui/avatar-ring"
import { type Story } from "@/hooks/useStories"

interface StoryViewerProps {
  isOpen: boolean
  onClose: () => void
  initialIndex: number
  stories: Story[]
  onViewStory: (id: string) => void
  onDeleteStory?: (id: string) => void
  currentUserId?: string
}

export function StoryViewer({
  isOpen,
  onClose,
  initialIndex,
  stories,
  onViewStory,
  onDeleteStory,
  currentUserId
}: StoryViewerProps) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const currentStory = stories[currentStoryIndex]

  // Reset state whenever 'isOpen' changes to true
  useEffect(() => {
    if (isOpen) {
      setCurrentStoryIndex(initialIndex)
      setProgress(0)
      setIsPaused(false)
    }
  }, [isOpen, initialIndex])

  // Safety Check: Close if story becomes invalid
  useEffect(() => {
    if (isOpen && !currentStory) {
      onClose()
    }
  }, [currentStory, isOpen, onClose])

  // Mark as viewed logic
  useEffect(() => {
    if (isOpen && currentStory && !currentStory.isViewed) {
      const timer = setTimeout(() => {
        onViewStory(currentStory._id)
      }, 500); // Increased slightly to ensure view counts as intentional
      return () => clearTimeout(timer);
    }
  }, [currentStoryIndex, isOpen, currentStory, onViewStory])

  // Navigation Handlers
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

  // Progress Bar
  useEffect(() => {
    if (!isOpen || isPaused || isDeleting || !currentStory || currentStory.type === 'video') return

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
  }, [isOpen, isPaused, isDeleting, currentStory, handleNext])

  const handleDelete = async () => {
    if (!currentStory || !onDeleteStory) return;
    if (!window.confirm("Are you sure you want to delete this story?")) return;

    setIsDeleting(true);
    setIsPaused(true);

    try {
      await onDeleteStory(currentStory._id);
      if (stories.length <= 1) onClose();
    } catch (error) {
      console.error("Delete failed", error);
      setIsDeleting(false);
      setIsPaused(false);
    }
  }

  if (!currentStory) return null

  // ✅ FIXED: Safer ID extraction logic to resolve TypeScript error
  // Checks if 'user' is an Object (populated) or String (ID only)
  const storyOwnerId = typeof currentStory.user === 'object' && '_id' in currentStory.user
    ? (currentStory.user as any)._id
    : (currentStory.user as unknown as string);

  const isOwner = currentUserId && storyOwnerId
    ? currentUserId.toString() === storyOwnerId.toString()
    : false;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
        >
          <div className="relative w-full h-full flex items-center justify-center">

            {/* Progress Bars */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-20 max-w-md mx-auto">
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
            <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-20 text-white max-w-md mx-auto">
              <div className="flex items-center gap-3">
                <AvatarRing
                  // Handle safe access for populated vs unpopulated user
                  src={(typeof currentStory.user === 'object' ? currentStory.user.profilePic : "") || "/default-avatar.png"}
                  alt={(typeof currentStory.user === 'object' ? currentStory.user.username : "User")}
                  size="sm"
                  hasStory={false}
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-sm drop-shadow-md">
                    {typeof currentStory.user === 'object' ? currentStory.user.username : "User"}
                  </span>
                  <span className="text-xs text-white/70">
                    {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Delete Button */}
                {isOwner && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-2 bg-black/20 hover:bg-red-500/80 backdrop-blur-md rounded-full transition-colors group pointer-events-auto"
                    title="Delete Story"
                  >
                    <Trash2 className="w-5 h-5 text-white/90 group-hover:text-white" />
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="p-2 bg-black/20 hover:bg-white/20 backdrop-blur-md rounded-full transition-colors pointer-events-auto"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div
              className="w-full max-w-md aspect-9/16 relative bg-gray-900 overflow-hidden rounded-none md:rounded-xl shadow-2xl"
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
            >
              {currentStory.type === 'video' ? (
                <video
                  src={currentStory.url}
                  className="w-full h-full object-contain"
                  autoPlay
                  muted
                  playsInline
                  onEnded={handleNext}
                  onTimeUpdate={(e) => {
                    // Sync video time with progress bar
                    if (!isPaused) {
                      const vid = e.currentTarget;
                      if (vid.duration) {
                        setProgress((vid.currentTime / vid.duration) * 100);
                      }
                    }
                  }}
                />
              ) : (
                <img
                  src={currentStory.url}
                  alt="Story"
                  className="w-full h-full object-contain"
                  onError={() => setIsPaused(true)}
                />
              )}
            </div>

            {/* Navigation Buttons (Desktop) */}
            <button
              onClick={handlePrev}
              className={cn(
                "hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-20 text-white",
                currentStoryIndex === 0 && "opacity-50 pointer-events-none"
              )}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <button
              onClick={handleNext}
              className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-20 text-white"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Mobile Touch Areas */}
            <div className="md:hidden absolute inset-y-0 left-0 w-1/4 z-10" onClick={handlePrev} />
            <div className="md:hidden absolute inset-y-0 right-0 w-1/4 z-10" onClick={handleNext} />

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}