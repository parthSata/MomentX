// src/components/post/ReportDialog.tsx
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ChevronRight, AlertTriangle, ShieldAlert, Ban, Eye, MessageSquareOff, UserX, Copyright, HelpCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/lib/axios" // ✅ Added api import

// ✅ Added targetId and targetType to props
interface ReportDialogProps {
    isOpen: boolean
    onClose: () => void
    targetId: string
    targetType: "post" | "comment" | "user"
}

const reportCategories = [
    { id: "spam", label: "It's spam", icon: Ban, description: "Misleading or repetitive content" },
    { id: "nudity", label: "Nudity or sexual activity", icon: ShieldAlert, description: "Inappropriate sexual content" },
    { id: "hate", label: "Hate speech or symbols", icon: AlertTriangle, description: "Hateful or discriminatory content" },
    { id: "violence", label: "Violence or dangerous organizations", icon: ShieldAlert, description: "Threats, violence, or harmful groups" },
    { id: "harassment", label: "Bullying or harassment", icon: UserX, description: "Targeting individuals with abuse" }, // ✅ Changed id to 'harassment' to match schema
    { id: "misinformation", label: "False information", icon: Eye, description: "Misleading claims or misinformation" }, // ✅ Changed id to 'misinformation' to match schema
    { id: "other", label: "Scam or fraud", icon: Ban, description: "Deceptive schemes to steal information" }, // Schema doesn't have scam, mapped to other
    { id: "other", label: "Intellectual property violation", icon: Copyright, description: "Unauthorized use of copyrighted material" },
    { id: "other", label: "Suicide or self-injury", icon: AlertTriangle, description: "Content promoting self-harm" },
    { id: "other", label: "Sale of illegal or regulated goods", icon: ShieldAlert, description: "Selling drugs, weapons, or other illegal items" },
    { id: "other", label: "I just don't like it", icon: MessageSquareOff, description: "Not relevant to your interests" },
    { id: "other", label: "Something else", icon: HelpCircle, description: "Other issues not listed above" },
]

export function ReportDialog({ isOpen, onClose, targetId, targetType }: ReportDialogProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [step, setStep] = useState<"categories" | "confirm">("categories")
    const [isSubmitting, setIsSubmitting] = useState(false) // ✅ Added loading state

    const handleClose = () => {
        if (isSubmitting) return; // Prevent closing while submitting
        setSelectedCategory(null)
        setStep("categories")
        onClose()
    }

    const handleSelectCategory = (id: string) => {
        setSelectedCategory(id)
        setStep("confirm")
    }

    // ✅ Dynamic Submit Function
    const handleSubmitReport = async () => {
        if (!selectedCategory) return;

        setIsSubmitting(true);
        try {
            await api.post("/reports/create", {
                targetId,
                targetType,
                reason: selectedCategory,
                description: `User selected category: ${reportCategories.find(c => c.id === selectedCategory)?.label}`
            });

            toast.success("Thank you for reporting. We'll review this content shortly.")
            handleClose()
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to submit report. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const selectedInfo = reportCategories.find(c => c.id === selectedCategory)

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-60 w-[92%] max-w-md glass-strong bg-background border border-border/50 rounded-2xl overflow-hidden shadow-2xl max-h-[80vh] flex flex-col"
                    >
                        <div className="flex items-center gap-3 p-4 border-b border-border/50">
                            {step === "confirm" && !isSubmitting ? (
                                <button
                                    onClick={() => setStep("categories")}
                                    className="p-1 rounded-full hover:bg-muted/50 transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                            ) : null}
                            <h3 className="text-lg font-semibold font-display flex-1">
                                {step === "categories" ? "Report" : "Submit Report"}
                            </h3>
                            <button
                                onClick={handleClose}
                                disabled={isSubmitting}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            {step === "categories" ? (
                                <motion.div
                                    key="categories"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <p className="px-4 pt-3 pb-2 text-sm text-muted-foreground">
                                        Why are you reporting this {targetType}?
                                    </p>
                                    <ScrollArea className="max-h-[55vh]">
                                        <div className="divide-y divide-border/50">
                                            {reportCategories.map((category, index) => {
                                                const Icon = category.icon
                                                return (
                                                    <button
                                                        key={`${category.id}-${index}`}
                                                        onClick={() => handleSelectCategory(category.id)}
                                                        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors text-left"
                                                    >
                                                        <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-sm font-medium block">{category.label}</span>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </ScrollArea>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="confirm"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.2 }}
                                    className="p-5 space-y-5"
                                >
                                    {selectedInfo && (
                                        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30">
                                            <selectedInfo.icon className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-sm">{selectedInfo.label}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{selectedInfo.description}</p>
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-sm text-muted-foreground">
                                        Your report is anonymous. If someone is in immediate danger, call local emergency services.
                                    </p>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleClose}
                                            disabled={isSubmitting}
                                            className="flex-1 py-3 rounded-xl font-medium text-sm bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmitReport}
                                            disabled={isSubmitting}
                                            className="flex-1 py-3 rounded-xl font-medium text-sm bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Submit Report
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}