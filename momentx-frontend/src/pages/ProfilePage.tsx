import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Settings, Share2, Grid3X3, Bookmark, Tag, Sparkles, Loader2 } from "lucide-react"
import { MainLayout } from "@/components/navigation/MainLayout"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { EditProfileDialog } from "@/components/profile/EditProfileDialog"
import { PostViewDialog } from "@/components/feed/PostViewDialog"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/axios"
import type { Post } from "@/types"
import { toast } from "sonner" // ✅ 1. Import toast

type TabType = "posts" | "saved" | "tagged"

export default function ProfilePage() {
  const { user: authUser, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>("posts")
  const [isEditOpen, setIsEditOpen] = useState(false)

  // Post View State
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPostViewOpen, setIsPostViewOpen] = useState(false);

  // Data State
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)

  const [profileData, setProfileData] = useState({
    _id: "",
    name: "",
    username: "",
    bio: "",
    website: "",
    profilePic: "",
    isVerified: false,
    followers: [] as string[],
    following: [] as string[],
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

  const fetchProfileInfo = async () => {
    if (!authUser) return;
    try {
      const userRes = await api.get("/users/current-user");
      const user = userRes.data?.message?.user || userRes.data?.data?.user || userRes.data?.data;

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
        postsCount: user.postsCount || 0
      });
    } catch (e) {
      console.error("❌ Failed to fetch info", e);
    }
  }

  const fetchTabContent = async () => {
    if (!authUser?._id) return;
    setLoadingPosts(true);
    setPosts([]);

    try {
      let endpoint = "";
      if (activeTab === "posts") endpoint = `/posts/user-posts/${authUser._id}`;
      else if (activeTab === "saved") endpoint = `/posts/saved-posts/${authUser._id}`;
      else if (activeTab === "tagged") endpoint = `/posts/tagged-posts/${authUser._id}`;

      const { data } = await api.get(endpoint);
      const fetchedPosts = data.data || data.message || [];

      setPosts(Array.isArray(fetchedPosts) ? fetchedPosts : []);

    } catch (error) {
      console.error(`❌ Failed to fetch ${activeTab}`, error);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchProfileInfo();
  }, [authUser]);

  useEffect(() => {
    fetchTabContent();
  }, [activeTab, authUser]);

  const handleProfileUpdate = async () => {
    await refreshUser();
    await fetchProfileInfo();
  };

  const openPostView = (post: Post) => {
    setSelectedPost(post);
    setIsPostViewOpen(true);
  };

  // ✅ 2. Handle Share Function
  const handleShareProfile = () => {
    if (!profileData.username) return;

    // 1. Get the current domain (e.g., http://localhost:5173 or https://myapp.com)
    const origin = window.location.origin;

    // 2. Construct the URL. 
    // CHANGE "/u/" below to match your actual route (e.g., "/profile/" or just "/")
    const shareUrl = `${origin}/u/${profileData.username}`;

    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast.success("Profile link copied!", {
          description: `Link: ${shareUrl}`
        });
      })
      .catch(() => {
        toast.error("Failed to copy link");
      });
  };

  if (!authUser) return null;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* --- Header Section --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
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

                  {/* ✅ 3. Attach onClick Handler */}
                  <Button variant="glass" size="icon" onClick={handleShareProfile}>
                    <Share2 className="w-4 h-4" />
                  </Button>

                  <Button variant="ghost" size="icon">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-center md:justify-start gap-8">
                <div className="text-center">
                  <p className="font-bold text-lg">{formatNumber(profileData.postsCount)}</p>
                  <p className="text-sm text-muted-foreground">Posts</p>
                </div>
                <Link to="/followers/followers" className="text-center hover:opacity-80 transition-opacity">
                  <p className="font-bold text-lg">{formatNumber(profileData.followers.length)}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </Link>
                <Link to="/followers/following" className="text-center hover:opacity-80 transition-opacity">
                  <p className="font-bold text-lg">{formatNumber(profileData.following.length)}</p>
                  <p className="text-sm text-muted-foreground">Following</p>
                </Link>
              </div>

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
          onProfileUpdate={handleProfileUpdate}
        />

        {/* --- Tabs --- */}
        <div className="glass rounded-2xl overflow-hidden min-h-75">
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

          {/* --- Grid Content --- */}
          <div className="grid grid-cols-3 gap-0.5 p-0.5">
            {loadingPosts ? (
              <div className="col-span-3 flex justify-center py-20">
                <Loader2 className="animate-spin text-primary w-8 h-8" />
              </div>
            ) : posts.length === 0 ? (
              <div className="col-span-3 flex flex-col items-center justify-center py-20 text-muted-foreground">
                <div className="p-4 rounded-full bg-secondary/50 mb-4">
                  {activeTab === 'saved' ? <Bookmark className="w-8 h-8" /> :
                    activeTab === 'tagged' ? <Tag className="w-8 h-8" /> :
                      <Grid3X3 className="w-8 h-8" />}
                </div>
                <p>No {activeTab} posts yet.</p>
              </div>
            ) : (
              posts.map((post, index) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => openPostView(post)}
                  className="aspect-square relative group overflow-hidden cursor-pointer bg-secondary/30"
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

      <PostViewDialog
        isOpen={isPostViewOpen}
        onClose={() => setIsPostViewOpen(false)}
        post={selectedPost}
      />

    </MainLayout>
  )
}