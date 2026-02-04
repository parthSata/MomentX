import { motion } from "framer-motion";
import { Flag, Check, X } from "lucide-react";

const reports = [
    { id: 1, type: "spam", reporter: "user_123", reported: "spam_bot", content: "Suspicious activity detected", status: "pending", time: "2h ago" },
    { id: 2, type: "harassment", reporter: "emma_w", reported: "troll_user", content: "Inappropriate comments", status: "pending", time: "5h ago" },
    { id: 3, type: "copyright", reporter: "photo_studio", reported: "copy_cat", content: "Stolen content", status: "resolved", time: "1d ago" },
];

export function ReportsTab() {
    return (
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
                            <div className={`p-2 rounded-xl ${report.type === "spam" ? "bg-yellow-500/20" :
                                report.type === "harassment" ? "bg-red-500/20" : "bg-blue-500/20"
                                }`}>
                                <Flag className={`w-5 h-5 ${report.type === "spam" ? "text-yellow-500" :
                                    report.type === "harassment" ? "text-red-500" : "text-blue-500"
                                    }`} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold capitalize">{report.type}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${report.status === "pending" ? "bg-yellow-500/20 text-yellow-500" : "bg-green-500/20 text-green-500"
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
    );
}