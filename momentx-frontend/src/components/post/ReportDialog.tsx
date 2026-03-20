// src/components/post/ReportDialog.tsx
import { useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowLeft, ChevronRight, AlertTriangle, ShieldAlert, Ban, Eye, MessageSquareOff, UserX, Copyright, HelpCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/axios"

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
    { id: "harassment", label: "Bullying or harassment", icon: UserX, description: "Targeting individuals with abuse" },
    { id: "misinformation", label: "False information", icon: Eye, description: "Misleading claims or misinformation" },
    { id: "other", label: "Scam or fraud", icon: Ban, description: "Deceptive schemes to steal information" },
    { id: "other", label: "Intellectual property violation", icon: Copyright, description: "Unauthorized use of copyrighted material" },
    { id: "other", label: "Suicide or self-injury", icon: AlertTriangle, description: "Content promoting self-harm" },
    { id: "other", label: "Sale of illegal or regulated goods", icon: ShieldAlert, description: "Selling drugs, weapons, or other illegal items" },
    { id: "other", label: "I just don't like it", icon: MessageSquareOff, description: "Not relevant to your interests" },
    { id: "other", label: "Something else", icon: HelpCircle, description: "Other issues not listed above" },
]

export function ReportDialog({ isOpen, onClose, targetId, targetType }: ReportDialogProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [step, setStep] = useState<"categories" | "confirm">("categories")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleClose = () => {
        if (isSubmitting) return;
        setSelectedCategory(null)
        setStep("categories")
        onClose()
    }

    const handleSelectCategory = (id: string) => {
        setSelectedCategory(id)
        setStep("confirm")
    }

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

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md glass-strong bg-background/95 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-[141]"
                    >
                        {/* Header */}
                        <div className="px-8 py-6 flex items-center justify-between border-b border-white/5 bg-card/10">
                            {step === "confirm" && !isSubmitting ? (
                                <button
                                    onClick={() => setStep("categories")}
                                    className="p-2 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10 group"
                                >
                                    <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
                                </button>
                            ) : (
                                <div className="w-10" />
                            )}
                            <h2 className="text-xl font-black tracking-tighter uppercase italic text-center flex-1">
                                Flag <span className="gradient-text">Protocol</span>
                            </h2>
                            <button
                                onClick={handleClose}
                                disabled={isSubmitting}
                                className="p-2 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10 group disabled:opacity-50"
                            >
                                <X className="w-6 h-6 text-muted-foreground group-hover:text-white transition-colors" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <AnimatePresence mode="wait">
                                {step === "categories" ? (
                                    <motion.div
                                        key="categories"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="p-6 space-y-4"
                                    >
                                        <div className="px-2">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">SELECT VIOLATION TYPE</p>
                                            <p className="text-xs font-bold text-muted-foreground mt-1">Why are you reporting this {targetType}?</p>
                                        </div>

                                        <div className="space-y-2">
                                            {reportCategories.map((category, index) => {
                                                const Icon = category.icon
                                                return (
                                                    <button
                                                        key={`${category.id}-${index}`}
                                                        onClick={() => handleSelectCategory(category.id)}
                                                        className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-all group border border-transparent hover:border-white/5"
                                                    >
                                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 text-left">
                                                            <span className="text-sm font-bold block">{category.label}</span>
                                                            <span className="text-[10px] text-muted-foreground/60 font-medium line-clamp-1">{category.description}</span>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-all group-hover:translate-x-1" />
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="confirm"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.2 }}
                                        className="p-8 space-y-8"
                                    >
                                        {selectedInfo && (
                                            <div className="space-y-6">
                                                <div className="flex flex-col items-center text-center gap-4">
                                                    <div className="w-20 h-20 rounded-[2rem] bg-red-500/10 flex items-center justify-center text-red-500 shadow-2xl shadow-red-500/5">
                                                        <selectedInfo.icon className="w-10 h-10" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xl font-black uppercase italic tracking-tighter">{selectedInfo.label}</p>
                                                        <p className="text-sm font-bold text-muted-foreground mt-2 max-w-[250px] mx-auto">{selectedInfo.description}</p>
                                                    </div>
                                                </div>

                                                <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-3">
                                                    <div className="flex items-center gap-3 text-red-400">
                                                        <ShieldAlert className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Confidentiality Protocol</span>
                                                    </div>
                                                    <p className="text-[11px] font-bold text-muted-foreground leading-relaxed">
                                                        Your report is anonymous. Our automated systems will prioritize this frequency for human review. If someone is in immediate danger, deploy emergency services.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setStep("categories")}
                                                disabled={isSubmitting}
                                                className="flex-1 py-4 px-6 rounded-2xl border border-white/10 hover:bg-white/5 font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-50"
                                            >
                                                Back
                                            </button>
                                            <button
                                                onClick={handleSubmitReport}
                                                disabled={isSubmitting}
                                                className="flex-[2] py-4 px-6 rounded-2xl bg-red-500 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Initiate Takedown"}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}