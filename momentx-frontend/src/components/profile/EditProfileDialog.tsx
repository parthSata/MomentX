import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext"; // Import useAuth

interface EditProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    displayName: string;
    username: string;
    bio: string;
    website: string;
    avatar: string;
  };
  onProfileUpdate: () => void;
}

export function EditProfileDialog({ isOpen, onClose, user, onProfileUpdate }: EditProfileDialogProps) {
  const { refreshUser } = useAuth(); // ✅ Get refreshUser
  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio);
  const [website, setWebsite] = useState(user.website);
  const [isLoading, setIsLoading] = useState(false);

  const [previewImage, setPreviewImage] = useState(user.avatar);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ... (useEffect for resetting state remains the same) ...
  useEffect(() => {
    if (isOpen) {
      setDisplayName(user.displayName || "");
      setUsername(user.username || "");
      setBio(user.bio || "");
      setWebsite(user.website || "");
      setPreviewImage(user.avatar || "");
      setSelectedFile(null);
    }
  }, [isOpen, user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      toast.error("Username is required");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", displayName);
      formData.append("username", username);
      formData.append("bio", bio);
      formData.append("website", website);

      if (selectedFile) {
        formData.append("profilePic", selectedFile);
      }

      await api.put("/users/update-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // ✅ 1. Update Global Auth State (Navbar avatar, etc.)
      await refreshUser();

      // ✅ 2. Update Profile Page State (Posts, Bio text, etc.)
      onProfileUpdate();

      toast.success("Profile updated successfully!");
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[110]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed z-[111] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-24px)] max-w-2xl max-h-[calc(100vh-48px)] flex flex-col"
          >
            <div className="glass-strong rounded-[2rem] overflow-hidden flex flex-col shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10 bg-background/90">
              {/* Header */}
              <div className="flex items-center justify-between p-7 border-b border-white/5 bg-card/30 shrink-0">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight">Identity Configuration</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Modify your MomentX Presence</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors border border-white/5"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </motion.button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-6">
                    <div className="relative group/avatar">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-linear-to-tr from-amber-400 via-orange-500 to-emerald-500 p-[3px] shadow-2xl shadow-amber-500/20"
                        >
                            <div className="w-full h-full rounded-full border-4 border-background overflow-hidden bg-muted">
                                <img
                                    src={previewImage || "/image.png"}
                                    alt={displayName}
                                    className="w-full h-full object-cover transition-transform group-hover/avatar:scale-110 duration-500"
                                />
                                <div 
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Camera className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        </motion.div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                        />

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-1 right-1 p-3 bg-background border border-white/10 rounded-2xl shadow-xl text-primary"
                        >
                            <Camera className="w-4 h-4" />
                        </motion.button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Displayed Identity</label>
                    <Input
                      variant="glass"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter name..."
                      maxLength={30}
                      className="h-14 text-base font-bold bg-white/5 border-white/5 focus:border-primary/50 rounded-2xl px-5"
                    />
                    <div className="flex justify-end pr-2">
                        <span className="text-[8px] font-black text-muted-foreground/50">{displayName.length}/30</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">System Handle</label>
                    <div className="relative group/input">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/50 font-black text-lg group-focus-within/input:text-primary transition-colors">@</span>
                      <Input
                        variant="glass"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                        placeholder="handle"
                        className="pl-11 h-14 text-base font-bold bg-white/5 border-white/5 focus:border-primary/50 rounded-2xl"
                        maxLength={20}
                      />
                    </div>
                    <div className="flex justify-end pr-2">
                        <span className="text-[8px] font-black text-muted-foreground/50">{username.length}/20</span>
                    </div>
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Professional Abstract</label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Synchronize your story..."
                      className="min-h-32 glass-strong bg-white/5 border-white/5 focus:border-primary/50 rounded-2xl p-5 text-base font-medium resize-none"
                      maxLength={150}
                    />
                    <div className="flex justify-end pr-2">
                        <span className="text-[8px] font-black text-muted-foreground/50">{bio.length}/150</span>
                    </div>
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Digital Domain</label>
                    <Input
                      variant="glass"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://example.com"
                      className="h-14 text-base font-bold bg-white/5 border-white/5 focus:border-primary/50 rounded-2xl px-5"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-7 border-t border-white/5 flex gap-4 bg-card/20 shrink-0">
                <Button 
                    variant="glass" 
                    onClick={onClose} 
                    className="flex-1 h-14 text-xs font-black uppercase tracking-[0.2em] rounded-2xl border-white/5 hover:bg-white/10" 
                    disabled={isLoading}
                >
                    Discard Changes
                </Button>
                <Button 
                    variant="gradient" 
                    onClick={handleSave} 
                    className="flex-1 h-14 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/10" 
                    disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authorize & Save"}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}