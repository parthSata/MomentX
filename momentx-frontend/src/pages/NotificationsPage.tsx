import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, UserPlus, Check, Settings, Loader2, PlayCircle } from "lucide-react";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { PageHeader } from "@/components/navigation/PageHeader";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { formatDistanceToNowStrict } from "date-fns";

const getIcon = (type: string) => {
  switch (type) {
    case "like": return <Heart className="w-4 h-4 text-red-500" />;
    case "comment": return <MessageCircle className="w-4 h-4 text-blue-500" />;
    case "follow": return <UserPlus className="w-4 h-4 text-green-500" />;
    default: return <Heart className="w-4 h-4" />;
  }
};

const getContentText = (type: string, notification: Notification) => {
  // 1. Check if it's a Story Like
  // We check if 'story' exists AND if it has an ID (meaning it was populated)
  if (type === "like" && notification.story?._id) {
    return "liked your story";
  }

  // 2. Fallback for other types
  switch (type) {
    case "like":
      return "liked your post";
    case "comment":
      return "commented on your post";
    case "follow":
      return "started following you";
    default:
      return "interacted with you";
  }
};
export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markAllRead } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifs = filter === "unread"
    ? notifications.filter(n => !n.isRead)
    : notifications;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageHeader
        title="Notifications"
        rightContent={
          <div className="flex items-center gap-2">
            <motion.button onClick={markAllRead} className="p-2 glass rounded-full">
              <Check className="w-5 h-5" />
            </motion.button>
            <motion.button className="p-2 glass rounded-full"><Settings className="w-5 h-5" /></motion.button>
          </div>
        }
      />

      <div className="p-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["all", "unread"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === tab ? "bg-gradient-primary text-white" : "glass hover:bg-white/10"}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "unread" && unreadCount > 0 && <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">{unreadCount}</span>}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredNotifs.length > 0 ? (
              filteredNotifs.map((notif, index) => (
                <motion.div
                  key={notif._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-3 p-3 glass rounded-2xl ${!notif.isRead ? "border-l-4 border-l-primary bg-primary/5" : ""}`}
                >
                  <div className="relative">
                    <AvatarRing src={notif.sender?.profilePic} size="md" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background flex items-center justify-center border border-border">
                      {getIcon(notif.type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 ml-1">
                    <p className="text-sm">
                      <span className="font-semibold">{notif.sender?.username}</span>
                      {/* ✅ PASS THE FULL NOTIFICATION OBJECT */}
                      <span className="text-muted-foreground ml-1">{getContentText(notif.type, notif)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNowStrict(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Post Thumbnail */}
                  {!notif.story && notif.post?.images?.[0] && (
                    <img src={notif.post.images[0]} alt="Post" className="w-10 h-10 rounded-lg object-cover ml-2 border border-white/10" />
                  )}

                  {/* Story Thumbnail (Pink Border) */}
                  {notif.story && (
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden ml-2 border border-pink-500/30 bg-black">
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

                  {notif.type === "follow" && (
                    <button className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-semibold rounded-full transition-colors ml-2">Follow Back</button>
                  )}
                </motion.div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-10">No notifications yet.</p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}