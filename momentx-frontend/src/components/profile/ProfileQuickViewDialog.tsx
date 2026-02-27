import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ProfileImageViewDialogProps {
    imageUrl: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ProfileImageViewDialog({ imageUrl, isOpen, onClose }: ProfileImageViewDialogProps) {
    if (!imageUrl) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 h-full z-100 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={onClose}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white z-50 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Profile Image (Large Circle) */}
                    <motion.img
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        src={imageUrl}
                        alt="Profile View"
                        className="w-64 h-64 md:w-96 md:h-96 rounded-full object-cover shadow-2xl border-4 border-white/10"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}