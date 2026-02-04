import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";

// Import your new components
import { Sidebar } from "@/components/admin/Sidebar";
import { OverviewTab } from "@/components/admin/OverviewTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { ReportsTab } from "@/components/admin/ReportsTab";
import { PostsTab } from "@/components/admin/PostsTab";
import { SettingsTab } from "@/components/admin/SettingsTab";

export default function AdminPage() {
  const [activeNav, setActiveNav] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  // Helper to render the correct component based on activeNav
  const renderContent = () => {
    switch (activeNav) {
      case "overview":
        return <OverviewTab />;
      case "users":
        return <UsersTab />;
      case "reports":
        return <ReportsTab />;
      case "posts":
        return <PostsTab />;
      case "settings":
        return <SettingsTab />;
      default:
        return <div className="p-8 text-center text-muted-foreground">Section Under Construction</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* 1. Sidebar Component */}
      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-auto">

        {/* Header Section */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h2 className="text-2xl font-display font-bold capitalize">
              {activeNav}
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

        {/* 2. Dynamic Content */}
        {renderContent()}

      </main>
    </div>
  );
}