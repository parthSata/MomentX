import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Grid3X3, Tag, Sparkles, Loader2, Film, MessageCircle } from "lucide-react";
import { MainLayout } from "@/components/navigation/MainLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PostViewDialog } from "@/components/feed/PostViewDialog";
import { api } from "@/lib/axios";
import type { Post } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ProfileImageViewDialog } from "@/components/profile/ProfileQuickViewDialog";

type TabType = "posts" | "reels" | "tagged";

export default function UserProfilePage() {
    const { username } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    // State
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>("posts");
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isStartingChat, setIsStartingChat] = useState(false);

    // Post View State
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [isPostViewOpen, setIsPostViewOpen] = useState(false);

    // ✅ Image View Dialog State
    const [isProfilePicOpen, setIsProfilePicOpen] = useState(false);

    // Tabs
    const tabs = [
        { id: "posts", icon: Grid3X3, label: "Posts" },
        { id: "reels", icon: Film, label: "Reels" },
        { id: "tagged", icon: Tag, label: "Tagged" },
    ];

    const formatNumber = (num: number) => {
        if (!num) return "0";
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
        if (num >= 1000) return (num / 1000).toFixed(1) + "K";
        return num.toString();
    };

    // 1. Fetch User Profile
    useEffect(() => {
        const fetchProfile = async () => {
            if (!username) return;
            setLoading(true);
            try {
                const { data } = await api.get(`/users/u/${username}`);
                setProfile(data.data);
                setIsFollowing(data.data.isFollowing);
            } catch (error) {
                console.error("Failed to fetch user", error);
                toast.error("User not found");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [username]);

    // 2. Fetch Tab Content (Posts/Reels)
    useEffect(() => {
        const fetchContent = async () => {
            if (!profile?._id) return;
            setLoadingPosts(true);
            setPosts([]);

            try {
                let endpoint = "";
                if (activeTab === "posts") endpoint = `/posts/user-posts/${profile._id}`;
                else if (activeTab === "tagged") endpoint = `/posts/tagged-posts/${profile._id}`;
                else if (activeTab === "reels") endpoint = `/posts/user-posts/${profile._id}`;

                const { data } = await api.get(endpoint);
                const fetchedData = data.data || [];

                let finalPosts = Array.isArray(fetchedData) ? fetchedData : [];

                if (activeTab === "reels") {
                    finalPosts = finalPosts.filter((p: any) => p.videoUrl);
                } else if (activeTab === "posts") {
                    finalPosts = finalPosts.filter((p: any) => !p.videoUrl);
                }
                setPosts(finalPosts);
            } catch (error) {
                console.error("Failed to fetch posts", error);
            } finally {
                setLoadingPosts(false);
            }
        };

        if (profile) {
            fetchContent();
        }
    }, [activeTab, profile]);

    // 3. Follow/Unfollow Handler
    const handleFollow = async () => {
        if (!profile) return;
        const prevStatus = isFollowing;
        setIsFollowing(!isFollowing);

        try {
            await api.post(`/users/follow/${profile._id}`);
            setProfile((prev: any) => ({
                ...prev,
                followersCount: prevStatus ? prev.followersCount - 1 : prev.followersCount + 1
            }));
            toast.success(prevStatus ? "Unfollowed" : "Followed");
        } catch (error) {
            setIsFollowing(prevStatus);
            toast.error("Action failed");
        }
    };

    // 4. Start Chat Handler
    const handleMessageClick = async () => {
        if (!profile?._id) return;
        setIsStartingChat(true);

        try {
            const { data } = await api.post("/chats", { userId: profile._id });
            const chat = data.data;
            navigate(`/chat/${chat._id}`, { state: { user: profile } });
        } catch (error) {
            console.error("Failed to start chat:", error);
            toast.error("Could not open chat");
        } finally {
            setIsStartingChat(false);
        }
    };

    const openPostView = (post: Post) => {
        setSelectedPost(post);
        setIsPostViewOpen(true);
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="h-[80vh] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            </MainLayout>
        );
    }

    if (!profile) {
        return (
            <MainLayout>
                <div className="h-[50vh] flex flex-col items-center justify-center text-muted-foreground">
                    <p>User not found.</p>
                    <Link to="/" className="text-primary hover:underline mt-4">Go Home</Link>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-6">

                {/* ✅ Mount the Image Viewer Dialog */}
                <ProfileImageViewDialog
                    isOpen={isProfilePicOpen}
                    onClose={() => setIsProfilePicOpen(false)}
                    imageUrl={profile.profilePic || "/image.png"}
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
                                className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-linear-to-tr from-yellow-400 to-purple-600 p-1 cursor-pointer transition-transform hover:scale-105"
                                // ✅ Open Image Viewer when clicked
                                onClick={() => setIsProfilePicOpen(true)}
                            >
                                <div className="w-full h-full rounded-full bg-background p-1">
                                    <img
                                        src={profile.profilePic || "/image.png"}
                                        alt={profile.username}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div className="flex flex-col md:flex-row items-center gap-4">
                                <div className="flex items-center gap-2 justify-center md:justify-start">
                                    <h1 className="text-2xl font-bold">{profile.username}</h1>
                                    {profile.isVerified && (
                                        <Sparkles className="w-5 h-5 text-blue-500 fill-blue-500" />
                                    )}
                                </div>

                                {/* Actions: Follow / Message */}
                                {currentUser?._id !== profile._id && (
                                    <div className="flex gap-2 justify-center md:justify-start">
                                        <Button
                                            size="sm"
                                            variant={isFollowing ? "secondary" : "default"}
                                            onClick={handleFollow}
                                            className="min-w-25"
                                        >
                                            {isFollowing ? "Following" : "Follow"}
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleMessageClick}
                                            disabled={isStartingChat}
                                            className="min-w-24 flex items-center gap-2"
                                        >
                                            {isStartingChat ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <MessageCircle className="w-4 h-4" />
                                                    Message
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-center md:justify-start gap-8">
                                <div className="text-center">
                                    <p className="font-bold text-lg">{formatNumber(profile.postsCount)}</p>
                                    <p className="text-sm text-muted-foreground">Posts</p>
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-lg">{formatNumber(profile.followersCount)}</p>
                                    <p className="text-sm text-muted-foreground">Followers</p>
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-lg">{formatNumber(profile.followingCount)}</p>
                                    <p className="text-sm text-muted-foreground">Following</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="font-semibold">{profile.name}</p>
                                <p className="text-sm text-muted-foreground whitespace-pre-line max-w-md mx-auto md:mx-0">
                                    {profile.bio}
                                </p>
                                {profile.website && (
                                    <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline block">
                                        {profile.website}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* --- Tabs --- */}
                <div className="glass rounded-2xl overflow-hidden min-h-[50vh]">
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
                                        layoutId="userProfileTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
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
                                    <Grid3X3 className="w-8 h-8" />
                                </div>
                                <p>No posts yet.</p>
                            </div>
                        ) : (
                            posts.map((post, index) => (
                                <motion.div
                                    key={post._id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
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
                                        />
                                    ) : (
                                        <img
                                            src={post.images?.[0] || "/placeholder-image.jpg"}
                                            alt={post.caption}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                    {/* Overlay for Reels */}
                                    {(activeTab === 'reels' || (post as any).videoUrl) && (
                                        <div className="absolute top-2 right-2 text-white drop-shadow-md">
                                            <Film className="w-4 h-4 fill-white/50" />
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
    );
}