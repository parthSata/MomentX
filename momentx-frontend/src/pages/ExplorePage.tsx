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
      // Ensure user is an object, even if Explore returns a simplified one
      user: post.user || { username: "Unknown", profilePic: "" },
      // Ensure media fields map correctly
      videoUrl: post.videoUrl || (post.type === 'reel' ? post.image : ""),
      images: post.images?.length ? post.images : [post.image],
      // Map simplified counts to standard fields if needed
      likes: typeof post.likes === 'number' ? Array(post.likes).fill("id") : post.likes, // Mock array for length if number
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
            <div className="w-full h-14 pl-12 pr-6 glass rounded-2xl flex items-center text-muted-foreground shadow-sm hover:shadow-md hover:border-primary/50 transition-all border border-transparent">
              Search users, hashtags...
            </div>
          </motion.div>
        </Link>

        {/* 2. Trending Hashtags */}
        {trendingHashtags.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <TrendingUp className="w-5 h-5 text-white" />
              <h3 className="font-bold text-lg">Trending Now</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {trendingHashtags.map((hashtag, index) => (
                <motion.button
                  key={hashtag.tag}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-all flex items-center gap-2 text-white"
                >
                  <span className="text-white/60">{hashtag.tag}</span>
                  <span className="text-xs opacity-60 bg-black/40 px-1.5 py-0.5 rounded-md">
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
            <h3 className="font-bold text-lg px-1">Discover People</h3>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 md:mx-0 md:px-0">
              {users.map((user) => (
                <Link to={`/u/${user.username}`} key={user._id}>
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all shrink-0 w-36 shadow-sm border border-white/5"
                  >
                    <AvatarRing src={user.avatar} alt={user.username} size="lg" className="shadow-md" />
                    <div className="text-center w-full">
                      <p className="font-bold text-sm truncate text-white">{user.displayName || user.username}</p>
                      <p className="text-xs text-white/50 truncate">@{user.username}</p>
                    </div>
                    <div className="text-[10px] font-medium px-2 py-1 bg-black/40 rounded-md text-white/60">
                      {formatNumber(user.followers)} followers
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* 4. Explore Feed Grid */}
        <div className="space-y-3">
          <h3 className="font-bold text-lg px-1">Explore Feed</h3>

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
                  className="relative group rounded-xl overflow-hidden bg-secondary/10 cursor-pointer aspect-4/5 border border-white/5"
                >
                  {/* Media Content */}
                  {isReel ? (
                    <div className="w-full h-full bg-black relative">
                      <video
                        src={videoSrc} // ✅ Use actual video URL here
                        poster={imageSrc} // ✅ Use image as the poster (thumbnail)
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                        muted
                        loop
                        playsInline
                        // Optional: Force reload on hover to ensure play
                        onMouseOver={e => e.currentTarget.play()}
                        onMouseOut={e => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0; // Reset to start (thumbnail view)
                        }}
                      />
                      <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md p-1.5 rounded-full text-white">
                        <Play className="w-3 h-3 fill-white" />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={imageSrc} // ✅ Use image for standard posts
                      alt={post.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  )}

                  {/* Hover Overlay */}
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