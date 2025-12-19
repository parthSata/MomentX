import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, UserPlus, AtSign, Check, Settings } from "lucide-react";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { PageHeader } from "@/components/navigation/PageHeader";

const notifications = [
  { id: 1, type: "like", user: { name: "Sarah Design", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" }, content: "liked your photo", time: "2m", image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=100", read: false },
  { id: 2, type: "follow", user: { name: "Alex Photos", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" }, content: "started following you", time: "15m", read: false },
  { id: 3, type: "comment", user: { name: "Emma Wilson", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" }, content: "commented: \"This is amazing! 🔥\"", time: "1h", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100", read: false },
  { id: 4, type: "mention", user: { name: "Mike Travel", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" }, content: "mentioned you in a comment", time: "3h", read: true },
  { id: 5, type: "like", user: { name: "Lisa Art", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" }, content: "liked your reel", time: "5h", read: true },
  { id: 6, type: "follow", user: { name: "John Doe", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150" }, content: "started following you", time: "1d", read: true },
];

const getIcon = (type: string) => {
  switch (type) {
    case "like": return <Heart className="w-4 h-4 text-red-500" />;
    case "comment": return <MessageCircle className="w-4 h-4 text-blue-500" />;
    case "follow": return <UserPlus className="w-4 h-4 text-green-500" />;
    case "mention": return <AtSign className="w-4 h-4 text-purple-500" />;
    default: return <Heart className="w-4 h-4" />;
  }
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(notifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const markAllAsRead = () => setNotifs(notifs.map(n => ({ ...n, read: true })));
  const filteredNotifs = filter === "unread" ? notifs.filter(n => !n.read) : notifs;
  const todayNotifs = filteredNotifs.filter(n => n.time.includes("m") || n.time.includes("h"));
  const earlierNotifs = filteredNotifs.filter(n => n.time.includes("d"));

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageHeader 
        title="Notifications" 
        rightContent={
          <div className="flex items-center gap-2">
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={markAllAsRead} className="p-2 glass rounded-full">
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
            <button key={tab} onClick={() => setFilter(tab)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === tab ? "bg-gradient-primary text-white" : "glass hover:bg-white/10"}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "unread" && <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">{notifs.filter(n => !n.read).length}</span>}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {todayNotifs.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Today</h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {todayNotifs.map((notif, index) => (
                    <motion.div key={notif.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className={`flex items-center gap-3 p-3 glass rounded-2xl ${!notif.read ? "border border-primary/30" : ""}`}>
                      <div className="relative">
                        <AvatarRing src={notif.user.avatar} size="md" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background flex items-center justify-center">{getIcon(notif.type)}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm"><span className="font-semibold">{notif.user.name}</span> <span className="text-muted-foreground">{notif.content}</span></p>
                        <p className="text-xs text-muted-foreground">{notif.time}</p>
                      </div>
                      {notif.image && <img src={notif.image} alt="Post" className="w-12 h-12 rounded-lg object-cover" />}
                      {notif.type === "follow" && <button className="px-4 py-1.5 bg-gradient-primary text-white text-sm font-medium rounded-full">Follow</button>}
                      {!notif.read && <div className="w-2 h-2 bg-primary rounded-full" />}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {earlierNotifs.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Earlier</h3>
              <div className="space-y-2">
                {earlierNotifs.map((notif, index) => (
                  <motion.div key={notif.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="flex items-center gap-3 p-3 glass rounded-2xl">
                    <div className="relative">
                      <AvatarRing src={notif.user.avatar} size="md" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background flex items-center justify-center">{getIcon(notif.type)}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm"><span className="font-semibold">{notif.user.name}</span> <span className="text-muted-foreground">{notif.content}</span></p>
                      <p className="text-xs text-muted-foreground">{notif.time}</p>
                    </div>
                    {notif.type === "follow" && <button className="px-4 py-1.5 bg-gradient-primary text-white text-sm font-medium rounded-full">Follow</button>}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {filteredNotifs.length === 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 rounded-full bg-gradient-primary/20 flex items-center justify-center mb-4"><Heart className="w-10 h-10 text-primary" /></div>
              <h3 className="text-xl font-semibold mb-2">No notifications yet</h3>
              <p className="text-muted-foreground text-center">When someone interacts with your content,<br />you'll see it here.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}