import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Heart, MessageCircle, Eye, Share2, Bookmark,
  ArrowLeft, Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/axios";

// Define Types for API Response
interface WeeklyStat {
  day: string;
  likes: number;
  comments: number;
  shares: number;
}

interface TopPost {
  id: string;
  image: string;
  likes: number;
  comments: number;
}

interface ActivityStats {
  posts: number;
  likes: number;
  comments: number;
  followers: number;
  shares: number;
  saves: number;
}

interface ActivityResponse {
  stats: ActivityStats;
  weeklyData: WeeklyStat[];
  topPosts: TopPost[];
}

export default function ActivityPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const { data: response } = await api.get("/activity");
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch activity:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  // ✅ FIX: Safely handle undefined/null values
  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Fallback if data fails to load (ensures object structure exists)
  const statsData = data?.stats || { posts: 0, likes: 0, comments: 0, followers: 0, shares: 0, saves: 0 };
  const weeklyData = data?.weeklyData || [];
  const topPosts = data?.topPosts || [];

  // Calculate Max Likes for Graph Scaling (Safe Math)
  const maxLikes = Math.max(...weeklyData.map((d) => d.likes || 0), 10);

  // Dynamic Stats Configuration
  const stats = [
    { label: "Total Posts", value: formatNumber(statsData.posts), icon: Eye, color: "from-blue-500 to-cyan-500" },
    { label: "Total Likes", value: formatNumber(statsData.likes), icon: Heart, color: "from-red-500 to-pink-500" },
    { label: "Comments", value: formatNumber(statsData.comments), icon: MessageCircle, color: "from-purple-500 to-violet-500" },
    { label: "Followers", value: formatNumber(statsData.followers), icon: Users, color: "from-green-500 to-emerald-500" },
    { label: "Shares", value: formatNumber(statsData.shares), icon: Share2, color: "from-orange-500 to-amber-500" },
    { label: "Saves", value: formatNumber(statsData.saves), icon: Bookmark, color: "from-indigo-500 to-purple-500" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header with Back Button */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 glass-strong p-4 flex items-center gap-4"
      >
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold gradient-text">Activity Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your performance insights</p>
        </div>
      </motion.div>

      <div className="p-4 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="glass-strong p-4 rounded-2xl"
            >
              <div className={`w-10 h-10 rounded-xl bg-linear-to-r ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Weekly Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-strong p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Weekly Performance</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-linear-to-r from-pink-500 to-violet-500" />
                <span className="text-muted-foreground">Likes</span>
              </div>
            </div>
          </div>

          <div className="h-48 flex items-end gap-2">
            {weeklyData.length > 0 ? (
              weeklyData.map((d, index) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${((d.likes || 0) / maxLikes) * 100}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="w-full bg-linear-to-t from-pink-500 to-violet-500 rounded-t-lg relative group cursor-pointer min-h-1"
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-background border border-white/10 rounded text-xs whitespace-nowrap z-10 shadow-lg text-foreground"
                    >
                      {d.likes || 0} likes
                    </motion.div>
                  </motion.div>
                </div>
              ))
            ) : (
              <p className="w-full text-center text-muted-foreground self-center">No activity data yet.</p>
            )}
          </div>

          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            {weeklyData.map((d) => (
              <span key={d.day} className="flex-1 text-center text-xs">{d.day}</span>
            ))}
          </div>
        </motion.div>

        {/* Top Posts */}
        {topPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-lg font-semibold mb-4 text-foreground">Top Performing Posts</h3>
            <div className="grid grid-cols-3 gap-3">
              {topPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer border border-white/5"
                >
                  <img src={post.image} alt="Post" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="flex items-center gap-1 justify-center mb-1">
                        <Heart className="w-4 h-4 fill-white" />
                        <span className="text-xs font-bold">{formatNumber(post.likes)}</span>
                      </div>
                    </div>
                  </div>
                  {index === 0 && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-yellow-500/90 rounded-md text-[10px] text-black font-bold shadow-sm">
                      #1
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}