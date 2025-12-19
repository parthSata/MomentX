import { useState, useRef } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { Heart, MessageCircle, Send, Bookmark, Music2, MoreHorizontal, Volume2, VolumeX, Plus } from "lucide-react";
import { AvatarRing } from "@/components/ui/avatar-ring";

const reels = [
  {
    id: 1,
    user: {
      username: "travel_mike",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      isVerified: true,
    },
    video: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600",
    caption: "Exploring the mountains 🏔️ #travel #adventure",
    music: "Original Audio - travel_mike",
    likes: "45.2K",
    comments: "1.2K",
    shares: "890",
  },
  {
    id: 2,
    user: {
      username: "foodie_lisa",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      isVerified: false,
    },
    video: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600",
    caption: "Making the perfect pasta 🍝 #cooking #foodie",
    music: "Cooking Vibes - Chill Beats",
    likes: "23.8K",
    comments: "567",
    shares: "234",
  },
  {
    id: 3,
    user: {
      username: "fitness_emma",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      isVerified: true,
    },
    video: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600",
    caption: "Morning workout routine 💪 #fitness #gym",
    music: "Workout Mix - Gym Beats",
    likes: "67.5K",
    comments: "2.3K",
    shares: "1.5K",
  },
];

export default function ReelsPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [muted, setMuted] = useState(true);
  const [showHeart, setShowHeart] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSwipe = (info: PanInfo) => {
    if (info.offset.y < -50 && currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (info.offset.y > 50 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleDoubleTap = (id: number) => {
    setLiked({ ...liked, [id]: true });
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
  };

  const currentReel = reels[currentIndex];

  return (
    <div ref={containerRef} className="h-screen bg-black overflow-hidden relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentReel.id}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          onDragEnd={(_, info) => handleSwipe(info)}
          onDoubleClick={() => handleDoubleTap(currentReel.id)}
          className="absolute inset-0"
        >
          {/* Background Image/Video */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${currentReel.video})` }}
          >
            <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/60" />
          </div>

          {/* Double Tap Heart */}
          <AnimatePresence>
            {showHeart && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
              >
                <Heart className="w-32 h-32 text-white fill-white drop-shadow-glow" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content Overlay */}
          <div className="absolute inset-0 flex">
            {/* Left Side - User Info */}
            <div className="flex-1 flex flex-col justify-end p-4 pb-24 md:pb-8">
              {/* User Info */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 mb-4"
              >
                <AvatarRing src={currentReel.user.avatar} hasStory size="md" />
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-white">{currentReel.user.username}</span>
                    {currentReel.user.isVerified && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[10px]">✓</span>
                      </div>
                    )}
                  </div>
                </div>
                <button className="px-4 py-1.5 border border-white/50 text-white text-sm font-medium rounded-lg hover:bg-white/10 transition-colors">
                  Follow
                </button>
              </motion.div>

              {/* Caption */}
              <motion.p
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white text-sm mb-3 max-w-[80%]"
              >
                {currentReel.caption}
              </motion.p>

              {/* Music */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-2"
              >
                <Music2 className="w-4 h-4 text-white" />
                <div className="flex items-center gap-2 overflow-hidden">
                  <motion.span
                    animate={{ x: [-100, 0] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="text-white text-sm whitespace-nowrap"
                  >
                    {currentReel.music}
                  </motion.span>
                </div>
              </motion.div>
            </div>

            {/* Right Side - Actions */}
            <div className="flex flex-col items-center justify-end gap-6 p-4 pb-24 md:pb-8">
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setLiked({ ...liked, [currentReel.id]: !liked[currentReel.id] })}
                className="flex flex-col items-center gap-1"
              >
                <motion.div
                  animate={liked[currentReel.id] ? { scale: [1, 1.3, 1] } : {}}
                >
                  <Heart className={`w-8 h-8 ${liked[currentReel.id] ? "text-red-500 fill-red-500" : "text-white"}`} />
                </motion.div>
                <span className="text-white text-xs">{currentReel.likes}</span>
              </motion.button>

              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1"
              >
                <MessageCircle className="w-8 h-8 text-white" />
                <span className="text-white text-xs">{currentReel.comments}</span>
              </motion.button>

              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 }}
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1"
              >
                <Send className="w-8 h-8 text-white" />
                <span className="text-white text-xs">{currentReel.shares}</span>
              </motion.button>

              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSaved({ ...saved, [currentReel.id]: !saved[currentReel.id] })}
              >
                <Bookmark className={`w-8 h-8 ${saved[currentReel.id] ? "text-white fill-white" : "text-white"}`} />
              </motion.button>

              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6 }}
                whileTap={{ scale: 0.9 }}
              >
                <MoreHorizontal className="w-8 h-8 text-white" />
              </motion.button>

              {/* Music Disc */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 rounded-full border-2 border-white/30 overflow-hidden"
              >
                <img src={currentReel.user.avatar} alt="Music" className="w-full h-full object-cover" />
              </motion.div>
            </div>
          </div>

          {/* Mute Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setMuted(!muted)}
            className="absolute top-4 right-4 p-2 glass rounded-full z-50"
          >
            {muted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
          </motion.button>

          {/* Progress Indicators */}
          <div className="absolute top-16 left-0 right-0 flex gap-1 px-4">
            {reels.map((_, index) => (
              <div
                key={index}
                className={`h-0.5 flex-1 rounded-full transition-colors ${index <= currentIndex ? "bg-white" : "bg-white/30"
                  }`}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Create Reel Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="absolute bottom-24 md:bottom-8 right-4 p-4 bg-gradient-primary rounded-full shadow-glow z-50"
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>
    </div>
  );
}
