import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User, Lock, Palette, LogOut, Bookmark,
  ChevronRight, Shield, ArrowLeft, Loader2, Camera, Play
} from "lucide-react";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { PageHeader } from "@/components/navigation/PageHeader";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import { PostViewDialog } from "@/components/feed/PostViewDialog"; // Reusing your PostView Dialog
import type { Post } from "@/types";

const settingsSections = [
  {
    title: "Account",
    items: [
      { id: "profile", label: "Edit Profile", icon: User, description: "Update your personal information" },
      { id: "saved", label: "Saved Content", icon: Bookmark, description: "View your saved posts and reels" },
      { id: "privacy", label: "Privacy", icon: Lock, description: "Control who can see your content" },
      { id: "security", label: "Security", icon: Shield, description: "Password and two-factor authentication" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { id: "appearance", label: "Appearance", icon: Palette, description: "Theme and display settings" },
    ],
  }
];

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user: authUser, logout, refreshUser } = useAuth();

  const [activeView, setActiveView] = useState<string | null>("profile");

  // ---------------------------------------------------------
  // EDIT PROFILE STATE
  // ---------------------------------------------------------
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
    website: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------
  // SECURITY (PASSWORD) STATE
  // ---------------------------------------------------------
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // ---------------------------------------------------------
  // SAVED CONTENT STATE
  // ---------------------------------------------------------
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPostViewOpen, setIsPostViewOpen] = useState(false);

  // Sync profile form data
  useEffect(() => {
    if (authUser) {
      setFormData({
        name: authUser.name || "",
        username: authUser.username || "",
        bio: (authUser as any).bio || "",
        website: (authUser as any).website || "",
      });
      setPreviewImage(authUser.profilePic || "/default-avatar.png");
    }
  }, [authUser]);

  // Fetch saved posts when navigating to "saved" view
  useEffect(() => {
    if (activeView === "saved" && authUser) {
      const fetchSavedPosts = async () => {
        setIsLoadingSaved(true);
        try {
          const { data } = await api.get(`/posts/saved-posts/${authUser._id}`);
          // Ensure it handles both raw arrays or data.data objects depending on backend consistency
          const items = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
          setSavedPosts(items);
        } catch (error) {
          console.error("Failed to load saved posts", error);
          toast.error("Could not load saved content");
        } finally {
          setIsLoadingSaved(false);
        }
      };
      fetchSavedPosts();
    }
  }, [activeView, authUser]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim()) {
      return toast.error("Name and username are required");
    }

    setIsUpdatingProfile(true);
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("username", formData.username);
      data.append("bio", formData.bio);
      data.append("website", formData.website);

      if (selectedImage) data.append("profilePic", selectedImage);

      await api.put("/users/update-profile", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await refreshUser();
      toast.success("Profile updated successfully!");
      setSelectedImage(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      return toast.error("All fields are required");
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error("New passwords do not match");
    }

    if (passwordData.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters long");
    }

    setIsUpdatingPassword(true);
    try {
      await api.post("/users/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  const renderActiveView = () => {
    switch (activeView) {
      case "profile":
        return (
          <form onSubmit={handleProfileSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col items-center gap-4 p-6 glass-strong rounded-2xl">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <AvatarRing src={previewImage || "/default-avatar.png"} size="xl" />
                <button
                  type="button"
                  className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="w-6 h-6 text-white" />
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                Change Photo
              </Button>
            </div>

            <div className="space-y-4 glass-strong p-6 rounded-2xl">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-background/50 border-border/50"
                  maxLength={30}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, "") })}
                    className="pl-10 bg-background/50 border-border/50"
                    maxLength={20}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Website</label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="bg-background/50 border-border/50"
                  placeholder="yourwebsite.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-background/50 border border-border/50 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={4}
                  maxLength={150}
                />
                <p className="text-xs text-muted-foreground text-right mt-1">{formData.bio.length}/150</p>
              </div>
              <Button type="submit" className="w-full mt-4 h-12" disabled={isUpdatingProfile}>
                {isUpdatingProfile ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Updating...</> : "Save Changes"}
              </Button>
            </div>
          </form>
        );

      case "saved":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold hidden md:block">Saved Content</h2>

            {isLoadingSaved ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : savedPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-background/30 rounded-2xl border border-border/50">
                <Bookmark className="w-12 h-12 mb-4 opacity-20" />
                <p>You haven't saved anything yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 md:gap-2">
                {savedPosts.map((post, index) => {
                  const isVideo = (post as any).videoUrl || (post as any).type === 'reel';
                  const thumbnail = isVideo
                    ? ((post as any).thumbnailUrl || (post as any).image)
                    : (post.images?.[0] || (post as any).image);

                  return (
                    <motion.div
                      key={post._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => {
                        setSelectedPost(post);
                        setIsPostViewOpen(true);
                      }}
                      className="relative group overflow-hidden cursor-pointer aspect-square bg-secondary/30 rounded-md md:rounded-xl"
                    >
                      <img
                        src={thumbnail || "/placeholder-image.jpg"}
                        alt="Saved Post"
                        className="w-full h-full object-cover"
                      />
                      {isVideo && (
                        <div className="absolute top-2 right-2 text-white drop-shadow-md">
                          <Play className="w-4 h-4 md:w-5 md:h-5 fill-white" />
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}

            <PostViewDialog
              isOpen={isPostViewOpen}
              onClose={() => setIsPostViewOpen(false)}
              post={selectedPost}
            />
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="glass-strong p-6 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="font-medium text-lg">Dark Mode</h3>
                <p className="text-sm text-muted-foreground">Adjust how the app looks on your device.</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className={`w-14 h-8 rounded-full p-1 transition-colors ${theme === "dark" ? "bg-gradient-primary" : "bg-muted"}`}
              >
                <motion.div
                  animate={{ x: theme === "dark" ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="w-6 h-6 bg-white rounded-full shadow-md"
                />
              </motion.button>
            </div>
          </div>
        );

      case "privacy":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="glass-strong p-6 rounded-2xl flex items-center justify-between opacity-50 cursor-not-allowed">
              <div>
                <h3 className="font-medium text-lg flex items-center gap-2">Private Account <span className="text-[10px] bg-secondary px-2 py-0.5 rounded">Coming Soon</span></h3>
                <p className="text-sm text-muted-foreground">Only approved followers can see your posts.</p>
              </div>
              <input type="checkbox" disabled className="w-5 h-5 accent-primary" />
            </div>
          </div>
        );

      case "security":
        return (
          <form onSubmit={handlePasswordSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="glass-strong p-6 rounded-2xl space-y-4">
              <div className="mb-6">
                <h3 className="font-medium text-xl">Change Password</h3>
                <p className="text-sm text-muted-foreground">Ensure your account is using a long, random password to stay secure.</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Current Password</label>
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="bg-background/50 border-border/50"
                />
              </div>

              <div className="pt-2">
                <label className="text-sm font-medium text-muted-foreground mb-1 block">New Password</label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="bg-background/50 border-border/50"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Confirm New Password</label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="bg-background/50 border-border/50"
                />
              </div>

              <Button type="submit" className="w-full mt-6 h-12" disabled={isUpdatingPassword}>
                {isUpdatingPassword ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Updating...</> : "Update Password"}
              </Button>
            </div>
          </form>
        );

      default:
        return (
          <div className="hidden md:flex h-full flex-col items-center justify-center text-muted-foreground p-10">
            <SettingsIcon className="w-16 h-16 mb-4 opacity-20" />
            <p>Select a setting from the menu</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 flex flex-col md:flex-row">
      <div className={`w-full md:w-80 lg:w-96 md:border-r border-border md:h-screen md:overflow-y-auto shrink-0 ${activeView ? 'hidden md:block' : 'block'}`}>
        <PageHeader title="Settings" />

        <div className="p-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong p-5 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => setActiveView("profile")}
          >
            <AvatarRing src={authUser?.profilePic || "/default-avatar.png"} size="lg" />
            <div className="flex-1 overflow-hidden">
              <h3 className="text-lg font-semibold truncate">{authUser?.name || "User"}</h3>
              <p className="text-muted-foreground text-sm truncate">@{authUser?.username}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.div>

          {settingsSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + sectionIndex * 0.1 }}
            >
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2">{section.title}</h3>
              <div className="glass-strong rounded-2xl overflow-hidden">
                {section.items.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors ${activeView === item.id ? "bg-white/10" : ""
                      } ${index !== section.items.length - 1 ? "border-b border-border/50" : ""}`}
                  >
                    <div className="p-2 bg-secondary rounded-xl">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm text-foreground">{item.label}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50" />
                  </button>
                ))}
              </div>
            </motion.div>
          ))}

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 glass-strong rounded-2xl text-red-500 hover:bg-red-500/10 transition-colors mt-8"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log Out</span>
          </motion.button>

        </div>
      </div>

      <div className={`flex-1 md:h-screen md:overflow-y-auto bg-background/50 ${!activeView ? 'hidden md:block' : 'block'}`}>
        {activeView && (
          <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center gap-3 md:hidden">
            <button onClick={() => setActiveView(null)} className="p-2 bg-secondary rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-lg capitalize">{activeView.replace("-", " ")}</h2>
          </div>
        )}

        <div className="p-4 md:p-8 max-w-2xl mx-auto pb-32 md:pb-8">
          {renderActiveView()}
        </div>
      </div>
    </div>
  );
}

function SettingsIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}