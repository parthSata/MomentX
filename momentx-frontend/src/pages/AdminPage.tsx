import { useState } from "react";
import { motion } from "framer-motion";
import { Search, RefreshCw, Menu } from "lucide-react"; // ✅ Import Menu Icon
import { Input } from "@/components/ui/input";

// Import components
import { Sidebar } from "@/components/admin/Sidebar";
import { OverviewTab } from "@/components/admin/OverviewTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { ReportsTab } from "@/components/admin/ReportsTab";
import { PostsTab } from "@/components/admin/PostsTab";
import { VisitorLogTab } from "@/components/admin/VisitorLogTab";
// import { SettingsTab } from "@/components/admin/SettingsTab";

export default function AdminPage() {
  const [activeNav, setActiveNav] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ State for Mobile Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Helper to render the correct component
  const renderContent = () => {
    switch (activeNav) {
      case "overview":
        return <OverviewTab />;
      case "users":
        return <UsersTab searchQuery={searchQuery} />;
      case "reports":
        return <ReportsTab />;
      case "posts":
        return <PostsTab searchQuery={searchQuery} />;
      case "visitors":
        return <VisitorLogTab />;
      // case "settings":
      //   return <SettingsTab />;
      default:
        return <div className="p-8 text-center text-muted-foreground">Section Under Construction</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">

      {/* Sidebar with Mobile Props */}
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 p-4 md:p-8 overflow-auto w-full">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          {/* Header Left: Title & Mobile Toggle */}
          <div className="flex items-center gap-4">
            {/* ✅ Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 bg-white/5 rounded-lg border border-white/10 text-white hover:bg-white/10"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div>
              <h2 className="text-2xl font-display font-bold capitalize">
                {activeNav}
              </h2>
              <p className="text-muted-foreground hidden sm:block">Manage your platform</p>
            </div>
          </div>

          {/* Header Right: Search & Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 w-full"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="p-2 glass rounded-xl"
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>

        {renderContent()}
      </main>
    </div>
  );
}
