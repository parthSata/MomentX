import { useState, useEffect, useRef } from "react";
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
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-16px)] sm:w-[calc(100%-32px)] max-w-125 md:max-w-150 lg:max-w-175 xl:max-w-200 max-h-[calc(100vh-32px)] sm:max-h-[calc(100vh-64px)]"
          >
            <div className="h-auto max-h-[calc(100vh-32px)] sm:max-h-[calc(100vh-64px)] glass-strong rounded-2xl overflow-hidden flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-border shrink-0">
                <h2 className="text-xl md:text-2xl font-display font-bold">Edit Profile</h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 md:p-3 glass rounded-full"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">
                <div className="flex justify-center">
                  <div className="relative group">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full bg-linear-to-r from-neon-indigo via-neon-violet to-neon-pink p-1">
                      <div className="w-full h-full rounded-full bg-background p-1">
                        <img
                          src={previewImage || "/default-avatar.png"}
                          alt={displayName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    </div>

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
                      className="absolute bottom-0 right-0 p-2 sm:p-3 md:p-4 bg-gradient-primary rounded-full shadow-lg"
                    >
                      <Camera className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </motion.button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-sm md:text-base font-medium text-muted-foreground">Display Name</label>
                    <Input
                      variant="glass"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your display name"
                      maxLength={30}
                      className="h-11 md:h-12 text-base"
                    />
                    <p className="text-xs text-muted-foreground text-right">{displayName.length}/30</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm md:text-base font-medium text-muted-foreground">Username</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                      <Input
                        variant="glass"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                        placeholder="username"
                        className="pl-10 h-11 md:h-12 text-base"
                        maxLength={20}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">{username.length}/20</p>
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <label className="text-sm md:text-base font-medium text-muted-foreground">Bio</label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="min-h-25 md:min-h-30 glass-strong border-border/50 focus:border-primary/50 resize-none text-base"
                      maxLength={150}
                    />
                    <p className="text-xs text-muted-foreground text-right">{bio.length}/150</p>
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <label className="text-sm md:text-base font-medium text-muted-foreground">Website</label>
                    <Input
                      variant="glass"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="yourwebsite.com"
                      className="h-11 md:h-12 text-base"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-6 border-t border-border flex gap-3 md:gap-4 shrink-0">
                <Button variant="glass" onClick={onClose} className="flex-1 h-11 md:h-12 text-base" disabled={isLoading}>Cancel</Button>
                <Button variant="gradient" onClick={handleSave} className="flex-1 h-11 md:h-12 text-base" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}