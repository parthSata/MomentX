import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users, FileText, Flag, BarChart3, Settings, Search, MoreHorizontal,
  TrendingUp, TrendingDown, Eye, Heart, 
  ChevronDown, Filter, RefreshCw, Ban, Check, X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { AvatarRing } from "@/components/ui/avatar-ring";

const stats = [
  { label: "Total Users", value: "124.5K", change: "+12.5%", trend: "up", icon: Users },
  { label: "Total Posts", value: "892.3K", change: "+8.2%", trend: "up", icon: FileText },
  { label: "Engagement Rate", value: "4.8%", change: "-0.3%", trend: "down", icon: Heart },
  { label: "Reports", value: "23", change: "+5", trend: "up", icon: Flag },
];

const users = [
  { id: 1, name: "Sarah Design", username: "sarah_design", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", email: "sarah@example.com", posts: 156, followers: "45.2K", status: "active", verified: true },
  { id: 2, name: "Alex Photos", username: "alex_photos", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", email: "alex@example.com", posts: 89, followers: "23.1K", status: "active", verified: false },
  { id: 3, name: "Emma Wilson", username: "emma_w", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150", email: "emma@example.com", posts: 234, followers: "67.8K", status: "suspended", verified: true },
  { id: 4, name: "Mike Travel", username: "mike_travel", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", email: "mike@example.com", posts: 312, followers: "89.4K", status: "active", verified: true },
];

const reports = [
  { id: 1, type: "spam", reporter: "user_123", reported: "spam_bot", content: "Suspicious activity detected", status: "pending", time: "2h ago" },
  { id: 2, type: "harassment", reporter: "emma_w", reported: "troll_user", content: "Inappropriate comments", status: "pending", time: "5h ago" },
  { id: 3, type: "copyright", reporter: "photo_studio", reported: "copy_cat", content: "Stolen content", status: "resolved", time: "1d ago" },
];

const navItems = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users },
  { id: "posts", label: "Posts", icon: FileText },
  { id: "reports", label: "Reports", icon: Flag },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function AdminPage() {
  const [activeNav, setActiveNav] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden lg:flex w-64 glass-strong flex-col p-4 border-r border-border"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold gradient-text">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">MomentX Dashboard</p>
        </div>

        <nav className="space-y-2 flex-1">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ x: 4 }}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeNav === item.id
                  ? "bg-gradient-primary text-white"
                  : "hover:bg-white/10"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </motion.button>
          ))}
        </nav>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <AvatarRing src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150" size="sm" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">Admin User</p>
              <p className="text-xs text-muted-foreground">Super Admin</p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        {/* Mobile Nav */}
        <div className="lg:hidden mb-6 overflow-x-auto">
          <div className="flex gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap ${
                  activeNav === item.id
                    ? "bg-gradient-primary text-white"
                    : "glass"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h2 className="text-2xl font-display font-bold">
              {navItems.find(n => n.id === activeNav)?.label}
            </h2>
            <p className="text-muted-foreground">Manage your platform</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                variant="glass"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="p-2 glass rounded-xl">
              <Filter className="w-5 h-5" />
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="p-2 glass rounded-xl">
              <RefreshCw className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>

        {/* Overview Stats */}
        {activeNav === "overview" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-strong p-6 rounded-2xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-primary/20 rounded-xl">
                      <stat.icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className={`flex items-center gap-1 text-sm ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                      {stat.trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold">{stat.value}</h3>
                  <p className="text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Chart Placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-strong p-6 rounded-2xl mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Analytics Overview</h3>
                <button className="flex items-center gap-2 px-4 py-2 glass rounded-xl">
                  <span>Last 7 days</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <div className="h-64 flex items-end justify-between gap-2">
                {[40, 65, 45, 80, 55, 90, 70].map((height, index) => (
                  <motion.div
                    key={index}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: index * 0.1 }}
                    className="flex-1 bg-gradient-primary rounded-t-lg opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                  />
                ))}
              </div>
              <div className="flex justify-between mt-4 text-sm text-muted-foreground">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {/* Users Table */}
        {activeNav === "users" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-2xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium">User</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">Email</th>
                    <th className="text-left p-4 font-medium hidden sm:table-cell">Posts</th>
                    <th className="text-left p-4 font-medium hidden sm:table-cell">Followers</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-border/50 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <AvatarRing src={user.avatar} size="sm" />
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{user.name}</span>
                              {user.verified && (
                                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-[8px]">✓</span>
                                </div>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">@{user.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell text-muted-foreground">{user.email}</td>
                      <td className="p-4 hidden sm:table-cell">{user.posts}</td>
                      <td className="p-4 hidden sm:table-cell">{user.followers}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.status === "active" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <motion.button whileHover={{ scale: 1.1 }} className="p-2 glass rounded-lg">
                            <Eye className="w-4 h-4" />
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.1 }} className="p-2 glass rounded-lg">
                            <Ban className="w-4 h-4" />
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.1 }} className="p-2 glass rounded-lg">
                            <MoreHorizontal className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Reports */}
        {activeNav === "reports" && (
          <div className="space-y-4">
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-strong p-4 rounded-2xl"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl ${
                      report.type === "spam" ? "bg-yellow-500/20" :
                      report.type === "harassment" ? "bg-red-500/20" : "bg-blue-500/20"
                    }`}>
                      <Flag className={`w-5 h-5 ${
                        report.type === "spam" ? "text-yellow-500" :
                        report.type === "harassment" ? "text-red-500" : "text-blue-500"
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold capitalize">{report.type}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          report.status === "pending" ? "bg-yellow-500/20 text-yellow-500" : "bg-green-500/20 text-green-500"
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm">{report.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Reported by @{report.reporter} • {report.time}
                      </p>
                    </div>
                  </div>
                  {report.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <motion.button whileHover={{ scale: 1.1 }} className="p-2 bg-green-500/20 rounded-lg">
                        <Check className="w-4 h-4 text-green-500" />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} className="p-2 bg-red-500/20 rounded-lg">
                        <X className="w-4 h-4 text-red-500" />
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
