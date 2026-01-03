import { useState, useEffect } from "react"
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
  onViewStory: (id: string, index: number) => void
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

  // Safety Check
  useEffect(() => {
    if (isOpen && !currentStory) {
      onClose()
    }
  }, [currentStory, isOpen, onClose])

  // Mark as viewed
  useEffect(() => {
    if (isOpen && currentStory && !currentStory.isViewed) {
      onViewStory(currentStory._id, currentStoryIndex)
    }
  }, [currentStoryIndex, isOpen, currentStory, onViewStory])

  // Progress Bar
  useEffect(() => {
    if (!isOpen || isPaused || isDeleting || !currentStory) return

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (currentStoryIndex < stories.length - 1) {
            setCurrentStoryIndex(prev => prev + 1)
            return 0
          } else {
            onClose()
            return 100
          }
        }
        return prev + 2
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isOpen, currentStoryIndex, isPaused, isDeleting, onClose, stories.length, currentStory])

  const handleDelete = async () => {
    if (!currentStory || !onDeleteStory) return;
    if (!window.confirm("Are you sure you want to delete this story?")) return;

    setIsDeleting(true);
    setIsPaused(true);

    try {
      await onDeleteStory(currentStory._id);
    } catch (error) {
      console.error("Delete failed", error);
      setIsDeleting(false);
      setIsPaused(false);
    }
  }

  const handlePrev = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1); setProgress(0);
    }
  }

  const handleNext = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1); setProgress(0);
    } else {
      onClose();
    }
  }

  if (!currentStory) return null

  // ✅ FIX: Robust comparison logic
  // 1. Get Story Owner ID safely (handle object vs string)
  const storyOwnerId = typeof currentStory.user._id === 'object'
    ? (currentStory.user._id as any).toString()
    : currentStory.user._id;

  // 2. Compare strings
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
          className="fixed inset-0 z-50 bg-black"
        >
          <div className="relative w-full h-full flex items-center justify-center">

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
                    transition={{ duration: 0.1 }}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-10 left-4 right-4 flex items-center justify-between z-20 text-white">
              <div className="flex items-center gap-3">
                <AvatarRing
                  src={currentStory.user.avatar}
                  alt={currentStory.user.displayName}
                  size="sm"
                />
                <div>
                  <span className="font-semibold text-sm drop-shadow-md">
                    {currentStory.user.username}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Delete Button */}
                {isOwner && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-2 bg-black/20 hover:bg-red-500/80 backdrop-blur-md rounded-full transition-colors group"
                    title="Delete Story"
                  >
                    <Trash2 className="w-5 h-5 text-white/90 group-hover:text-white" />
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="p-2 bg-black/20 hover:bg-white/20 backdrop-blur-md rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div
              className="w-full h-full md:max-w-md mx-auto flex items-center justify-center bg-gray-900"
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

            {/* Navigation */}
            <button
              onClick={handlePrev}
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-20 text-white",
                currentStoryIndex === 0 && "opacity-50 pointer-events-none"
              )}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-20 text-white"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}