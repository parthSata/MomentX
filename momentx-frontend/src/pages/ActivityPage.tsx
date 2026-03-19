import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, Users, Heart, MessageCircle, Eye, Share2, Bookmark,
  ArrowLeft, Loader2, Activity, Calendar
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/axios";

// ✅ Import your Sidebar component
import { Sidebar } from "@/components/navigation/Sidebar";

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

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-black text-white items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statsData = data?.stats || { posts: 0, likes: 0, comments: 0, followers: 0, shares: 0, saves: 0 };
  const weeklyData = data?.weeklyData || [];
  const topPosts = data?.topPosts || [];

  const totalInteractions = (statsData.likes || 0) + (statsData.comments || 0) + (statsData.shares || 0) + (statsData.saves || 0);
  const engagementRate = statsData.followers > 0 ? ((totalInteractions / statsData.followers) * 100).toFixed(1) : "0";
  const maxActivity = Math.max(...weeklyData.map((d) => (d.likes || 0) + (d.comments || 0)), 10);

  const stats = [
    { label: "Total Posts", value: formatNumber(statsData.posts), icon: Eye, color: "from-amber-500 to-yellow-400" },
    { label: "Total Likes", value: formatNumber(statsData.likes), icon: Heart, color: "from-red-500 to-orange-500" },
    { label: "Comments", value: formatNumber(statsData.comments), icon: MessageCircle, color: "from-emerald-500 to-teal-500" },
    { label: "Followers", value: formatNumber(statsData.followers), icon: Users, color: "from-green-500 to-emerald-500" },
    { label: "Shares", value: formatNumber(statsData.shares), icon: Share2, color: "from-orange-500 to-amber-500" },
    { label: "Saves", value: formatNumber(statsData.saves), icon: Bookmark, color: "from-amber-600 to-yellow-500" },
  ];

  return (
    <div className="flex h-screen bg-black text-foreground overflow-hidden">

      {/* ✅ SIDEBAR (Hidden on Mobile, Visible on MD+) */}
      <div className="hidden md:flex w-64 flex-col border-r border-white/10 bg-black h-full">
        <Sidebar />
      </div>

      {/* ✅ MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full relative overflow-y-auto scrollbar-hide bg-background">

        {/* Header */}
        <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/5 p-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-display font-bold bg-linear-to-r from-amber-400 to-emerald-400 bg-clip-text text-transparent">
              Activity & Insights
            </h1>
            <p className="text-xs text-muted-foreground">Your performance overview</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto w-full pb-24 md:pb-8">

          {/* 1. Engagement Overview */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong p-6 md:p-8 rounded-3xl border border-white/10 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
              <Activity className="w-40 h-40 text-primary" />
            </div>

            <div className="relative z-10">
              <h2 className="text-lg font-semibold text-foreground mb-1">Engagement Rate</h2>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold text-white tracking-tight">{engagementRate}%</span>
                <span className="text-sm font-medium text-green-400 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3" /> +2.4%
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-3 max-w-sm">
                Based on likes, comments, and saves relative to your follower count.
              </p>
            </div>
          </motion.div>

          {/* 2. Key Statistics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="glass p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all bg-white/5"
              >
                <div className={`w-10 h-10 rounded-xl bg-linear-to-r ${stat.color} flex items-center justify-center mb-4 shadow-lg shadow-black/40`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* 3. Weekly Activity Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 glass-strong p-6 rounded-3xl border border-white/10 bg-[#0a0a0a]"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Weekly Activity</h3>
                  <p className="text-xs text-muted-foreground">Interactions over the last 7 days</p>
                </div>
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <div className="h-48 flex items-end gap-3 md:gap-4">
                {weeklyData.length > 0 ? (
                  weeklyData.map((d, index) => {
                    const heightPercent = ((d.likes + d.comments) / maxActivity) * 100;
                    return (
                      <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                        <div className="w-full relative flex items-end h-full bg-white/5 rounded-t-lg overflow-hidden">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPercent}%` }}
                            transition={{ delay: index * 0.1, duration: 0.8, type: "spring" }}
                            className="w-full bg-linear-to-t from-primary/50 to-primary rounded-t-lg relative min-h-1 group-hover:from-primary group-hover:to-amber-400 transition-all"
                          >
                            {/* Tooltip */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-800 border border-white/10 text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-10">
                              <span className="font-bold">{d.likes}</span> Likes <br />
                              <span className="font-bold">{d.comments}</span> Comments
                            </div>
                          </motion.div>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium group-hover:text-white transition-colors">{d.day}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    No activity data available yet.
                  </div>
                )}
              </div>
            </motion.div>

            {/* 4. Top Posts (Sidebar style on large screens) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-strong p-6 rounded-3xl border border-white/10 bg-[#0a0a0a]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Top Posts</h3>
              </div>

              <div className="space-y-3">
                {topPosts.slice(0, 3).map((post, index) => (
                  <motion.div
                    key={post.id}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5"
                  >
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                      <img src={post.image} alt="Top" className="w-full h-full object-cover" />
                      <div className="absolute top-0 left-0 bg-black/50 text-[10px] text-white px-1.5 py-0.5 rounded-br-lg font-bold">
                        #{index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-1">
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3 fill-white/20" /> {formatNumber(post.likes)}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {formatNumber(post.comments)}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${Math.min((post.likes / (topPosts[0]?.likes || 1)) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </motion.div>
                ))}
                {topPosts.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No posts yet.</p>}
              </div>
            </motion.div>

          </div>

        </div>
      </div>
    </div>
  );
}