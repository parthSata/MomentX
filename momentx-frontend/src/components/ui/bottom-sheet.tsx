import * as React from "react"
import { motion, AnimatePresence, useDragControls } from "framer-motion"
import { cn } from "@/lib/utils"

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function BottomSheet({ isOpen, onClose, children, className }: BottomSheetProps) {
  const dragControls = useDragControls()

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) {
                onClose()
              }
            }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "glass-strong rounded-t-3xl shadow-glow",
              "max-h-[90vh] overflow-hidden",
              className
            )}
          >
            <div
              className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-3rem)] pb-safe">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
