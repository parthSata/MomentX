import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Eye,
    Ban,
    MoreHorizontal,
    Loader2,
    CheckCircle,
    XCircle,
    Unlock,
    Mail,
    Trash2,
    FileText,
    Send,
    Calendar // ✅ Imported Calendar icon
} from "lucide-react";
import { AvatarRing } from "@/components/ui/avatar-ring";
import { api } from "@/lib/axios";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface UsersTabProps {
    searchQuery: string;
}

export function UsersTab({ searchQuery }: UsersTabProps) {
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [, setProcessingId] = useState<string | null>(null);

    // ✅ Filter State
    const [timeFilter, setTimeFilter] = useState<"all" | "7days">("all");

    // --- Modal State ---
    const [isWarningOpen, setIsWarningOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [warningMessage, setWarningMessage] = useState("");
    const [sendingWarning, setSendingWarning] = useState(false);

    // 1. Fetch Users
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get("/admin/users");
            setUsers(data.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    // 2. Toggle Ban Status
    const handleToggleBan = async (userId: string, currentStatus: boolean) => {
        setProcessingId(userId);
        try {
            const newStatus = !currentStatus;
            setUsers((prev) =>
                prev.map((u) => (u._id === userId ? { ...u, isActive: newStatus } : u))
            );

            await api.patch(`/admin/users/${userId}/ban`);
            toast.success(newStatus ? "User activated" : "User suspended");
        } catch (error) {
            setUsers((prev) =>
                prev.map((u) => (u._id === userId ? { ...u, isActive: currentStatus } : u))
            );
            toast.error("Failed to update status");
        } finally {
            setProcessingId(null);
        }
    };

    // 3. Delete User
    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm("Are you sure? This will permanently delete the user.")) {
            return;
        }

        setProcessingId(userId);
        try {
            await api.delete(`/admin/users/${userId}`);
            setUsers((prev) => prev.filter((u) => u._id !== userId));
            toast.success("User deleted successfully");
        } catch (error) {
            toast.error("Failed to delete user");
        } finally {
            setProcessingId(null);
        }
    };

    // 4. Open Warning Modal
    const openWarningModal = (user: any) => {
        setSelectedUser(user);
        setWarningMessage(""); // Reset message
        setIsWarningOpen(true);
    };

    // 5. Submit Warning (API Call)
    const handleSendWarning = async () => {
        if (!warningMessage.trim()) return toast.error("Please enter a message");

        setSendingWarning(true);
        try {
            await api.post(`/admin/users/${selectedUser._id}/warning`, {
                message: warningMessage,
            });
            toast.success(`Warning sent to ${selectedUser.name}`);
            setIsWarningOpen(false);
        } catch (error) {
            toast.error("Failed to send warning email");
        } finally {
            setSendingWarning(false);
        }
    };

    const handleViewActivity = (userId: string) => {
        console.log("Viewing activity for:", userId);
        toast.info("Activity logs coming soon!");
    };

    // ✅ Filter Users based on search AND time filter
    const filteredUsers = users.filter(user => {
        // 1. Search Filter
        const matchesSearch =
            user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        // 2. Time Filter (Last 7 Days)
        if (timeFilter === "7days") {
            if (!user.createdAt) return false; // Safety check if backend missing field
            const userDate = new Date(user.createdAt);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return userDate >= sevenDaysAgo;
        }

        return true;
    });

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-strong rounded-2xl overflow-hidden"
            >
                {/* ✅ Added Filter Toolbar Header */}
                <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">User Management</h3>
                        <span className="bg-white/10 text-xs px-2 py-0.5 rounded-full text-muted-foreground">
                            {filteredUsers.length}
                        </span>
                    </div>

                    {/* Time Filter Buttons */}
                    <div className="flex bg-white/5 p-1 rounded-lg">
                        <button
                            onClick={() => setTimeFilter("all")}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${timeFilter === "all" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"}`}
                        >
                            All Time
                        </button>
                        <button
                            onClick={() => setTimeFilter("7days")}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${timeFilter === "7days" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"}`}
                        >
                            <Calendar className="w-3 h-3" /> Last 7 Days
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border/50 bg-white/5">
                                <th className="text-left p-4 font-medium pl-6">User</th>
                                <th className="text-left p-4 font-medium hidden md:table-cell">Email</th>
                                <th className="text-left p-4 font-medium hidden sm:table-cell">Joined</th> {/* Added Joined Date */}
                                <th className="text-left p-4 font-medium hidden sm:table-cell">Status</th>
                                <th className="text-left p-4 font-medium hidden lg:table-cell">Activity</th>
                                <th className="text-right p-4 font-medium pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        {users.length === 0 ? "No users found." : "No users match your filters."}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user, index) => (
                                    <motion.tr
                                        key={user._id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="border-b border-border/50 hover:bg-white/5 transition-colors group"
                                    >
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <AvatarRing src={user.profilePic} size="sm" />
                                                <div>
                                                    <p className="font-medium text-white flex items-center gap-1">
                                                        {user.name}
                                                        {user.isVerified && <CheckCircle className="w-3 h-3 text-blue-400 fill-blue-400/20" />}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-4 hidden md:table-cell text-sm text-muted-foreground">
                                            {user.email}
                                        </td>

                                        {/* Added Date Display */}
                                        <td className="p-4 hidden sm:table-cell text-xs text-muted-foreground">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                                        </td>

                                        <td className="p-4 hidden sm:table-cell">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center w-fit gap-1.5 ${user.isActive
                                                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                    : "bg-red-500/10 text-red-400 border-red-500/20"
                                                }`}>
                                                {user.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                {user.isActive ? "Active" : "Suspended"}
                                            </span>
                                        </td>

                                        <td className="p-4 hidden lg:table-cell text-sm text-muted-foreground">
                                            <div className="flex items-center gap-4">
                                                <div className="text-center">
                                                    <span className="block font-bold text-white">{user.postsCount || 0}</span>
                                                    <span className="text-[10px] uppercase">Posts</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="block font-bold text-white">{user.followersCount || 0}</span>
                                                    <span className="text-[10px] uppercase">Followers</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-4 pr-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    onClick={() => navigate(`/u/${user.username}`)}
                                                    className="p-2 glass rounded-lg text-muted-foreground hover:text-white transition-colors"
                                                    title="View Profile"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </motion.button>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 bg-black/90 border-white/10 backdrop-blur-xl">
                                                        <DropdownMenuLabel>Manage User</DropdownMenuLabel>
                                                        <DropdownMenuSeparator className="bg-white/10" />

                                                        <DropdownMenuItem onClick={() => handleViewActivity(user._id)} className="cursor-pointer">
                                                            <FileText className="w-4 h-4 mr-2" /> View Logs
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem onClick={() => openWarningModal(user)} className="cursor-pointer">
                                                            <Mail className="w-4 h-4 mr-2" /> Send Warning
                                                        </DropdownMenuItem>

                                                        <DropdownMenuSeparator className="bg-white/10" />

                                                        <DropdownMenuItem
                                                            onClick={() => handleToggleBan(user._id, user.isActive)}
                                                            className={user.isActive ? "text-yellow-500 focus:text-yellow-500 cursor-pointer" : "text-green-500 focus:text-green-500 cursor-pointer"}
                                                        >
                                                            {user.isActive ? <Ban className="w-4 h-4 mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
                                                            {user.isActive ? "Suspend User" : "Activate User"}
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteUser(user._id)}
                                                            className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" /> Delete User
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Warning Dialog */}
            <Dialog open={isWarningOpen} onOpenChange={setIsWarningOpen}>
                <DialogContent className="glass-strong border-white/10 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Send Warning to {selectedUser?.name}</DialogTitle>
                        <DialogDescription>
                            This message will be sent to the user via email.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <Textarea
                            placeholder="Enter warning message..."
                            value={warningMessage}
                            onChange={(e) => setWarningMessage(e.target.value)}
                            className="bg-black/50 border-white/10 min-h-30"
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsWarningOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleSendWarning}
                            disabled={sendingWarning}
                            className="bg-red-500 hover:bg-red-600 text-white gap-2"
                        >
                            {sendingWarning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Send Warning
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}