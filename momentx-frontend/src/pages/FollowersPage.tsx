import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, UserPlus, UserCheck, Loader2 } from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";
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

type TabType = "followers" | "following" | "suggestions";

export default function FollowersPage() {
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();

  // Handle both params: `type` (followers/following) and optional `id` (if viewing someone else)
  const { type, id } = useParams<{ type?: string; id?: string }>();

  // Safely default the tab if an invalid URL is entered
  const validTabs: TabType[] = ["followers", "following", "suggestions"];
  const initialTab: TabType = validTabs.includes(type as TabType) ? (type as TabType) : "followers";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [data, setData] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [followingIds, setFollowingIds] = useState<string[]>([]);

  // If no specific user ID is passed in the URL, default to the logged-in user
  const targetUserId = id || currentUser?._id;

  // Initialize following list for checking the Follow button status
  useEffect(() => {
    const userWithFollowing = currentUser as any;
    if (userWithFollowing?.following) {
      const ids = userWithFollowing.following.map((u: any) => typeof u === 'object' ? u._id : u);
      setFollowingIds(ids);
    }
  }, [currentUser]);

  // Fetch Data
  const fetchData = async () => {
    if (!targetUserId) return; // Wait until we have a valid User ID
    setLoading(true);

    try {
      let endpoint = "";

      if (activeTab === "followers") {
        endpoint = `/users/followers/${targetUserId}`;
      } else if (activeTab === "following") {
        endpoint = `/users/following/${targetUserId}`;
      } else if (activeTab === "suggestions") {
        // ✅ FETCH FROM YOUR FAST AGGREGATION ENDPOINT
        endpoint = `/explore/suggestions`; // Or `/users/suggestions` if you defined it there
      }

      // Safeguard against calling the base API (prevents the 404 error)
      if (!endpoint) {
        setLoading(false);
        return;
      }

      const res = await api.get(endpoint);
      let rawData: any[] = res.data?.data || [];

      // ✅ NORMALIZE DATA: Map the fields because your aggregation 
      // returns `displayName` and `avatar`, but our UI expects `name` and `profilePic`
      let users: UserProfile[] = rawData.map((u: any) => ({
        _id: u._id,
        name: u.name || u.displayName || "Unknown",
        username: u.username,
        profilePic: u.profilePic || u.avatar || "",
        isVerified: u.isVerified || false,
      }));

      // Extra frontend safety net to ensure we don't show currently followed users or ourselves
      if (activeTab === "suggestions" && currentUser) {
        users = users.filter((u: UserProfile) => {
          if (!u || !u._id) return false;
          if (u._id === currentUser._id) return false;
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
  }, [activeTab, targetUserId, followingIds.length]);

  // Handle Follow Toggle
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
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
                    ? "No followers to display here."
                    : "Not following anyone yet."}
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
                  <div key={user._id} className="flex items-center justify-between p-3 glass rounded-2xl">
                    <Link
                      to={`/u/${user.username}`}
                      className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                    >
                      <AvatarRing
                        src={user.profilePic}
                        size="md"
                        alt={user.username}
                        hasStory={false}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold truncate text-foreground">{user.name}</span>
                          {user.isVerified && (
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-white text-[8px]">✓</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                      </div>
                    </Link>

                    {currentUser?._id !== user._id && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.preventDefault();
                          handleFollow(user._id);
                        }}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ml-2 shrink-0 ${isFollowing
                          ? "bg-secondary text-foreground border border-border"
                          : "bg-linear-to-r from-indigo-500 to-purple-600 text-white"
                          }`}
                      >
                        <span className="flex items-center gap-1">
                          {isFollowing ? (
                            <>
                              <UserCheck className="w-4 h-4" />
                              <span className="hidden sm:inline">Following</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              <span className="hidden sm:inline">Follow</span>
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
