import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, X, Hash, Loader2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { BackButton } from "@/components/navigation/BackButton";
import { api } from "@/lib/axios";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/navigation/MainLayout";

// Types
interface SearchUser {
  _id: string;
  name: string;
  username: string;
  profilePic: string;
  isVerified: boolean;
}

interface SearchTag {
  tag: string;
  count: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"accounts" | "tags">("accounts");

  // Data State
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [tags, setTags] = useState<SearchTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debounce Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        performSearch();
      } else {
        setUsers([]);
        setTags([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, activeTab]);

  const performSearch = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "accounts") {
        // ✅ API Call: Search by username/name
        const { data } = await api.get(`/users/search?query=${query}`);
        setUsers(data.data || []);
      } else {
        // API Call: Search by hashtag
        const { data } = await api.get(`/posts/search/tags?query=${query}`);
        setTags(data.data || []);
      }
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <MainLayout>
        <div className="min-h-screen bg-background pb-20 md:pb-0">
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-0 z-40 glass-strong p-4 space-y-4"
          >
            <div className="flex items-center gap-3">
              <BackButton />
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  variant="glass"
                  placeholder={activeTab === "accounts" ? "Search users..." : "Search hashtags..."}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-12 pr-10"
                />
                {query && (
                  <button
                    onClick={() => { setQuery(""); setUsers([]); setTags([]); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              {(["accounts", "tags"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === tab ? "bg-gradient-primary text-white" : "glass hover:bg-white/10"
                    }`}
                >
                  {tab === "accounts" ? "Accounts" : "Tags"}
                </button>
              ))}
            </div>
          </motion.div>

          <div className="p-4 space-y-6">

            {isLoading && (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            {!query && !isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Type to search for {activeTab}</p>
              </motion.div>
            )}

            {/* Results */}
            {!isLoading && query && (
              <div className="space-y-4">

                {/* USER RESULTS */}
                {activeTab === "accounts" && (
                  users.length > 0 ? (
                    <div className="space-y-2">
                      {users.map((user, index) => (
                        // ✅ FIX: Changed Link to use username (/u/username)
                        <Link to={`/u/${user.username}`} key={user._id}>
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-3 glass rounded-xl hover:bg-white/10 transition-colors cursor-pointer mb-2"
                          >
                            <div className="flex items-center gap-3">
                              <AvatarRing src={user.profilePic} size="sm" />
                              <div>
                                <p className="font-semibold">{user.username}</p>
                                <p className="text-sm text-muted-foreground">{user.name}</p>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </motion.div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">No users found.</p>
                  )
                )}

                {/* HASHTAG RESULTS */}
                {activeTab === "tags" && (
                  tags.length > 0 ? (
                    <div className="space-y-2">
                      {tags.map((item, index) => (
                        <Link to={`/explore?tag=${item.tag}`} key={index}>
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-3 glass rounded-xl hover:bg-white/10 transition-colors cursor-pointer mb-2"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                                <Hash className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="font-bold text-base">#{item.tag}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.count} {item.count === 1 ? 'post' : 'posts'}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </motion.div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">No hashtags found.</p>
                  )
                )}

              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </>
  );
}