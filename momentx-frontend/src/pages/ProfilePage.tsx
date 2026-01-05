import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Settings, Share2, Grid3X3, Bookmark, Tag, Sparkles, Loader2 } from "lucide-react"
import { MainLayout } from "@/components/navigation/MainLayout"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { EditProfileDialog } from "@/components/profile/EditProfileDialog"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/axios"
import type { Post } from "@/types"

type TabType = "posts" | "saved" | "tagged"

export default function ProfilePage() {
  const { user: authUser, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>("posts")
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)

  // Local state to hold latest profile data
  const [profileData, setProfileData] = useState({
    _id: "",
    name: "",
    username: "",
    bio: "",
    website: "",
    profilePic: "",
    isVerified: false,
    followers: [],
    following: [],
    postsCount: 0
  })

  const formatNumber = (num: number) => {
    if (!num) return "0"
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "K"
    return num.toString()
  }

  const tabs = [
    { id: "posts", icon: Grid3X3, label: "Posts" },
    { id: "saved", icon: Bookmark, label: "Saved" },
    { id: "tagged", icon: Tag, label: "Tagged" },
  ]

  // ✅ Fetch Real Data with Debug Logs
  const fetchData = async () => {
    try {
      if (!authUser) return;
      // 1. Fetch Latest Profile Details
      const userRes = await api.get("/users/current-user");
      const user = userRes.data?.message?.user || userRes.data?.data?.user || userRes.data?.data;


      let userPosts: Post[] = [];
      try {
        const postsRes = await api.get(`/posts/user-posts/${user._id}`);
        userPosts = postsRes.data?.data || postsRes.data?.message || [];
      } catch (postError) {
        console.warn("⚠️ [ProfilePage] Could not fetch posts (Route might be missing):", postError);
        userPosts = [];
      }

      setPosts(userPosts);

      setProfileData({
        _id: user._id,
        name: user.name || "",
        username: user.username,
        bio: user.bio || "",
        website: user.website || "",
        profilePic: user.profilePic || "",
        isVerified: user.isVerified || false,
        followers: user.followers || [],
        following: user.following || [],
        postsCount: userPosts.length // Dynamically count posts
      });

    } catch (error) {
      console.error("❌ [ProfilePage] Fatal Error fetching profile data:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [authUser]);

  // ✅ Function passed to EditDialog to refresh data after edit
  const handleProfileUpdate = async () => {
    await refreshUser(); // Update global auth state (Header avatar)
    await fetchData();   // Update local profile page state (Bio, Name)
  };

  if (!authUser) return null;

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
              <div className="w-32 h-32 rounded-full bg-linear-to-r from-neon-indigo via-neon-violet to-neon-pink p-1 animate-gradient">
                <div className="w-full h-full rounded-full bg-background p-1">
                  <img
                    src={profileData.profilePic || "/default-avatar.png"}
                    alt={profileData.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-display font-bold">{profileData.username}</h1>
                  {profileData.isVerified && (
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
                  <p className="font-bold text-lg">{formatNumber(profileData.postsCount)}</p>
                  <p className="text-sm text-muted-foreground">Posts</p>
                </div>
                <Link to="/followers" className="text-center hover:opacity-80 transition-opacity">
                  <p className="font-bold text-lg">{formatNumber(profileData.followers.length)}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </Link>
                <Link to="/following" className="text-center hover:opacity-80 transition-opacity">
                  <p className="font-bold text-lg">{formatNumber(profileData.following.length)}</p>
                  <p className="text-sm text-muted-foreground">Following</p>
                </Link>
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <p className="font-semibold">{profileData.name}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{profileData.bio}</p>
                {profileData.website && (
                  <a href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    {profileData.website}
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Edit Profile Dialog */}
        <EditProfileDialog
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          user={{
            displayName: profileData.name,
            username: profileData.username,
            bio: profileData.bio,
            website: profileData.website,
            avatar: profileData.profilePic
          }}
          onProfileUpdate={handleProfileUpdate} // ✅ Use the new handler
        />

        {/* Highlights Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        >
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
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-neon-indigo via-neon-violet to-neon-pink"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-3 gap-0.5 p-0.5">
            {loadingPosts ? (
              <div className="col-span-3 flex justify-center py-10">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : posts.length === 0 ? (
              <div className="col-span-3 text-center py-10 text-muted-foreground">
                No posts yet.
              </div>
            ) : (
              posts.map((post, index) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className="aspect-square relative group overflow-hidden cursor-pointer"
                >
                  <img
                    src={post.images?.[0] || "/placeholder-image.jpg"}
                    alt={post.caption || "Post"}
                    className="w-full h-full object-cover"
                  />
                 
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}