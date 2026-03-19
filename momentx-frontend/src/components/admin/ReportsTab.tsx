import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Flag, Check, X, AlertTriangle,
    Loader2, User as UserIcon, FileText,
    Calendar
} from "lucide-react";
import { api } from "@/lib/axios";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ReportsTab() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<"pending" | "resolved" | "rejected">("pending");
    const [processingId, setProcessingId] = useState<string | null>(null);

    // --- Modal State ---
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [adminNote, setAdminNote] = useState("");

    // 1. Fetch Reports
    useEffect(() => {
        fetchReports();
    }, [filterStatus]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/admin/reports?status=${filterStatus}`);
            setReports(data.data.reports);
        } catch (error) {
            toast.error("Failed to load reports");
        } finally {
            setLoading(false);
        }
    };

    // 2. Handle Action (Resolve/Reject)
    const handleAction = async (reportId: string, status: "resolved" | "rejected") => {
        setProcessingId(reportId);
        try {
            await api.patch(`/admin/reports/${reportId}`, {
                status,
                adminNote: adminNote
            });

            // Remove from list if in pending view, or update status if in other view
            if (filterStatus === "pending") {
                setReports(prev => prev.filter(r => r._id !== reportId));
            } else {
                setReports(prev => prev.map(r => r._id === reportId ? { ...r, status } : r));
            }

            toast.success(`Report ${status}`);
            setIsDetailsOpen(false);
            setAdminNote("");
        } catch (error) {
            toast.error("Action failed");
        } finally {
            setProcessingId(null);
        }
    };

    const openDetails = (report: any) => {
        setSelectedReport(report);
        setAdminNote(report.adminNote || "");
        setIsDetailsOpen(true);
    };

    const getReasonColor = (reason: string) => {
        switch (reason) {
            case 'spam': return 'text-yellow-500 bg-yellow-500/10';
            case 'hate':
            case 'violence': return 'text-red-500 bg-red-500/10';
            case 'nudity': return 'text-purple-500 bg-purple-500/10';
            default: return 'text-blue-500 bg-blue-500/10';
        }
    };

    if (loading && !processingId) {
        return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Header & Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center glass-strong p-4 rounded-2xl">
                <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                        <Flag className="w-5 h-5 text-primary" /> Reports Center
                    </h3>
                    <p className="text-sm text-muted-foreground">Review and moderate user reports</p>
                </div>
                <div className="flex bg-muted p-1 rounded-lg border border-border/50">
                    {["pending", "resolved", "rejected"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status as any)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${filterStatus === status
                                ? "bg-primary text-primary-foreground shadow-lg"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Reports List - Table View */}
            <div className="glass-strong rounded-2xl overflow-hidden border border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="p-4 text-xs font-semibold uppercase text-muted-foreground whitespace-nowrap">Report Details</th>
                                <th className="p-4 text-xs font-semibold uppercase text-muted-foreground whitespace-nowrap">Target</th>
                                <th className="p-4 text-xs font-semibold uppercase text-muted-foreground whitespace-nowrap">Reporter</th>
                                <th className="p-4 text-xs font-semibold uppercase text-muted-foreground whitespace-nowrap">Date & Status</th>
                                <th className="p-4 text-xs font-semibold uppercase text-muted-foreground whitespace-nowrap text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50 text-sm">
                            {reports.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                                        No {filterStatus} reports found.
                                    </td>
                                </tr>
                            ) : (
                                reports.map((report, index) => (
                                    <motion.tr
                                        key={report._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="hover:bg-muted/20 transition-colors"
                                    >
                                        <td className="p-4 align-top">
                                            <div className="flex gap-3">
                                                <div className={`p-2 rounded-lg h-fit ${getReasonColor(report.reason)}`}>
                                                    <AlertTriangle className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-foreground capitalize">{report.reason}</div>
                                                    <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                                        {report.description || "No description provided."}
                                                    </div>
                                                    {report.adminNote && (
                                                        <div className="text-[10px] text-primary italic mt-1 line-clamp-1">
                                                            Note: {report.adminNote}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border/50 text-muted-foreground uppercase tracking-widest block w-fit mb-1">
                                                {report.targetType}
                                            </span>
                                            <div className="text-xs text-gray-300 truncate max-w-[150px]">
                                                {report.targetContent?.caption || report.targetContent?.name || "Content Info"}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="flex items-center gap-2">
                                                <UserIcon className="w-3 h-3 text-primary" />
                                                <span className="font-medium text-foreground">{report.reportedBy?.username || "Unknown"}</span>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-0.5">
                                                {report.reportedBy?.email || "No email"}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(report.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                report.status === 'resolved' ? 'bg-green-500/20 text-green-500' :
                                                report.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                                                'bg-yellow-500/20 text-yellow-500'
                                            }`}>
                                                {report.status}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top text-right space-x-1">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 hover:bg-white/10"
                                                    onClick={() => openDetails(report)}
                                                    title="View Full Details"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </Button>
                                                {filterStatus === "pending" && (
                                                    <>
                                                        <Button
                                                            size="icon"
                                                            className="h-8 w-8 bg-green-500/20 text-green-500 hover:bg-green-500/30 border border-green-500/50"
                                                            onClick={() => handleAction(report._id, "resolved")}
                                                            disabled={processingId === report._id}
                                                            title="Resolve"
                                                        >
                                                            {processingId === report._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            className="h-8 w-8 bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/50"
                                                            onClick={() => handleAction(report._id, "rejected")}
                                                            disabled={processingId === report._id}
                                                            title="Reject"
                                                        >
                                                            {processingId === report._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="glass-strong border-border text-foreground sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Report Details</DialogTitle>
                        <DialogDescription>Review the content and take action.</DialogDescription>
                    </DialogHeader>

                    {selectedReport && (
                        <div className="space-y-4 py-2">
                            {/* Target Content Preview */}
                            <div className="p-3 rounded-lg bg-black/40 border border-white/10">
                                <h4 className="text-xs uppercase text-muted-foreground font-bold mb-2">
                                    Reported {selectedReport.targetType}
                                </h4>

                                {selectedReport.targetContent?.deleted ? (
                                    <p className="text-red-400 italic text-sm">Content has been deleted.</p>
                                ) : (
                                    <div className="flex gap-3">
                                        {/* Image/Video Preview */}
                                        {(selectedReport.targetContent?.images?.[0] || selectedReport.targetContent?.thumbnailUrl || selectedReport.targetContent?.profilePic) && (
                                            <img
                                                src={selectedReport.targetContent.images?.[0] || selectedReport.targetContent.thumbnailUrl || selectedReport.targetContent.profilePic}
                                                className="w-16 h-16 rounded-md object-cover bg-white/5"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {selectedReport.targetContent?.username || selectedReport.targetContent?.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {selectedReport.targetContent?.caption || selectedReport.targetContent?.email || "No caption"}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Report Reason */}
                            <div>
                                <h4 className="text-xs uppercase text-muted-foreground font-bold mb-1">Reason: {selectedReport.reason}</h4>
                                <p className="text-sm bg-white/5 p-3 rounded-lg text-gray-300">
                                    {selectedReport.description || "No additional details provided."}
                                </p>
                            </div>

                            {/* Admin Note */}
                            <div>
                                <label className="text-xs font-medium mb-1 block">Admin Note (Optional)</label>
                                <Textarea
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    placeholder="Add a note about the action taken..."
                                    className="bg-black/20 border-white/10 text-sm"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setIsDetailsOpen(false)}>Close</Button>
                        {selectedReport?.status === 'pending' && (
                            <>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleAction(selectedReport._id, "rejected")}
                                    className="bg-red-500/20 text-red-400 hover:bg-red-500/40"
                                >
                                    Dismiss Report
                                </Button>
                                <Button
                                    onClick={() => handleAction(selectedReport._id, "resolved")}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    Resolve & Take Action
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}