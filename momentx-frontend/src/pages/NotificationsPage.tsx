import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, UserPlus, Check, Settings, Loader2, PlayCircle, X, Trash2 } from "lucide-react";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { PageHeader } from "@/components/navigation/PageHeader";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNowStrict } from "date-fns";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/axios";
import { toast } from "sonner";
import { PostViewDialog } from "@/components/feed/PostViewDialog";
import { useAuth } from "@/context/AuthContext";

const getIcon = (type: string) => {
  switch (type) {
    case "like": return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
    case "comment": return <MessageCircle className="w-4 h-4 text-blue-500 fill-blue-500" />;
    case "follow": return <UserPlus className="w-4 h-4 text-green-500" />;
    default: return <Heart className="w-4 h-4" />;
  }
};

const getContentText = (type: string, notification: any) => {
  if (type === "like") {
    if (notification.story) return "liked your story";
    if (notification.reel || notification.post?.type === 'reel' || notification.post?.videoUrl || notification.post?.video) return "liked your reel";
    return "liked your post";
  }
  if (type === "comment") {
    if (notification.reel || notification.post?.type === 'reel' || notification.post?.videoUrl || notification.post?.video) return "commented on your reel";
    return "commented on your post";
  }
  if (type === "follow") return "started following you";
  return "interacted with you";
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();

  const { notifications, unreadCount, loading, markAllRead, deleteNotification, deleteAllNotifications } = useNotifications();

  const [followedBackIds, setFollowedBackIds] = useState<Set<string>>(new Set());
  const [viewPostData, setViewPostData] = useState<any | null>(null);
  const [isPostViewOpen, setIsPostViewOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => setIsSettingsOpen(false);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!loading && unreadCount > 0) {
      markAllRead();
    }
  }, [loading, unreadCount, markAllRead]);

  const handleNotificationClick = async (notif: any) => {
    if (notif.type === "follow" && notif.sender?.username) {
      navigate(`/u/${notif.sender.username}`);
    }
    else if ((notif.type === "like" || notif.type === "comment")) {
      try {
        if (notif.post?._id) {
          const { data } = await api.get(`/posts/${notif.post._id}`);
          setViewPostData(data.data);
          setIsPostViewOpen(true);
        } else if (notif.reel?._id) {
          const { data } = await api.get(`/reels/${notif.reel._id}`);
          setViewPostData({
            ...data.data,
            type: 'reel',
            videoUrl: data.data.videoUrl || data.data.video
          });
          setIsPostViewOpen(true);
        }
      } catch (error) {
        console.error("Failed to load content", error);
        toast.error("Content may have been deleted.");
      }
    }
  };

  const handleFollowBack = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    try {
      await api.post(`/users/follow/${userId}`);
      setFollowedBackIds(prev => new Set(prev).add(userId));
      toast.success("Followed back!");
      await refreshUser();
    } catch (err) {
      console.error(err);
      toast.error("Action failed");
    }
  };

  const handleDelete = (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    deleteNotification(notifId);
  };

  const handleDeleteAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to clear all notifications? This cannot be undone.")) {
      deleteAllNotifications();
      setIsSettingsOpen(false);
      toast.success("All notifications cleared");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 text-foreground">
      <PageHeader
        title="Notifications"
        rightContent={
          <div className="flex items-center gap-2">
            <motion.button
              onClick={markAllRead}
              className="p-2 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <Check className="w-5 h-5 text-foreground" />
            </motion.button>

            <div className="relative">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSettingsOpen(!isSettingsOpen);
                }}
                className="p-2 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <Settings className="w-5 h-5 text-foreground" />
              </motion.button>

              <AnimatePresence>
                {isSettingsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={handleDeleteAll}
                      disabled={notifications.length === 0}
                      className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete All
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        }
      />

      <div className="p-4">
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {notifications.length > 0 ? (
              notifications.map((notif: any, index) => {
                // FIXED: Using type casting or optional chaining to handle User type safety
                const isAlreadyFollowing = (currentUser as any)?.following?.includes(notif.sender?._id) || followedBackIds.has(notif.sender?._id);

                const mediaObj = notif.reel || notif.post;
                const isMediaReel = !!notif.reel || notif.post?.type === 'reel' || !!notif.post?.videoUrl || !!notif.post?.video;
                const mediaSrc = mediaObj?.thumbnail || mediaObj?.videoUrl || mediaObj?.video || mediaObj?.images?.[0] || mediaObj?.image;
                const isVideoUrl = mediaSrc?.match(/\.(mp4|webm|mov)/i);

                return (
                  <motion.div
                    key={notif._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors cursor-pointer hover:opacity-80 group ${!notif.isRead
                      ? "border-l-4 border-l-primary bg-primary/5 border-y-transparent border-r-transparent dark:border-y-white/5 dark:border-r-white/5"
                      : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10"
                      }`}
                  >
                    <div className="relative shrink-0">
                      <AvatarRing src={notif.sender?.profilePic} size="md" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background flex items-center justify-center border border-border shadow-sm">
                        {getIcon(notif.type)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 ml-1">
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">{notif.sender?.username}</span>
                        <span className="text-muted-foreground ml-1">{getContentText(notif.type, notif)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNowStrict(new Date(notif.createdAt), { addSuffix: true })}
                      </p>
                    </div>

                    {!notif.story && mediaObj && mediaSrc && (
                      <div className="relative shrink-0 w-10 h-10 rounded-lg overflow-hidden ml-2 border border-gray-200 dark:border-white/10 bg-black">
                        {isVideoUrl ? (
                          <video src={mediaSrc} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={mediaSrc} alt="Media" className="w-full h-full object-cover" />
                        )}
                        {isMediaReel && (
                          <div className="absolute inset-0 ml-2 flex items-center justify-center bg-black/30 rounded-lg">
                            <PlayCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    )}

                    {notif.story && (
                      <div className="relative shrink-0 w-10 h-10 rounded-lg overflow-hidden ml-2 border border-pink-500/30 bg-gray-100 dark:bg-black">
                        {notif.story.url ? (
                          notif.story.type === 'video' ?
                            <video src={notif.story.url} className="w-full h-full object-cover" muted /> :
                            <img src={notif.story.url} alt="Story" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-pink-500/20 flex items-center justify-center">
                            <PlayCircle className="w-5 h-5 text-pink-500" />
                          </div>
                        )}
                      </div>
                    )}

                    {notif.type === "follow" && !isAlreadyFollowing && (
                      <button
                        onClick={(e) => handleFollowBack(e, notif.sender._id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors ml-2 shrink-0"
                      >
                        Follow Back
                      </button>
                    )}

                    {notif.type === "follow" && isAlreadyFollowing && (
                      <span className="px-3 py-1.5 text-xs font-semibold text-muted-foreground ml-2 shrink-0 italic">
                        Following
                      </span>
                    )}

                    <button
                      onClick={(e) => handleDelete(e, notif._id)}
                      className="p-2 ml-1 shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors opacity-0 md:group-hover:opacity-100 md:opacity-0 focus:opacity-100 sm:opacity-100"
                      aria-label="Delete notification"
                    >
                      <X className="w-4 h-4" />
                    </button>

                  </motion.div>
                )
              })
            ) : (
              <div className="text-center py-20 flex flex-col items-center">
                <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                  <Settings className="w-8 h-8 text-muted-foreground opacity-50" />
                </div>
                <h3 className="font-semibold text-lg">All caught up!</h3>
                <p className="text-muted-foreground text-sm">No new notifications.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <PostViewDialog
        isOpen={isPostViewOpen}
        onClose={() => setIsPostViewOpen(false)}
        post={viewPostData}
      />
    </div>
  );
}