import { useState } from "react"
import { createPortal } from "react-dom"
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

    return createPortal(
        <>
            <AnimatePresence mode="wait">
                {isOpen && !isReportOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-background/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative z-50 w-full max-w-[320px] glass-strong bg-background/95 border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]"
                        >
                            <div className="flex flex-col py-4">
                                {options.map((option, idx) => (
                                    <motion.button
                                        type="button"
                                        key={option.label}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            option.action();
                                        }}
                                        className={cn(
                                            "w-full py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] transition-all relative group/btn",
                                            option.destructive 
                                                ? "text-red-500 hover:bg-red-500/10" 
                                                : "text-muted-foreground hover:text-primary hover:bg-primary/5",
                                            option.label === "Cancel" && "text-muted-foreground pt-6 border-t border-white/5 mt-2"
                                        )}
                                    >
                                        <span className="relative z-10">{option.label}</span>
                                        {option.label !== "Cancel" && (
                                            <div className="absolute inset-x-4 inset-y-1.5 rounded-xl bg-current opacity-0 group-hover/btn:opacity-5 transition-opacity" />
                                        )}
                                    </motion.button>
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
        </>,
        document.body
    )
}