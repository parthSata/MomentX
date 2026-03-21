import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, Check, UserPlus, Compass, RefreshCcw } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { MainLayout } from "@/components/navigation/MainLayout";
import { StoriesBar, type StoriesBarRef } from "@/components/feed/StoriesBar";
import { PostCard } from "@/components/feed/PostCard";
import { StoryViewer } from "@/components/feed/StoryViewer";
import { Button } from "@/components/ui/button";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { api } from "@/lib/axios";
import { useStories } from "@/hooks/useStories";
import { useAuth } from "@/context/AuthContext";
import type { Post } from "@/types";
import { toast } from "sonner";

export default function HomePage() {
  const navigate = useNavigate();
  const { user: currentUser, loading: authLoading, refreshUser } = useAuth();
  const { stories, markAsViewed, deleteStory, replyStory, likeStory, fetchStories } = useStories();
  const storiesBarRef = useRef<StoriesBarRef>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  // Fetch randomized suggestions
  const fetchSuggestions = async () => {
    try {
      const { data } = await api.get("/explore/suggestions");
      setSuggestions(data.data || []);
    } catch (e) {
      console.error("Failed to fetch suggestions", e);
      setSuggestions([]);
    }
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get(`/posts/feed?page=${page}&limit=5`);
      if (data?.data?.posts) {
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p._id));
          const uniqueNewPosts = data.data.posts.filter((p: Post) => !existingIds.has(p._id));
          return [...prev, ...uniqueNewPosts];
        });
        setHasMore(data.data.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to fetch feed", error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and pagination
  useEffect(() => {
    fetchPosts();
  }, [page]);

  // Initial suggestions fetch
  useEffect(() => {
    if (currentUser && suggestions.length === 0) {
      fetchSuggestions();
    }
  }, [currentUser]);

  const handleFollow = async (userId: string) => {
    try {
      await api.post(`/users/follow/${userId}`);
      toast.success("Following user");
      setSuggestions((prev) => prev.filter((u) => u._id !== userId));
      await refreshUser();
    } catch (e) {
      toast.error("Action failed");
    }
  };

  // ✅ COMPREHENSIVE VIEW: Include ALL stories, including OWNER'S
  const viewerStories = stories;

  const handleStoryClick = (storyId: string) => {
    // Open viewer for ANY story that exists in the feed
    const index = viewerStories.findIndex((s) => s._id === storyId);
    if (index !== -1) {
      setSelectedStoryIndex(index);
      setStoryViewerOpen(true);
    }
  };

  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) setPage((prev) => prev + 1);
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore]
  );

  // ✅ COMPONENT: Suggestion Section to be injected
  const SuggestionsRow = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-4 my-2"
    >
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary" />
          <h4 className="text-base font-bold text-foreground font-display">Discover People</h4>
        </div>
        <button onClick={fetchSuggestions} className="text-muted-foreground hover:text-primary transition-colors">
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide snap-x">
        {suggestions.map((user) => (
          <motion.div
            key={user._id}
            whileHover={{ y: -5 }}
            className="min-w-44 sm:min-w-48 glass rounded-4xl p-6 flex flex-col items-center border border-white/5 shadow-xl snap-start relative overflow-hidden"
          >
            <Link to={`/u/${user.username}`} className="relative mb-4 group">
              <AvatarRing src={user.avatar} size="xl" />
            </Link>

            <div className="text-center w-full mb-5">
              <p className="text-sm font-bold truncate leading-tight">{user.displayName || user.username}</p>
              <p className="text-[10px] text-muted-foreground truncate mt-1">
                {user.followers} Followers
              </p>
            </div>

            <Button
              size="sm"
              className="w-full rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs h-10 shadow-lg transition-all active:scale-95"
              onClick={() => handleFollow(user._id)}
            >
              Follow
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  return (
    <MainLayout>
      <div className="space-y-6 pb-20">
        <StoriesBar
          ref={storiesBarRef}
          stories={stories}
          onStoryClick={handleStoryClick}
          currentUser={currentUser}
          onUploadSuccess={() => fetchStories()}
        />

        <div className="space-y-6">
          {posts.length > 0 ? (
            posts.map((post, index) => (
              <div key={post._id}>
                <motion.div
                  ref={index === posts.length - 1 ? lastPostElementRef : null}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <PostCard post={post} />
                </motion.div>

                {/* ✅ LOGIC: Show suggestions after the 2nd post on every page load */}
                {/* Or use (index + 1) % 5 === 0 to show it every 5 posts */}
                {index === 2 && suggestions.length > 0 && <SuggestionsRow />}
              </div>
            ))
          ) : (
            !isLoading && (
              <div className="space-y-8 px-4">
                {/* Show suggestions if they exist */}
                {suggestions.length > 0 && <SuggestionsRow />}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-20 px-8 text-center glass rounded-3xl border border-white/10"
                >
                  <div className="w-20 h-20 bg-linear-to-tr from-amber-500/10 to-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                    <UserPlus className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 font-display text-foreground">Your Feed is Quiet</h3>
                  <p className="text-muted-foreground text-sm max-w-62.5 mb-8">
                    Follow more people or explore trending content to fill your feed with moments.
                  </p>
                  <Button
                    onClick={() => navigate("/search")}
                    variant="secondary"
                    className="rounded-full px-10 h-12 font-bold shadow-lg"
                  >
                    Find Friends
                  </Button>
                </motion.div>
              </div>
            )
          )}

          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary w-8 h-8" />
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <div className="flex flex-col items-center py-12 opacity-50">
              <div className="w-12 h-12 rounded-full border border-green-500/30 flex items-center justify-center mb-3">
                <Check className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-sm font-bold tracking-wide">You're all caught up</p>
            </div>
          )}
        </div>
      </div>

      {!authLoading && (
        <StoryViewer
          isOpen={storyViewerOpen}
          onClose={() => setStoryViewerOpen(false)}
          initialIndex={selectedStoryIndex}
          stories={viewerStories}
          onViewStory={markAsViewed}
          onDeleteStory={deleteStory}
          onReplyStory={async (id, msg) => {
            await replyStory(id, msg);
          }}
          onAddStory={() => {
            setStoryViewerOpen(false);
            storiesBarRef.current?.triggerUpload();
          }}
          onLikeStory={likeStory}
          currentUserId={currentUser?._id}
        />
      )}
    </MainLayout>
  );
}