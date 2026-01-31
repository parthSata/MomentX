import { motion } from "framer-motion";
import { TrendingUp, Users, Heart, MessageCircle, Eye, Share2, Bookmark } from "lucide-react";

const stats = [
  { label: "Total Posts", value: "156", icon: Eye, color: "from-blue-500 to-cyan-500" },
  { label: "Total Likes", value: "45.2K", icon: Heart, color: "from-red-500 to-pink-500" },
  { label: "Comments", value: "8.9K", icon: MessageCircle, color: "from-purple-500 to-violet-500" },
  { label: "Followers", value: "12.4K", icon: Users, color: "from-green-500 to-emerald-500" },
  { label: "Shares", value: "2.3K", icon: Share2, color: "from-orange-500 to-amber-500" },
  { label: "Saves", value: "5.6K", icon: Bookmark, color: "from-indigo-500 to-purple-500" },
];

const weeklyData = [
  { day: "Mon", likes: 450, comments: 120, shares: 45 },
  { day: "Tue", likes: 680, comments: 180, shares: 67 },
  { day: "Wed", likes: 520, comments: 150, shares: 52 },
  { day: "Thu", likes: 890, comments: 220, shares: 89 },
  { day: "Fri", likes: 720, comments: 190, shares: 72 },
  { day: "Sat", likes: 1100, comments: 280, shares: 110 },
  { day: "Sun", likes: 950, comments: 240, shares: 95 },
];

const topPosts = [
  { id: 1, image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=300", likes: "12.5K", comments: "890" },
  { id: 2, image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300", likes: "8.9K", comments: "567" },
  { id: 3, image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300", likes: "7.2K", comments: "423" },
];

export default function ActivityPage() {
  const maxLikes = Math.max(...weeklyData.map(d => d.likes));

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 glass-strong p-4"
      >
        <h1 className="text-2xl font-display font-bold gradient-text">Activity Dashboard</h1>
        <p className="text-muted-foreground">Your performance insights</p>
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
              <h3 className="text-2xl font-bold">{stat.value}</h3>
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
            <h3 className="text-lg font-semibold">Weekly Performance</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-primary" />
                <span className="text-muted-foreground">Likes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-violet-500" />
                <span className="text-muted-foreground">Comments</span>
              </div>
            </div>
          </div>

          <div className="h-48 flex items-end gap-2">
            {weeklyData.map((data, index) => (
              <div key={data.day} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.likes / maxLikes) * 100}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="w-full bg-gradient-primary rounded-t-lg relative group cursor-pointer"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-background rounded text-xs whitespace-nowrap"
                  >
                    {data.likes} likes
                  </motion.div>
                </motion.div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            {weeklyData.map((data) => (
              <span key={data.day} className="flex-1 text-center">{data.day}</span>
            ))}
          </div>
        </motion.div>

        {/* Follower Growth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-strong p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Follower Growth</h3>
            <div className="flex items-center gap-1 text-green-500">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">+24.5%</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "75%" }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-gradient-primary rounded-full"
                />
              </div>
            </div>
            <span className="text-sm text-muted-foreground">12.4K / 16K goal</span>
          </div>
        </motion.div>

        {/* Top Posts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold mb-4">Top Performing Posts</h3>
          <div className="grid grid-cols-3 gap-3">
            {topPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
              >
                <img src={post.image} alt="Post" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <Heart className="w-4 h-4" />
                      <span className="text-sm font-medium">{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-1 justify-center">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">{post.comments}</span>
                    </div>
                  </div>
                </div>
                {index === 0 && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-primary rounded-full text-xs text-white font-medium">
                    #1
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Engagement Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-strong p-6 rounded-2xl"
        >
          <h3 className="text-lg font-semibold mb-4">Engagement Breakdown</h3>
          <div className="space-y-4">
            {[
              { label: "Likes", value: 65, color: "from-red-500 to-pink-500" },
              { label: "Comments", value: 22, color: "from-purple-500 to-violet-500" },
              { label: "Shares", value: 8, color: "from-blue-500 to-cyan-500" },
              { label: "Saves", value: 5, color: "from-green-500 to-emerald-500" },
            ].map((item, index) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                    className={`h-full bg-linear-to-r ${item.color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
