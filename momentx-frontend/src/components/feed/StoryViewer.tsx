import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight, Heart, Send, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { stories } from "@/data/mockData"
import { AvatarRing } from "@/components/ui/avatar-ring"

interface StoryViewerProps {
  isOpen: boolean
  onClose: () => void
  initialIndex: number
}

export function StoryViewer({ isOpen, onClose, initialIndex }: StoryViewerProps) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const currentStory = stories[currentStoryIndex]

  useEffect(() => {
    setCurrentStoryIndex(initialIndex)
    setProgress(0)
  }, [initialIndex])

  useEffect(() => {
    if (!isOpen || isPaused) return

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
  }, [isOpen, currentStoryIndex, isPaused, onClose])

  const handlePrev = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1)
      setProgress(0)
    }
  }

  const handleNext = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1)
      setProgress(0)
    } else {
      onClose()
    }
  }

  if (!currentStory) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background"
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Progress bars */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
              {stories.map((_, index) => (
                <div
                  key={index}
                  className="h-1 flex-1 rounded-full bg-foreground/20 overflow-hidden"
                >
                  <motion.div
                    className="h-full bg-foreground"
                    initial={{ width: 0 }}
                    animate={{
                      width:
                        index < currentStoryIndex
                          ? "100%"
                          : index === currentStoryIndex
                          ? `${progress}%`
                          : "0%",
                    }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-10 left-4 right-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <AvatarRing
                  src={currentStory.user.avatar}
                  alt={currentStory.user.displayName}
                  size="sm"
                />
                <div>
                  <span className="font-semibold">{currentStory.user.username}</span>
                  <span className="text-xs text-muted-foreground ml-2">2h</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-foreground/10 rounded-full transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-foreground/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Story Content */}
            <motion.div
              key={currentStoryIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full h-full max-w-lg mx-auto"
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
            >
              <img
                src={currentStory.user.avatar}
                alt="Story"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Navigation */}
            <button
              onClick={handlePrev}
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-foreground/10 hover:bg-foreground/20 transition-colors",
                currentStoryIndex === 0 && "opacity-50 pointer-events-none"
              )}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-foreground/10 hover:bg-foreground/20 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Footer */}
            <div className="absolute bottom-8 left-4 right-4 flex items-center gap-4">
              <input
                type="text"
                placeholder="Send a message..."
                className="flex-1 h-12 px-4 rounded-full bg-foreground/10 border border-foreground/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
              <button className="p-3 hover:bg-foreground/10 rounded-full transition-colors">
                <Heart className="w-6 h-6" />
              </button>
              <button className="p-3 hover:bg-foreground/10 rounded-full transition-colors">
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
