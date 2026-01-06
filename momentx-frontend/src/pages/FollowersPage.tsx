import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, UserPlus, UserCheck, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { api } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface UserProfile {
  _id: string;
  name: string;
  username: string;
  profilePic: string;
  isVerified: boolean;
}

export default function FollowersPage() {
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();
  const { type } = useParams<{ type: "followers" | "following" }>();

  const [activeTab, setActiveTab] = useState<"followers" | "following" | "suggestions">(type || "followers");
  const [data, setData] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [followingIds, setFollowingIds] = useState<string[]>([]);

  // 1. Initialize following list
  useEffect(() => {
    const userWithFollowing = currentUser as any;
    if (userWithFollowing?.following) {
      const ids = userWithFollowing.following.map((u: any) => typeof u === 'object' ? u._id : u);
      setFollowingIds(ids);
    }
  }, [currentUser]);

  // 2. ✅ FIXED FETCH DATA FUNCTION
  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);

    try {
      let endpoint = "";
      let rawData: any[] = [];

      // ------------------------------------------------------
      // STEP 1: Determine Endpoint & Fetch
      // ------------------------------------------------------
      if (activeTab === "followers") {
        endpoint = `/users/followers/${currentUser._id}`;
      } else if (activeTab === "following") {
        endpoint = `/users/following/${currentUser._id}`;
      } else if (activeTab === "suggestions") {
        endpoint = `/users/all`;
      }

      const res = await api.get(endpoint);

    
      if (activeTab === "followers") {
       
        rawData = res.data.data || res.data.followers || (Array.isArray(res.data) ? res.data : []);

      } else if (activeTab === "following") {
       
        rawData = res.data.data || res.data.following || (Array.isArray(res.data) ? res.data : []);

      } else if (activeTab === "suggestions") {
       
        rawData = res.data.message || res.data.users || (Array.isArray(res.data) ? res.data : []);
      }

      let users: UserProfile[] = Array.isArray(rawData) ? rawData : [];

      // Specific filtering for Suggestions
      if (activeTab === "suggestions") {
        users = users.filter((u: UserProfile) => {
          if (!u || !u._id) return false;
          // Remove Myself
          if (u._id === currentUser._id) return false;
          // Remove people I already follow
          if (followingIds.includes(u._id)) return false;
          return true;
        });
      }

      setData(users);
    } catch (error) {
      console.error(`Failed to fetch ${activeTab}`, error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, currentUser]);

  // 3. Handle Follow Toggle
  const handleFollow = async (targetId: string) => {
    const isCurrentlyFollowing = followingIds.includes(targetId);

    setFollowingIds(prev =>
      isCurrentlyFollowing
        ? prev.filter(id => id !== targetId)
        : [...prev, targetId]
    );

    try {
      await api.post(`/users/follow/${targetId}`);
      refreshUser();
    } catch (error) {
      toast.error("Action failed");
      setFollowingIds(prev =>
        isCurrentlyFollowing ? [...prev, targetId] : prev.filter(id => id !== targetId)
      );
    }
  };

  const filteredData = data.filter(user =>
    user &&
    (user.name?.toLowerCase().includes(query.toLowerCase()) ||
      user.username?.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 glass-strong p-4"
      >
        <div className="flex items-center gap-4 mb-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-2 glass rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <h1 className="text-xl font-display font-bold">Connections</h1>
        </div>

        <div className="flex gap-2 mb-4">
          {(["followers", "following", "suggestions"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${activeTab === tab
                ? "bg-linear-to-r from-indigo-500 to-purple-600 text-white"
                : "glass hover:bg-white/10"
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 bg-secondary/30 border-none"
          />
        </div>
      </motion.div>

      <div className="p-4 space-y-3">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-10"
            >
              <Loader2 className="animate-spin text-primary w-8 h-8" />
            </motion.div>
          ) : filteredData.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground text-center">
                {activeTab === 'suggestions'
                  ? "No new suggestions available."
                  : activeTab === 'followers'
                    ? "You don't have followers yet."
                    : "You aren't following anyone yet."}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {filteredData.map((user) => {
                const isFollowing = followingIds.includes(user._id);
                return (
                  <div key={user._id} className="flex items-center gap-3 p-3 glass rounded-2xl">
                    {/* ✅ FIXED TS ERROR: src={... || ""} */}
                    <AvatarRing
                      src={user.profilePic}
                      size="md"
                      alt={user.username}
                      hasStory={false}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold truncate">{user.name}</span>
                        {user.isVerified && (
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-white text-[8px]">✓</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                    </div>

                    {currentUser?._id !== user._id && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleFollow(user._id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isFollowing
                          ? "bg-secondary text-foreground border border-border"
                          : "bg-linear-to-r from-indigo-500 to-purple-600 text-white"
                          }`}
                      >
                        <span className="flex items-center gap-1">
                          {isFollowing ? (
                            <>
                              <UserCheck className="w-4 h-4" />
                              Following
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              Follow
                            </>
                          )}
                        </span>
                      </motion.button>
                    )}
                  </div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}