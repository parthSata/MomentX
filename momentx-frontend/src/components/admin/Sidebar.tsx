import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Users, FileText, Flag, X } from "lucide-react";
import { AvatarRing } from "@/components/ui/avatar-ring";

const navItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "posts", label: "Posts", icon: FileText },
    { id: "reports", label: "Reports", icon: Flag },
    { id: "visitors", label: "Visitors", icon: BarChart3 },
];

interface SidebarProps {
    activeNav: string;
    setActiveNav: (id: string) => void;
    isOpen: boolean;           // ✅ New Prop
    onClose: () => void;       // ✅ New Prop
}

export function Sidebar({ activeNav, setActiveNav, isOpen, onClose }: SidebarProps) {

    // Reusable Nav Content to avoid code duplication
    const NavContent = () => (
        <>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold gradient-text">Admin Panel</h1>
                    <p className="text-sm text-muted-foreground">MomentX Dashboard</p>
                </div>
                {/* Close button only visible inside mobile drawer context */}
                <button onClick={onClose} className="lg:hidden p-2 text-muted-foreground hover:text-white">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <nav className="space-y-2 flex-1">
                {navItems.map((item) => (
                    <motion.button
                        key={item.id}
                        whileHover={{ x: 4 }}
                        onClick={() => {
                            setActiveNav(item.id);
                            onClose(); // Close sidebar on mobile when clicked
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeNav === item.id
                            ? "bg-gradient-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
                        <p className="font-medium truncate text-left text-foreground">Admin User</p>
                        <p className="text-xs text-muted-foreground text-left">Super Admin</p>
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* 1. DESKTOP SIDEBAR (Hidden on mobile, visible on lg) */}
            <motion.aside
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="hidden lg:flex w-64 glass-strong flex-col p-4 border-r border-border h-screen sticky top-0"
            >
                <NavContent />
            </motion.aside>

            {/* 2. MOBILE SIDEBAR (Drawer) */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                        />

                        {/* Drawer Panel */}
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border flex flex-col p-4 lg:hidden shadow-2xl"
                        >
                            <NavContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}