import { useState, useRef, useEffect } from "react";
import { Plus, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/axios";
import { Sidebar } from "@/components/navigation/Sidebar";
import { ReelCard, type Reel } from "@/components/reels/ReelCard";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/navigation/BottomNav";

export default function ReelsPage() {
  const navigate = useNavigate();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const { data } = await api.get("/reels/feed");
        setReels(data.data || []);
      } catch (error) {
        console.error("Failed to load reels", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReels();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const reelHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / reelHeight);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
        setCurrentIndex(newIndex);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [currentIndex, reels.length]);

  const scrollToReel = (direction: "up" | "down") => {
    const container = containerRef.current;
    if (!container) return;
    const newIndex = direction === "up" ? Math.max(0, currentIndex - 1) : Math.min(reels.length - 1, currentIndex + 1);
    container.scrollTo({ top: newIndex * container.clientHeight, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black flex overflow-hidden relative">

      {/* ✅ Normal Sidebar (No hover expand) */}
      <div className="hidden lg:block w-64 border-r border-white/10 bg-black z-50">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 relative h-full w-full">
        {reels.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white gap-4">
            <p>No reels found.</p>
            <button onClick={() => navigate("/reels/create")} className="px-6 py-2 bg-white text-black rounded-full font-bold">Create First Reel</button>
          </div>
        ) : (
          <div ref={containerRef} className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide pb-16 md:pb-0">
            {reels.map((reel, index) => (
              <div key={reel._id} className="h-full w-full snap-start snap-always">
                <ReelCard
                  reel={reel}
                  isActive={index === currentIndex}
                  muted={muted}
                  onToggleMute={() => setMuted(!muted)}
                />
              </div>
            ))}
          </div>
        )}

        <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col gap-4 z-40">
          <button onClick={() => scrollToReel("up")} disabled={currentIndex === 0} className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-all", currentIndex === 0 ? "bg-white/5 text-white/20 cursor-not-allowed" : "bg-white/10 hover:bg-white/20 text-white backdrop-blur-md")}>
            <ChevronUp className="w-6 h-6" />
          </button>
          <button onClick={() => scrollToReel("down")} disabled={currentIndex === reels.length - 1} className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-all", currentIndex === reels.length - 1 ? "bg-white/5 text-white/20 cursor-not-allowed" : "bg-white/10 hover:bg-white/20 text-white backdrop-blur-md")}>
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>

        <div className="hidden lg:block absolute top-6 right-10 z-40">
          <button onClick={() => navigate("/reels/create")} className="p-3 bg-linear-to-r from-pink-500 to-violet-500 rounded-full shadow-lg hover:shadow-pink-500/20">
            <Plus className="w-6 h-6 text-white" />
          </button>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}