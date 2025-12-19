import { motion } from "framer-motion";
import {
  User, Bell, Lock, Palette, Globe, HelpCircle, LogOut,
  ChevronRight, Shield
} from "lucide-react";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { PageHeader } from "@/components/navigation/PageHeader";
import { useTheme } from "@/components/theme/ThemeProvider";
import { ThemeToggle } from "@/components/navigation/ThemeToggle";

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

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <PageHeader title="Settings" />

      <div className="p-4 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong p-6 rounded-2xl"
        >
          <div className="flex items-center gap-4">
            <AvatarRing
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
              size="lg"
              hasStory
            />
            <div className="flex-1">
              <h3 className="text-xl font-semibold">John Doe</h3>
              <p className="text-muted-foreground">@johndoe</p>
              <p className="text-sm text-primary mt-1">Pro Account</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gradient-primary text-white rounded-xl font-medium"
            >
              Edit
            </motion.button>
          </div>
        </motion.div>

        {/* Quick Toggles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-strong p-4 rounded-2xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-primary">
                <ThemeToggle />
              </div>
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Toggle dark/light theme</p>
              </div>
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
        </motion.div>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + sectionIndex * 0.1 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">{section.title}</h3>
            <div className="glass-strong rounded-2xl overflow-hidden">
              {section.items.map((item, index) => (
                <motion.button
                  key={item.id}
                  whileHover={{ x: 4 }}
                  className={`w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors ${
                    index !== section.items.length - 1 ? "border-b border-border/50" : ""
                  }`}
                >
                  <div className="p-2 bg-gradient-primary/20 rounded-xl">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Logout Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 p-4 glass-strong rounded-2xl text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Log Out</span>
        </motion.button>

        {/* App Version */}
        <p className="text-center text-sm text-muted-foreground">
          MomentX v1.0.0
        </p>
      </div>
    </div>
  );
}
