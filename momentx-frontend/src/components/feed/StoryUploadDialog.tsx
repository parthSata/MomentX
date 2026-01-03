import { motion, AnimatePresence } from "framer-motion"
import { X, Upload, Loader2, Image as ImageIcon, Film } from "lucide-react"
import { useEffect, useState } from "react"

interface StoryUploadDialogProps {
    isOpen: boolean
    onClose: () => void
    file: File | null
    onConfirm: () => void
    isUploading: boolean
}

export function StoryUploadDialog({
    isOpen,
    onClose,
    file,
    onConfirm,
    isUploading
}: StoryUploadDialogProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
            return () => URL.revokeObjectURL(url)
        }
        setPreviewUrl(null)
    }, [file])

    if (!isOpen || !file) return null

    const isVideo = file.type.startsWith("video")

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                {/* Dialog Container */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    // ✅ FIX: "flex flex-col" and "max-h-[85vh]" limits the total height
                    className="relative w-full max-w-md max-h-[85vh] flex flex-col bg-[#0F0F0F] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
                >
                    {/* Header (z-20 to stay on top) */}
                    <div className="flex items-center justify-between p-4 bg-[#0F0F0F] border-b border-white/5 z-20 shrink-0">
                        <h3 className="text-white font-semibold">New Story</h3>
                        <button
                            onClick={!isUploading ? onClose : undefined}
                            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Preview Area */}
                    {/* ✅ FIX: "overflow-hidden" ensures the video doesn't push the footer out */}
                    {/* ✅ FIX: Removed "p-4" so the video has more room */}
                    <div className="relative flex-1 min-h-0 bg-black flex items-center justify-center overflow-hidden">
                        {previewUrl && (
                            isVideo ? (
                                <video
                                    src={previewUrl}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    // ✅ FIX: object-contain ensures the whole video is visible
                                    className="max-w-full max-h-full object-contain"
                                />
                            ) : (
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="max-w-full max-h-full object-contain"
                                />
                            )
                        )}

                        {/* File Info Overlay */}
                        <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-3 pointer-events-none">
                            <div className="p-2 rounded-full bg-indigo-500/20 text-indigo-400">
                                {isVideo ? <Film className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-xs font-medium text-white truncate">{file.name}</p>
                                <p className="text-[10px] text-white/60">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions (z-20 to stay on top) */}
                    <div className="p-4 bg-[#0F0F0F] border-t border-white/5 shrink-0 z-20">
                        <button
                            onClick={onConfirm}
                            disabled={isUploading}
                            className="w-full py-3 rounded-xl bg-linear-to-r from-indigo-500 to-pink-500 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    Share to Story
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}