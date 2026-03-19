import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
    Activity, 
    User as UserIcon, 
    Monitor, 
    Smartphone, 
    Tablet, 
    Globe, 
    Clock, 
    Loader2, 
    ChevronLeft, 
    ChevronRight
} from "lucide-react";
import { api } from "@/lib/axios";
import { toast } from "sonner";

export function VisitorLogTab() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/admin/visitor-logs?page=${page}&limit=20`);
            setLogs(data.data.logs);
            setTotalPages(data.data.pages);
            setTotalLogs(data.data.total);
        } catch (error) {
            toast.error("Failed to load visitor logs");
        } finally {
            setLoading(false);
        }
    };

    const getDeviceIcon = (device: string) => {
        switch (device?.toLowerCase()) {
            case 'mobile': return <Smartphone className="w-4 h-4" />;
            case 'tablet': return <Tablet className="w-4 h-4" />;
            default: return <Monitor className="w-4 h-4" />;
        }
    };

    if (loading && logs.length === 0) {
        return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center glass-strong p-4 rounded-2xl">
                <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                        <Activity className="w-5 h-5 text-primary" /> Visitor Activity Log
                    </h3>
                    <p className="text-sm text-muted-foreground">{totalLogs} total visits tracked</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-lg bg-muted disabled:opacity-30 hover:bg-muted/80 text-foreground"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium text-foreground">Page {page} of {totalPages}</span>
                    <button 
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 rounded-lg bg-muted disabled:opacity-30 hover:bg-muted/80 text-foreground"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="glass-strong rounded-2xl overflow-hidden border border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="p-4 text-xs font-semibold uppercase text-muted-foreground">User</th>
                                <th className="p-4 text-xs font-semibold uppercase text-muted-foreground">Device & IP</th>
                                <th className="p-4 text-xs font-semibold uppercase text-muted-foreground">Path</th>
                                <th className="p-4 text-xs font-semibold uppercase text-muted-foreground">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-muted-foreground">No visitor logs found.</td>
                                </tr>
                            ) : (
                                logs.map((log, index) => (
                                    <motion.tr 
                                        key={log._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.02 }}
                                        className="hover:bg-muted/20 transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {log.user?.profilePic ? (
                                                    <img src={log.user.profilePic} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-primary">
                                                        <UserIcon className="w-4 h-4" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-foreground">{log.user?.name || "Anonymous / Deleted"}</div>
                                                    <div className="text-[10px] text-muted-foreground">@{log.user?.username || "unknown"}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-foreground">
                                                {getDeviceIcon(log.device)}
                                                <span className="capitalize">{log.device}</span>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                                <Globe className="w-3 h-3" /> {log.ip}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <code className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                                                {log.path}
                                            </code>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-foreground">
                                                <Clock className="w-3 h-3 text-muted-foreground" />
                                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-0.5">
                                                {new Date(log.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}
