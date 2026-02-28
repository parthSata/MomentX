import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface FeedPostOptionsDialogProps {
    isOpen: boolean
    onClose: () => void
    postId: string
    isOwnPost: boolean
    onDelete: () => void
    onEdit?: () => void // ✅ Added onEdit
}

export function FeedPostOptionsDialog({
    isOpen,
    onClose,
    postId,
    isOwnPost,
    onDelete,
    onEdit
}: FeedPostOptionsDialogProps) {

    const handleCopyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/p/${postId}`)
        toast.success("Link copied to clipboard!")
        onClose()
    }

    const handleReport = () => {
        toast.success("Post reported. We'll review it shortly.")
        onClose()
    }

    const handleNotInterested = () => {
        toast.success("We'll show you less content like this.")
        onClose()
    }

    // ✅ Added "Edit" option for the post owner
    const options = isOwnPost
        ? [
            { label: "Edit", action: () => { if (onEdit) onEdit(); onClose(); } },
            { label: "Delete", action: () => { onDelete(); onClose(); }, destructive: true },
            { label: "Copy link", action: handleCopyLink },
            { label: "Cancel", action: onClose },
        ]
        : [
            { label: "Report", action: handleReport, destructive: true },
            { label: "Not interested", action: handleNotInterested },
            { label: "Copy link", action: handleCopyLink },
            { label: "Cancel", action: onClose },
        ]

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-sm glass-strong bg-background/95 border border-border/50 rounded-2xl overflow-hidden shadow-2xl"
                    >
                        <div className="divide-y divide-border/50">
                            {options.map((option) => (
                                <button
                                    key={option.label}
                                    onClick={option.action}
                                    className={cn(
                                        "w-full py-4 text-center text-sm font-medium transition-colors hover:bg-muted/50",
                                        option.destructive && "text-red-500 font-semibold",
                                        option.label === "Cancel" && "text-muted-foreground"
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}