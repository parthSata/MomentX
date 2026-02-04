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
    Send // ✅ Imported Send icon
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
import { Textarea } from "@/components/ui/textarea"; // Ensure you have this component
import { Button } from "@/components/ui/button"; // Ensure you have this component

export function UsersTab() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

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
                <div className="overflow-x-auto min-h-100">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border/50 bg-white/5">
                                <th className="text-left p-4 font-medium pl-6">User</th>
                                <th className="text-left p-4 font-medium hidden md:table-cell">Email</th>
                                <th className="text-left p-4 font-medium hidden sm:table-cell">Posts</th>
                                <th className="text-left p-4 font-medium hidden sm:table-cell">Followers</th>
                                <th className="text-left p-4 font-medium">Status</th>
                                <th className="text-left p-4 font-medium pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user, index) => (
                                    <motion.tr
                                        key={user._id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="border-b border-border/50 hover:bg-white/5 transition-colors group"
                                    >
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <AvatarRing src={user.profilePic} size="sm" />
                                                <div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-medium text-white">{user.name}</span>
                                                        {user.isVerified && (
                                                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                                                <span className="text-white text-[8px]">✓</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">@{user.username}</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-4 hidden md:table-cell text-muted-foreground text-sm">{user.email}</td>
                                        <td className="p-4 hidden sm:table-cell text-sm font-medium">{user.postsCount || 0}</td>
                                        <td className="p-4 hidden sm:table-cell text-sm font-medium">{user.followersCount || 0}</td>

                                        <td className="p-4">
                                            <div
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium flex w-fit items-center gap-1.5 border ${user.isActive
                                                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                    : "bg-red-500/10 text-red-400 border-red-500/20"
                                                    }`}
                                            >
                                                {user.isActive ? (
                                                    <>
                                                        <CheckCircle className="w-3 h-3" /> Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-3 h-3" /> Suspended
                                                    </>
                                                )}
                                            </div>
                                        </td>

                                        <td className="p-4 pr-6">
                                            <div className="flex items-center gap-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    onClick={() => navigate(`/u/${user.username}`)}
                                                    className="p-2 glass rounded-lg text-muted-foreground hover:text-white transition-colors"
                                                    title="View Profile"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </motion.button>

                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    onClick={() => handleToggleBan(user._id, user.isActive)}
                                                    disabled={processingId === user._id}
                                                    className={`p-2 rounded-lg transition-colors ${user.isActive
                                                        ? "glass text-red-400 hover:bg-red-500/20"
                                                        : "glass text-green-400 hover:bg-green-500/20"
                                                        }`}
                                                    title={user.isActive ? "Suspend User" : "Activate User"}
                                                >
                                                    {processingId === user._id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : user.isActive ? (
                                                        <Ban className="w-4 h-4" />
                                                    ) : (
                                                        <Unlock className="w-4 h-4" />
                                                    )}
                                                </motion.button>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            className="p-2 glass rounded-lg text-muted-foreground hover:text-white outline-none"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </motion.button>
                                                    </DropdownMenuTrigger>

                                                    <DropdownMenuContent
                                                        align="end"
                                                        className="w-48 glass-strong border-white/10 text-white backdrop-blur-xl"
                                                    >
                                                        <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator className="bg-white/10" />

                                                        <DropdownMenuItem
                                                            onClick={() => openWarningModal(user)} // ✅ Open Modal
                                                            className="cursor-pointer focus:bg-white/10 focus:text-white gap-2"
                                                        >
                                                            <Mail className="w-4 h-4" /> Send Warning
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem
                                                            onClick={() => handleViewActivity(user._id)}
                                                            className="cursor-pointer focus:bg-white/10 focus:text-white gap-2"
                                                        >
                                                            <FileText className="w-4 h-4" /> View Activity Log
                                                        </DropdownMenuItem>

                                                        <DropdownMenuSeparator className="bg-white/10" />

                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteUser(user._id)}
                                                            className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer gap-2"
                                                        >
                                                            <Trash2 className="w-4 h-4" /> Delete Account
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

            {/* ✅ Warning Modal Dialog */}
            <Dialog open={isWarningOpen} onOpenChange={setIsWarningOpen}>
                <DialogContent className="glass-strong border-white/10 text-white sm:max-w-md backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle>Send Warning</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Send an official warning email to <span className="font-semibold text-white">{selectedUser?.username}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Warning Message</label>
                            <Textarea
                                placeholder="e.g. You have violated our community guidelines regarding spam..."
                                value={warningMessage}
                                onChange={(e) => setWarningMessage(e.target.value)}
                                className="bg-white/5 border-white/10 min-h-25 text-white focus:ring-primary/50"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsWarningOpen(false)} className="hover:bg-white/10">
                            Cancel
                        </Button>
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