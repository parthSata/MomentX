import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, TrendingUp, Users, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { users as mockUsers } from "@/data/mockData";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { BackButton } from "@/components/navigation/BackButton";

const recentSearches = [
  { id: 1, type: "user", value: "sarah_design", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
  { id: 2, type: "hashtag", value: "photography" },
  { id: 3, type: "user", value: "alex_photos", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
  { id: 4, type: "hashtag", value: "travel" },
];

const trendingHashtags = [
  { tag: "momentx", posts: "2.4M" },
  { tag: "photography", posts: "1.8M" },
  { tag: "sunset", posts: "1.2M" },
  { tag: "lifestyle", posts: "980K" },
  { tag: "fashion", posts: "750K" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"top" | "accounts" | "tags">("top");
  const [searches, setSearches] = useState(recentSearches);

  const filteredUsers = mockUsers.filter(user => user.username.toLowerCase().includes(query.toLowerCase()) || user.displayName.toLowerCase().includes(query.toLowerCase()));
  const filteredHashtags = trendingHashtags.filter(h => h.tag.toLowerCase().includes(query.toLowerCase()));
  const removeSearch = (id: number) => setSearches(searches.filter(s => s.id !== id));
  const clearAll = () => setSearches([]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="sticky top-0 z-40 glass-strong p-4 space-y-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input variant="glass" placeholder="Search users, hashtags..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-12 pr-10" />
            {query && <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2"><X className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /></button>}
          </div>
        </div>
        <div className="flex gap-2">
          {(["top", "accounts", "tags"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === tab ? "bg-gradient-primary text-white" : "glass hover:bg-white/10"}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="p-4 space-y-6">
        {!query && searches.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent</h3>
              <button onClick={clearAll} className="text-sm text-primary hover:text-primary/80 transition-colors">Clear all</button>
            </div>
            <div className="space-y-3">
              <AnimatePresence>
                {searches.map((search, index) => (
                  <motion.div key={search.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ delay: index * 0.05 }} className="flex items-center justify-between p-3 glass rounded-xl hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      {search.type === "user" ? <AvatarRing src={search.avatar || ""} size="sm" /> : <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center"><Hash className="w-5 h-5 text-white" /></div>}
                      <span className="font-medium">{search.type === "hashtag" ? "#" : ""}{search.value}</span>
                    </div>
                    <button onClick={() => removeSearch(search.id)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-4 h-4" /></button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {!query && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-primary" /><h3 className="font-semibold">Trending</h3></div>
            <div className="grid grid-cols-2 gap-3">
              {trendingHashtags.map((hashtag, index) => (
                <motion.div key={hashtag.tag} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} whileHover={{ scale: 1.02 }} className="p-4 glass rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                  <p className="font-semibold text-primary">#{hashtag.tag}</p>
                  <p className="text-sm text-muted-foreground">{hashtag.posts} posts</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {query && (
          <div className="space-y-4">
            {(activeTab === "top" || activeTab === "accounts") && filteredUsers.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center gap-2 mb-3"><Users className="w-5 h-5 text-primary" /><h3 className="font-semibold">Accounts</h3></div>
                <div className="space-y-2">
                  {filteredUsers.map((user, index) => (
                    <motion.div key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="flex items-center justify-between p-3 glass rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3"><AvatarRing src={user.avatar} size="sm" /><div><p className="font-semibold">{user.username}</p><p className="text-sm text-muted-foreground">{user.displayName}</p></div></div>
                      <button className="px-4 py-1.5 bg-gradient-primary text-white text-sm font-medium rounded-full hover:opacity-90 transition-opacity">Follow</button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {(activeTab === "top" || activeTab === "tags") && filteredHashtags.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <div className="flex items-center gap-2 mb-3"><Hash className="w-5 h-5 text-primary" /><h3 className="font-semibold">Hashtags</h3></div>
                <div className="space-y-2">
                  {filteredHashtags.map((hashtag, index) => (
                    <motion.div key={hashtag.tag} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="flex items-center justify-between p-3 glass rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center"><Hash className="w-5 h-5 text-white" /></div><div><p className="font-semibold">#{hashtag.tag}</p><p className="text-sm text-muted-foreground">{hashtag.posts} posts</p></div></div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}