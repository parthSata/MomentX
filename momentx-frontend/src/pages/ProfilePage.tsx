import { useState } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Settings, Share2, Grid3X3, Bookmark, Tag, Sparkles } from "lucide-react"
import { currentUser, posts, highlights } from "@/data/mockData"
import { MainLayout } from "@/components/navigation/MainLayout"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { EditProfileDialog } from "@/components/profile/EditProfileDialog"

type TabType = "posts" | "saved" | "tagged"

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabType>("posts")
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [userData, setUserData] = useState({
    displayName: currentUser.displayName,
    username: currentUser.username,
    bio: currentUser.bio,
    website: currentUser.website,
    avatar: currentUser.avatar,
  })

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "K"
    return num.toString()
  }

  const tabs = [
    { id: "posts", icon: Grid3X3, label: "Posts" },
    { id: "saved", icon: Bookmark, label: "Saved" },
    { id: "tagged", icon: Tag, label: "Tagged" },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-pink p-1 animate-gradient animate-glow">
                <div className="w-full h-full rounded-full bg-background p-1">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-display font-bold">{currentUser.username}</h1>
                  {currentUser.isVerified && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="gradient" size="sm" onClick={() => setIsEditOpen(true)}>
                    Edit Profile
                  </Button>
                  <Button variant="glass" size="icon">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex justify-center md:justify-start gap-8">
                <div className="text-center">
                  <p className="font-bold text-lg">{formatNumber(currentUser.posts)}</p>
                  <p className="text-sm text-muted-foreground">Posts</p>
                </div>
                <Link to="/followers/followers" className="text-center hover:opacity-80 transition-opacity">
                  <p className="font-bold text-lg">{formatNumber(currentUser.followers)}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </Link>
                <Link to="/followers/following" className="text-center hover:opacity-80 transition-opacity">
                  <p className="font-bold text-lg">{formatNumber(currentUser.following)}</p>
                  <p className="text-sm text-muted-foreground">Following</p>
                </Link>
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <p className="font-semibold">{userData.displayName}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{userData.bio}</p>
                <a href={`https://${userData.website}`} className="text-sm text-primary hover:underline">
                  {userData.website}
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Edit Profile Dialog */}
        <EditProfileDialog
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          user={userData}
          onSave={(data) => setUserData({ ...userData, ...data })}
        />

        {/* Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        >
          {highlights.map((highlight, index) => (
            <motion.button
              key={highlight.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2 flex-shrink-0"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-pink p-0.5">
                <div className="w-full h-full rounded-full bg-background p-0.5">
                  <img
                    src={highlight.cover}
                    alt={highlight.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <span className="text-xs">{highlight.name}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-4 relative transition-colors",
                  activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="profileTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-pink"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-3 gap-0.5 p-0.5">
            {posts.map((post, index) => (
              <motion.button
                key={post.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="aspect-square relative group overflow-hidden"
              >
                <img
                  src={post.image}
                  alt={post.caption}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <div className="flex items-center gap-1 text-foreground">
                    <span className="font-semibold">{formatNumber(post.likes)}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
