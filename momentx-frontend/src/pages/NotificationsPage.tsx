import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, UserPlus, Check, Settings, Loader2 } from "lucide-react";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { PageHeader } from "@/components/navigation/PageHeader";
import { useNotifications } from "@/hooks/useNotifications"; // ✅ FIX: Removed unused 'type Notification'
import { formatDistanceToNowStrict } from "date-fns";

const getIcon = (type: string) => {
  switch (type) {
    case "like": return <Heart className="w-4 h-4 text-red-500" />;
    case "comment": return <MessageCircle className="w-4 h-4 text-blue-500" />;
    case "follow": return <UserPlus className="w-4 h-4 text-green-500" />;
    default: return <Heart className="w-4 h-4" />;
  }
};

const getContentText = (type: string) => {
  switch (type) {
    case "like": return "liked your post";
    case "comment": return "commented on your post";
    case "follow": return "started following you";
    default: return "interacted with you";
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
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={markAllRead}
              className="p-2 glass rounded-full"
              title="Mark all as read"
            >
              <Check className="w-5 h-5" />
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 glass rounded-full">
              <Settings className="w-5 h-5" />
            </motion.button>
          </div>
        }
      />

      <div className="p-4">
        <div className="flex gap-2 mb-6">
          {(["all", "unread"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === tab ? "bg-gradient-primary text-white" : "glass hover:bg-white/10"}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "unread" && unreadCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

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
                      <span className="text-muted-foreground ml-1">{getContentText(notif.type)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNowStrict(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  {notif.post?.images?.[0] && (
                    <img
                      src={notif.post.images[0]}
                      alt="Post"
                      className="w-10 h-10 rounded-lg object-cover ml-2 border border-white/10"
                    />
                  )}

                  {notif.type === "follow" && (
                    <button className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-semibold rounded-full transition-colors ml-2">
                      Follow Back
                    </button>
                  )}
                </motion.div>
              ))
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 rounded-full bg-gradient-primary/20 flex items-center justify-center mb-4">
                  <Heart className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No notifications yet</h3>
                <p className="text-muted-foreground text-center">When someone interacts with your content,<br />you'll see it here.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}