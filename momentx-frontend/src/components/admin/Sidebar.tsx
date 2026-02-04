import { motion } from "framer-motion";
import { BarChart3, Users, FileText, Flag, Settings } from "lucide-react";
import { AvatarRing } from "@/components/ui/avatar-ring";

const navItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "posts", label: "Posts", icon: FileText },
    { id: "reports", label: "Reports", icon: Flag },
    { id: "settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
    activeNav: string;
    setActiveNav: (id: string) => void;
}

export function Sidebar({ activeNav, setActiveNav }: SidebarProps) {
    return (
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
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeNav === item.id
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
    );
}