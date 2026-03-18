import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ReportDialog } from "./ReportDialog"

interface FeedPostOptionsDialogProps {
    isOpen: boolean
    onClose: () => void
    postId: string
    isOwnPost: boolean
    onDelete: () => void // Ensure this function handles the api.delete call
    onEdit?: () => void
}

export function FeedPostOptionsDialog({ isOpen, onClose, postId, isOwnPost, onDelete, onEdit }: FeedPostOptionsDialogProps) {
    const [isReportOpen, setIsReportOpen] = useState(false)

    const handleCopyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/p/${postId}`)
        toast.success("Link copied to clipboard!")
        onClose()
    }

    const handleReport = () => {
        setIsReportOpen(true)
    }

    const handleNotInterested = () => {
        toast.success("We'll show you less content like this.")
        onClose()
    }

    // Fixed Action Handlers
    const handleDeleteClick = () => {
        // Trigger the delete function passed from parent
        onDelete();
        // Close this dialog
        onClose();
    }

    const options = isOwnPost
        ? [
            ...(onEdit ? [{ label: "Edit", action: () => { onEdit(); onClose(); } }] : []),
            { label: "Delete", action: handleDeleteClick, destructive: true },
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
        <>
            <AnimatePresence>
                {isOpen && !isReportOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative z-50 w-[90%] max-w-sm glass-strong bg-background/95 border border-border/50 rounded-2xl overflow-hidden shadow-2xl"
                        >
                            <div className="flex flex-col divide-y divide-border/50">
                                {options.map((option) => (
                                    <button
                                        type="button"
                                        key={option.label}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            option.action();
                                        }}
                                        className={cn(
                                            "w-full py-4 text-center text-sm font-medium transition-colors hover:bg-muted/50 active:bg-muted",
                                            option.destructive && "text-red-500 font-bold",
                                            option.label === "Cancel" && "text-foreground"
                                        )}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ReportDialog
                isOpen={isReportOpen}
                onClose={() => {
                    setIsReportOpen(false)
                    onClose()
                }}
                targetId={postId}
                targetType="post"
            />
        </>
    )
}