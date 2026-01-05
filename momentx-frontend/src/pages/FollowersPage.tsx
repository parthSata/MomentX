import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, UserPlus, UserCheck, Clock } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { AvatarRing } from "@/components/ui/avatar-ring";

const followers = [ 
  { id: 1, name: "Sarah Design", username: "sarah_design", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", isFollowing: true, isVerified: true },
  { id: 2, name: "Alex Photos", username: "alex_photos", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", isFollowing: false, isVerified: false },
  { id: 3, name: "Emma Wilson", username: "emma_w", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150", isFollowing: true, isVerified: true },
  { id: 4, name: "Mike Travel", username: "mike_travel", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", isFollowing: false, isVerified: true },
  { id: 5, name: "Lisa Art", username: "lisa_art", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150", isFollowing: true, isVerified: false },
];

const following = [
  { id: 1, name: "Photography Pro", username: "photo_pro", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150", isFollowing: true, isVerified: true },
  { id: 2, name: "Travel World", username: "travel_world", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150", isFollowing: true, isVerified: true },
  { id: 3, name: "Food Lover", username: "food_lover", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150", isFollowing: true, isVerified: false },
];

const suggestions = [
  { id: 1, name: "Nature Hub", username: "nature_hub", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150", mutualFollowers: 12 },
  { id: 2, name: "Art Gallery", username: "art_gallery", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150", mutualFollowers: 8 },
  { id: 3, name: "Music Vibes", username: "music_vibes", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150", mutualFollowers: 5 },
];

export default function FollowersPage() {
  const navigate = useNavigate();
  const { type } = useParams<{ type: "followers" | "following" }>();
  const [activeTab, setActiveTab] = useState<"followers" | "following" | "suggestions">(type || "followers");
  const [query, setQuery] = useState("");
  const [followState, setFollowState] = useState<Record<number, "follow" | "following" | "requested">>({});

  const handleFollow = (id: number) => {
    setFollowState(prev => {
      const current = prev[id];
      if (!current || current === "follow") return { ...prev, [id]: "following" };
      return { ...prev, [id]: "follow" };
    });
  };

  const getButtonState = (id: number, isFollowing: boolean) => {
    return followState[id] || (isFollowing ? "following" : "follow");
  };

  const data = activeTab === "followers" ? followers : activeTab === "following" ? following : suggestions;
  const filtered = data.filter(user =>
    user.name.toLowerCase().includes(query.toLowerCase()) ||
    user.username.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
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

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(["followers", "following", "suggestions"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-gradient-primary text-white"
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
            variant="glass"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12"
          />
        </div>
      </motion.div>

      <div className="p-4 space-y-3">
        <AnimatePresence mode="wait">
          {filtered.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-3 glass rounded-2xl"
            >
              <AvatarRing src={user.avatar} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-semibold truncate">{user.name}</span>
                  {"isVerified" in user && user.isVerified && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-[8px]">✓</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                {"mutualFollowers" in user && (
                  <p className="text-xs text-muted-foreground">{user.mutualFollowers} mutual followers</p>
                )}
              </div>
              {"isFollowing" in user && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleFollow(user.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    getButtonState(user.id, user.isFollowing) === "following"
                      ? "glass"
                      : getButtonState(user.id, user.isFollowing) === "requested"
                      ? "glass text-muted-foreground"
                      : "bg-gradient-primary text-white"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {getButtonState(user.id, user.isFollowing) === "following" ? (
                      <>
                        <UserCheck className="w-4 h-4" />
                        Following
                      </>
                    ) : getButtonState(user.id, user.isFollowing) === "requested" ? (
                      <>
                        <Clock className="w-4 h-4" />
                        Requested
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
              {"mutualFollowers" in user && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleFollow(user.id)}
                  className="px-4 py-2 bg-gradient-primary text-white rounded-full text-sm font-medium"
                >
                  <span className="flex items-center gap-1">
                    <UserPlus className="w-4 h-4" />
                    Follow
                  </span>
                </motion.button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-primary/20 flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground text-center">
              Try searching for a different name or username
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
