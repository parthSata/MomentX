import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, TrendingUp, Loader2, Play, Heart, MessageCircle } from "lucide-react";
import { MainLayout } from "@/components/navigation/MainLayout";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { api } from "@/lib/axios";
import { PostViewDialog } from "@/components/feed/PostViewDialog";
import type { Post } from "@/types";

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPostViewOpen, setIsPostViewOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [postsRes, usersRes, tagsRes] = await Promise.all([
          api.get("/explore/feed"),
          api.get("/explore/suggestions"),
          api.get("/explore/trending"),
        ]);

        setPosts(postsRes.data.data || []);
        setUsers(usersRes.data.data || []);
        setTrendingHashtags(tagsRes.data.data || []);
      } catch (error) {
        console.error("Explore fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatNumber = (num: number) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const openPost = (post: any) => {
    const compatiblePost = {
      ...post,
      user: post.user || { username: "Unknown", profilePic: "" },
      videoUrl: post.videoUrl || (post.type === 'reel' ? post.image : ""),
      images: post.images?.length ? post.images : [post.image],
      likes: typeof post.likes === 'number' ? Array(post.likes).fill("id") : post.likes,
      commentsCount: post.comments
    };

    setSelectedPost(compatiblePost);
    setIsPostViewOpen(true);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 pb-24 px-4 md:px-0">

        {/* 1. Search Bar */}
        <Link to="/search">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors z-10" />
            {/* ✅ Fix: Removed 'glass' which might be dark-only, used 'bg-secondary/30' for adaptable bg */}
            <div className="w-full h-14 pl-12 pr-6 bg-secondary/30 rounded-2xl flex items-center text-muted-foreground shadow-sm hover:shadow-md hover:border-primary/50 transition-all border border-border/50">
              Search users, hashtags...
            </div>
          </motion.div>
        </Link>

        {/* 2. Trending Hashtags */}
        {trendingHashtags.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              {/* ✅ Fix: text-white -> text-primary */}
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg text-foreground">Trending Now</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {trendingHashtags.map((hashtag, index) => (
                <motion.button
                  key={hashtag.tag}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  // ✅ Fix: Replaced hardcoded white styles with theme vars (bg-card, text-foreground)
                  className="px-4 py-2 rounded-full bg-card hover:bg-secondary border border-border text-sm font-medium transition-all flex items-center gap-2 text-foreground shadow-sm"
                >
                  <span className="text-muted-foreground">{hashtag.tag}</span>
                  <span className="text-xs opacity-80 bg-secondary px-1.5 py-0.5 rounded-md text-foreground">
                    {formatNumber(hashtag.posts)}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* 3. Suggested Profiles */}
        {users.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {/* ✅ Fix: text-foreground */}
            <h3 className="font-bold text-lg px-1 text-foreground">Discover People</h3>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 md:mx-0 md:px-0">
              {users.map((user) => (
                <Link to={`/u/${user.username}`} key={user._id}>
                  <motion.div
                    whileHover={{ y: -5 }}
                    // ✅ Fix: Replaced bg-white/5 with bg-card
                    className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-card hover:bg-secondary/50 hover:border-primary/20 transition-all shrink-0 w-36 shadow-sm border border-border"
                  >
                    <AvatarRing src={user.avatar} alt={user.username} size="lg" className="shadow-md" />
                    <div className="text-center w-full">
                      {/* ✅ Fix: text-white -> text-foreground */}
                      <p className="font-bold text-sm truncate text-foreground">{user.displayName || user.username}</p>
                      <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                    </div>
                    <div className="text-[12px] font-medium px-2 py-1 bg-secondary rounded-md text-muted-foreground">
                      {formatNumber(user.followers)} Followers
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* 4. Explore Feed Grid */}
        <div className="space-y-3">
          <h3 className="font-bold text-lg px-1 text-foreground">Explore Feed</h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-4">
            {posts.map((post, index) => {
              const explorePost = post as any;
              const isReel = explorePost.type === 'reel' || !!explorePost.videoUrl;
              const videoSrc = explorePost.videoUrl;
              const imageSrc = explorePost.image || explorePost.images?.[0];

              return (
                <motion.div
                  key={post._id || index}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: (index % 5) * 0.05 }}
                  onClick={() => openPost(post)}
                  // ✅ Fix: bg-secondary/10 instead of hardcoded
                  className="relative group rounded-xl overflow-hidden bg-muted cursor-pointer aspect-4/5 border border-border/50"
                >
                  {/* Media Content */}
                  {isReel ? (
                    <div className="w-full h-full bg-black relative">
                      <video
                        src={videoSrc}
                        poster={imageSrc}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                        muted
                        loop
                        playsInline
                        onMouseOver={e => e.currentTarget.play()}
                        onMouseOut={e => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                      />
                      <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md p-1.5 rounded-full text-white">
                        <Play className="w-3 h-3 fill-white" />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={imageSrc}
                      alt={post.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  )}

                  {/* Hover Overlay (Always dark for text visibility) */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    <div className="flex items-center gap-3 text-white">
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4 fill-white" />
                        <span className="text-xs font-bold">{formatNumber(explorePost.likes)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4 fill-white" />
                        <span className="text-xs font-bold">{formatNumber(explorePost.comments)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>

      <PostViewDialog
        isOpen={isPostViewOpen}
        onClose={() => setIsPostViewOpen(false)}
        post={selectedPost}
      />
    </MainLayout>
  );
}