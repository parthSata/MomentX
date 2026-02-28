import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, MapPin, Tag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface EditPostDialogProps {
    isOpen: boolean
    onClose: () => void
    caption: string
    // If your backend supports existing location/tags, you can add them to props here later
    onSave: (data: { caption: string; location: string; tags: string }) => void
}

export function EditPostDialog({ isOpen, onClose, caption, onSave }: EditPostDialogProps) {
    const [editCaption, setEditCaption] = useState(caption)
    const [location, setLocation] = useState("")
    const [tags, setTags] = useState("")

    // ✅ FIX: Reset the state every time the dialog opens with the new post's data
    useEffect(() => {
        if (isOpen) {
            setEditCaption(caption || "");
            setLocation(""); // Reset location to empty (or set to post.location if passed as prop)
            setTags("");     // Reset tags to empty (or set to post.tags if passed as prop)
        }
    }, [isOpen, caption]);

    const handleSave = () => {
        onSave({ caption: editCaption, location, tags })
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-lg glass-strong rounded-2xl shadow-glow overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h2 className="text-lg font-semibold font-display">Edit Post</h2>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Caption</label>
                                <Textarea
                                    value={editCaption}
                                    onChange={(e) => setEditCaption(e.target.value)}
                                    placeholder="Write a caption..."
                                    className="min-h-25 bg-muted/50 border-border"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> Location
                                </label>
                                <Input
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Add location..."
                                    className="bg-muted/50 border-border"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Tag className="w-4 h-4" /> Tags
                                </label>
                                <Input
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="Add tags (comma separated)..."
                                    className="bg-muted/50 border-border"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button variant="ghost" className="flex-1" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button variant="gradient" className="flex-1" onClick={handleSave}>
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}