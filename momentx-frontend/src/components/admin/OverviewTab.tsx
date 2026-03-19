import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Users,
    FileText,
    Flag,
    Heart,
    TrendingUp,
    TrendingDown,
    Loader2,
    Calendar
} from "lucide-react";
import { api } from "@/lib/axios";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    // Removed 'defs', 'linearGradient', 'stop' imports -> Use them directly as tags
} from "recharts";

const iconMap: any = {
    "Total Users": Users,
    "Total Posts": FileText,
    "Engagement Rate": Heart,
    "Reports": Flag,
};

// --- ✨ Custom Tooltip Component ---
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-strong p-3 rounded-xl border border-white/10 shadow-xl backdrop-blur-md">
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> {label}
                </p>
                <p className="text-lg font-bold text-white">
                    {payload[0].value} <span className="text-xs font-normal text-white/60">Activities</span>
                </p>
            </div>
        );
    }
    return null;
};

export function OverviewTab() {
    const [stats, setStats] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any[]>([]);
    const [range, setRange] = useState(7);
    const [loading, setLoading] = useState(true);

    // Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, analyticsRes] = await Promise.all([
                    api.get("/admin/dashboard"),
                    api.get(`/admin/analytics?range=${range}`)
                ]);

                setStats(statsRes.data.data.map((s: any) => ({
                    ...s,
                    icon: iconMap[s.label] || Users
                })));

                setAnalytics(analyticsRes.data.data);
            } catch (error) {
                console.error("Failed to load admin data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [range]); // Re-fetch when range changes

    if (loading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="animate-spin w-8 h-8 text-primary" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
        >
            {/* ================= 1. STATS GRID ================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-strong p-6 rounded-2xl relative overflow-hidden group hover:border-primary/30 transition-colors"
                    >
                        {/* Background Glow Effect */}
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-3 bg-muted rounded-xl border border-border text-primary">
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${stat.trend === "up"
                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                                }`}>
                                {stat.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {stat.change}
                            </span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ================= 2. ANIMATED CHART ================= */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-strong p-6 rounded-3xl border border-white/5"
            >
                {/* Chart Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Activity Overview
                        </h3>
                        <p className="text-sm text-muted-foreground">User registration & content creation trends</p>
                    </div>

                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                        {[7, 30, 90].map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={`px-4 py-1.5 text-sm rounded-lg transition-all ${range === r
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                {r} Days
                            </button>
                        ))}
                    </div>
                </div>

                {/* The Chart */}
                <div className="w-full h-87.5">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>

                            {/* ✅ FIX: Use native SVG tags directly inside the chart */}
                            <defs>
                                <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />

                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                dy={10}
                                tickFormatter={(value) => {
                                    const d = new Date(value);
                                    return `${d.getDate()}/${d.getMonth() + 1}`;
                                }}
                            />

                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                            />

                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                content={<CustomTooltip />}
                            />

                            <Bar
                                dataKey="value"
                                fill="url(#colorBar)"
                                radius={[8, 8, 0, 0]}
                                barSize={40}
                                animationDuration={1500}
                            // Optional: Highlight active bar on hover
                            // activeBar={{ fill: '#a78bfa', strokeWidth: 0 }} 
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </motion.div>
    );
}