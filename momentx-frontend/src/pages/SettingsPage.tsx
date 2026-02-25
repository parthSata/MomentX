import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User, Bell, Lock, Palette, Globe, HelpCircle, LogOut,
  ChevronRight, Shield, ArrowLeft, Loader2, Camera
} from "lucide-react";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { PageHeader } from "@/components/navigation/PageHeader";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/axios";

const settingsSections = [
  {
    title: "Account",
    items: [
      { id: "profile", label: "Edit Profile", icon: User, description: "Update your personal information" },
      { id: "privacy", label: "Privacy", icon: Lock, description: "Control who can see your content" },
      { id: "security", label: "Security", icon: Shield, description: "Password and two-factor authentication" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { id: "notifications", label: "Notifications", icon: Bell, description: "Manage your notification settings" },
      { id: "appearance", label: "Appearance", icon: Palette, description: "Theme and display settings" },
      { id: "language", label: "Language", icon: Globe, description: "Choose your preferred language" },
    ],
  },
  {
    title: "Support",
    items: [
      { id: "help", label: "Help Center", icon: HelpCircle, description: "Get help and support" },
    ],
  },
];

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user: authUser, logout, refreshUser } = useAuth();

  // Track which settings pane is currently active
  const [activeView, setActiveView] = useState<string | null>("profile"); // Default to profile

  // ---------------------------------------------------------
  // EDIT PROFILE STATE & LOGIC
  // ---------------------------------------------------------
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
    website: "", // ✅ Added website
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form data when authUser loads
  useEffect(() => {
    if (authUser) {
      setFormData({
        name: authUser.name || "",
        username: authUser.username || "",
        bio: (authUser as any).bio || "",
        website: (authUser as any).website || "", // ✅ Initialize website
      });
      setPreviewImage(authUser.profilePic || "/default-avatar.png");
    }
  }, [authUser]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
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
      data.append("website", formData.website); // ✅ Append website

      if (selectedImage) {
        data.append("profilePic", selectedImage);
      }

      // API Call to the update endpoint
      await api.put("/users/update-profile", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Refresh the context user to globally update the app state
      await refreshUser();

      toast.success("Profile updated successfully!");
      setSelectedImage(null); // Reset file selection after success
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // ---------------------------------------------------------
  // LOGOUT LOGIC
  // ---------------------------------------------------------
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  // ---------------------------------------------------------
  // DYNAMIC SUB-PAGES RENDERER
  // ---------------------------------------------------------
  const renderActiveView = () => {
    switch (activeView) {
      case "profile":
        return (
          <form onSubmit={handleProfileSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Avatar Section */}
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

            {/* Form Fields Section */}
            <div className="space-y-4 glass-strong p-6 rounded-2xl">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-background/50 border-border/50"
                  placeholder="Your display name"
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
                    placeholder="username"
                    maxLength={20}
                  />
                </div>
              </div>

              {/* ✅ Added Website Field */}
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
                  placeholder="Tell us about yourself..."
                />
                <p className="text-xs text-muted-foreground text-right mt-1">{formData.bio.length}/150</p>
              </div>

              <Button type="submit" className="w-full mt-4 h-12" disabled={isUpdatingProfile}>
                {isUpdatingProfile ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
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
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="glass-strong p-6 rounded-2xl space-y-4 opacity-50 pointer-events-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-lg">Change Password</h3>
                <span className="text-[10px] bg-secondary px-2 py-0.5 rounded">Coming Soon</span>
              </div>
              <Input type="password" placeholder="Current Password" />
              <Input type="password" placeholder="New Password" />
              <Input type="password" placeholder="Confirm New Password" />
              <Button className="w-full">Update Password</Button>
            </div>
          </div>
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

      {/* ---------------------------------------------------------
          LEFT SIDEBAR (Hidden on mobile if a view is active)
      --------------------------------------------------------- */}
      <div className={`w-full md:w-80 lg:w-96 md:border-r border-border md:h-screen md:overflow-y-auto shrink-0 ${activeView ? 'hidden md:block' : 'block'}`}>
        <PageHeader title="Settings" />

        <div className="p-4 space-y-6">
          {/* Profile Card Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong p-5 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => setActiveView("profile")}
          >
            <AvatarRing
              src={authUser?.profilePic || "/default-avatar.png"}
              size="lg"
            />
            <div className="flex-1 overflow-hidden">
              <h3 className="text-lg font-semibold truncate">{authUser?.name || "User"}</h3>
              <p className="text-muted-foreground text-sm truncate">@{authUser?.username}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.div>

          {/* Settings Sections */}
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

          {/* Logout Button */}
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

          {/* App Version */}
          <p className="text-center text-xs text-muted-foreground pb-8">
            MomentX v1.0.0
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------------
          RIGHT CONTENT AREA (Hidden on mobile if NO view active)
      --------------------------------------------------------- */}
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

// Helper icon for empty state
function SettingsIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}