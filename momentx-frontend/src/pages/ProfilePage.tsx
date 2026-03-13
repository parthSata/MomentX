import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom"; // ✅ Added useParams & useNavigate
import { Settings, Share2, Grid3X3, Bookmark, Tag, Sparkles, Loader2, Film, MessageCircle, UserPlus, UserCheck } from "lucide-react";
import { MainLayout } from "@/components/navigation/MainLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { PostViewDialog } from "@/components/feed/PostViewDialog";
import { ProfileImageViewDialog } from "@/components/profile/ProfileQuickViewDialog"; // ✅ Fixed import path
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/axios";
import type { Post } from "@/types";
import { toast } from "sonner";

type TabType = "posts" | "reels" | "saved" | "tagged";

export default function ProfilePage() {
  const { username } = useParams(); // ✅ Get username from URL if it exists
  const navigate = useNavigate();
  const { user: authUser, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Post View State
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPostViewOpen, setIsPostViewOpen] = useState(false);

  // Profile Image View State
  const [isProfilePicOpen, setIsProfilePicOpen] = useState(false);

  // Interaction State (For viewing other users)
  const [isFollowing, setIsFollowing] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  // Data State
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

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
  });

  // Check if we are viewing our own profile
  const isOwnProfile = !username || (authUser && authUser.username === username);

  const formatNumber = (num: number) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  // ✅ Conditionally render tabs (Hide "Saved" for other users)
  const tabs = isOwnProfile ? [
    { id: "posts", icon: Grid3X3, label: "Posts" },
    { id: "reels", icon: Film, label: "Reels" },
    { id: "saved", icon: Bookmark, label: "Saved" },
    { id: "tagged", icon: Tag, label: "Tagged" },
  ] : [
    { id: "posts", icon: Grid3X3, label: "Posts" },
    { id: "reels", icon: Film, label: "Reels" },
    { id: "tagged", icon: Tag, label: "Tagged" },
  ];

  const fetchProfileInfo = async () => {
    setProfileLoading(true);
    try {
      const endpoint = isOwnProfile ? "/users/current-user" : `/users/u/${username}`;
      const { data } = await api.get(endpoint);

      const user = data?.message?.user || data?.data?.user || data?.data;

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

      // If viewing someone else, check if we follow them
      if (!isOwnProfile && authUser) {
        setIsFollowing(user.followers?.includes(authUser._id) || user.isFollowing);
      }
    } catch (e) {
      console.error("❌ Failed to fetch info", e);
      toast.error("User not found");
      navigate("/");
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchTabContent = async () => {
    if (!profileData._id) return;
    setLoadingPosts(true);
    setPosts([]);

    try {
      let endpoint = "";
      if (activeTab === "posts") endpoint = `/posts/user-posts/${profileData._id}`;
      else if (activeTab === "saved" && isOwnProfile) endpoint = `/posts/saved-posts/${profileData._id}`;
      else if (activeTab === "tagged") endpoint = `/posts/tagged-posts/${profileData._id}`;
      else if (activeTab === "reels") endpoint = `/posts/user-posts/${profileData._id}`;

      if (!endpoint) {
        setLoadingPosts(false);
        return;
      }

      const { data } = await api.get(endpoint);
      const fetchedData = data.data || data.message || [];

      let finalPosts = Array.isArray(fetchedData) ? fetchedData : [];

      if (activeTab === "reels") {
        finalPosts = finalPosts.filter((p: any) => p.videoUrl);
      } else if (activeTab === "posts") {
        finalPosts = finalPosts.filter((p: any) => !p.videoUrl); // Only Photos
      }

      setPosts(finalPosts);
    } catch (error) {
      console.error(`❌ Failed to fetch ${activeTab}`, error);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (authUser) {
      fetchProfileInfo();
      // Reset tab to posts if navigating from own profile (which has saved) to someone else's
      if (!isOwnProfile && activeTab === 'saved') setActiveTab('posts');
    }
  }, [authUser, username]);

  useEffect(() => {
    fetchTabContent();
  }, [activeTab, profileData._id]);

  const handleProfileUpdate = async () => {
    await refreshUser();
    await fetchProfileInfo();
  };

  const handleFollowToggle = async () => {
    if (!profileData._id) return;
    const prevStatus = isFollowing;
    setIsFollowing(!isFollowing);

    try {
      await api.post(`/users/follow/${profileData._id}`);
      setProfileData(prev => ({
        ...prev,
        followers: prevStatus
          ? prev.followers.filter(id => id !== authUser?._id)
          : [...prev.followers, authUser?._id || ""]
      }));
      await refreshUser();
    } catch (error) {
      setIsFollowing(prevStatus);
      toast.error("Action failed");
    }
  };

  const handleMessageClick = async () => {
    if (!profileData?._id) return;
    setIsStartingChat(true);

    try {
      const { data } = await api.post("/chats", { userId: profileData._id });
      const chat = data.data;
      navigate(`/chat/${chat._id}`, { state: { user: profileData } });
    } catch (error) {
      toast.error("Could not open chat");
    } finally {
      setIsStartingChat(false);
    }
  };

  const openPostView = (post: Post) => {
    setSelectedPost(post);
    setIsPostViewOpen(true);
  };

  const handleShareProfile = () => {
    if (!profileData.username) return;
    const origin = window.location.origin;
    const shareUrl = `${origin}/u/${profileData.username}`;

    navigator.clipboard.writeText(shareUrl)
      .then(() => toast.success("Profile link copied!"))
      .catch(() => toast.error("Failed to copy link"));
  };

  if (!authUser || profileLoading) {
    return (
      <MainLayout>
        <div className="h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">

        <ProfileImageViewDialog
          isOpen={isProfilePicOpen}
          onClose={() => setIsProfilePicOpen(false)}
          imageUrl={profileData.profilePic || "/image.png"}
        />

        {/* --- Header Section --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <div
                className="w-32 h-32 rounded-full bg-linear-to-r from-neon-indigo via-neon-violet to-neon-pink p-1 animate-gradient cursor-pointer transition-transform hover:scale-105"
                onClick={() => setIsProfilePicOpen(true)}
              >
                <div className="w-full h-full rounded-full bg-background p-1">
                  <img
                    src={profileData.profilePic || "/image.png"}
                    alt={profileData.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <h1 className="text-2xl font-display font-bold">{profileData.username}</h1>
                  {profileData.isVerified && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* ✅ CONDITIONAL ACTION BUTTONS */}
                <div className="flex gap-2 justify-center md:justify-start">
                  {isOwnProfile ? (
                    <>
                      <Button variant="gradient" size="sm" onClick={() => setIsEditOpen(true)}>Edit Profile</Button>
                      <Button variant="glass" size="icon" onClick={handleShareProfile}><Share2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}><Settings className="w-4 h-4" /></Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant={isFollowing ? "secondary" : "default"}
                        onClick={handleFollowToggle}
                        className="min-w-28"
                      >
                        {isFollowing ? <><UserCheck className="w-4 h-4 mr-2" /> Following</> : <><UserPlus className="w-4 h-4 mr-2" /> Follow</>}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMessageClick}
                        disabled={isStartingChat}
                        className="min-w-28"
                      >
                        {isStartingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <><MessageCircle className="w-4 h-4 mr-2" /> Message</>}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-center md:justify-start gap-8">
                <div className="text-center">
                  <p className="font-bold text-lg">{formatNumber(profileData.postsCount)}</p>
                  <p className="text-sm text-muted-foreground">Posts</p>
                </div>
                <Link to={`/followers/${profileData._id}?tab=followers`} className="text-center hover:opacity-80 transition-opacity">
                  <p className="font-bold text-lg">{formatNumber(profileData.followers.length)}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </Link>
                <Link to={`/followers/${profileData._id}?tab=following`} className="text-center hover:opacity-80 transition-opacity">
                  <p className="font-bold text-lg">{formatNumber(profileData.following.length)}</p>
                  <p className="text-sm text-muted-foreground">Following</p>
                </Link>
              </div>

              <div className="space-y-1">
                <p className="font-semibold">{profileData.name}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line max-w-md mx-auto md:mx-0">{profileData.bio}</p>
                {profileData.website && (
                  <a href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block">
                    {profileData.website}
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {isOwnProfile && (
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
        )}

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
                      activeTab === 'reels' ? <Film className="w-8 h-8" /> :
                        <Grid3X3 className="w-8 h-8" />}
                </div>
                <p>No {activeTab} yet.</p>
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
                  className={cn(
                    "relative group overflow-hidden cursor-pointer bg-secondary/30",
                    activeTab === 'reels' ? "aspect-9/16" : "aspect-square"
                  )}
                >
                  {activeTab === 'reels' || (post as any).videoUrl ? (
                    <video
                      src={(post as any).videoUrl}
                      className="w-full h-full object-cover pointer-events-none"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={post.images?.[0] || "/placeholder-image.jpg"}
                      alt={post.caption || "Post"}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Overlay Icon for Reels tab */}
                  {activeTab === 'reels' && (
                    <div className="absolute top-2 right-2 text-white drop-shadow-md">
                      <Film className="w-4 h-4 fill-white/20" />
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      <PostViewDialog
        isOpen={isPostViewOpen}
        onClose={() => {
          setIsPostViewOpen(false);
          setSelectedPost(null); // ✅ THIS IS THE FIX: Clear the state on close
        }}
        post={selectedPost}
      />

    </MainLayout>
  )
}