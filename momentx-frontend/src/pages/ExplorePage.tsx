import { useState } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Search, TrendingUp } from "lucide-react"
import { MainLayout } from "@/components/navigation/MainLayout"
import { AvatarRing } from "@/components/ui/avatar-ring"
import { posts, users, trendingHashtags } from "@/data/mockData"
import { cn } from "@/lib/utils"

export default function ExplorePage() {
  const [searchQuery] = useState("") // Removed unused setSearchQuery
  const [isSearching] = useState(false) // Removed unused setIsSearching

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "K"
    return num.toString()
  }

  // Masonry layout positions
  const gridItems = posts.concat(posts).slice(0, 12)
  const getGridClass = (index: number) => {
    const patterns = [
      "col-span-1 row-span-1",
      "col-span-1 row-span-2",
      "col-span-1 row-span-1",
      "col-span-2 row-span-1",
      "col-span-1 row-span-1",
      "col-span-1 row-span-1",
    ]
    return patterns[index % patterns.length]
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Search Bar */}
        <Link to="/search">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
            <div className="w-full h-12 pl-12 pr-12 glass rounded-xl flex items-center text-muted-foreground cursor-pointer hover:border-primary transition-all">
              Search users, hashtags...
            </div>
          </motion.div>
        </Link>

        {isSearching ? (
          <div>
            {/* Search Logic Placeholder */}
            {users.filter(u => u.username.includes(searchQuery)).map(u => (
              <div key={u.id}>{u.username}</div>
            ))}
          </div>
        ) : (
          <>
            {/* Trending Hashtags */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Trending</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingHashtags.slice(0, 8).map((hashtag, index) => (
                  <motion.button
                    key={hashtag.tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    className="px-4 py-2 rounded-full bg-muted/50 hover:bg-muted text-sm transition-colors"
                  >
                    <span className="text-primary">#</span>{hashtag.tag}
                    <span className="text-muted-foreground ml-2">{formatNumber(hashtag.posts)}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Suggested Users */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-4"
            >
              <h3 className="font-semibold mb-4">Suggested for You</h3>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                {users.slice(0, 5).map((user, index) => (
                  <motion.button
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    whileHover={{ y: -4 }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors shrink-0 w-32" // ✅ Fixed shrink-0
                  >
                    <AvatarRing src={user.avatar} alt={user.displayName} size="lg" />
                    <p className="font-semibold text-sm truncate w-full text-center">{user.username}</p>
                    <p className="text-xs text-muted-foreground">{formatNumber(user.followers)} followers</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Masonry Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-3 auto-rows-[150px] gap-1"
            >
              {gridItems.map((post, index) => (
                <motion.button
                  key={`${post.id}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.03 }}
                  whileHover={{ scale: 1.02 }}
                  className={cn(
                    "relative group overflow-hidden rounded-lg",
                    getGridClass(index)
                  )}
                >
                  <img
                    src={post.image}
                    alt={post.caption}
                    className="w-full h-full object-cover"
                  />
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </MainLayout>
  )
}