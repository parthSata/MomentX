import { useState } from "react";
import { motion } from "framer-motion";
import {
    Shield,
    Bell,
    Save,
    Loader2,
    Server,
    Mail
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// --- Reusable Switch Component ---
function Switch({ checked, onCheckedChange, disabled = false }: { checked: boolean; onCheckedChange: (c: boolean) => void; disabled?: boolean }) {
    return (
        <button
            disabled={disabled}
            onClick={() => onCheckedChange(!checked)}
            className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${checked ? "bg-primary" : "bg-muted"
                } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
            <motion.div
                initial={false}
                animate={{ x: checked ? 22 : 2 }}
                className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm"
            />
        </button>
    );
}

export function SettingsTab() {
    const [saving, setSaving] = useState(false);

    // ✅ Simplified State Object
    const [config, setConfig] = useState({
        // System
        maintenanceMode: false,
        allowRegistrations: true,
        autoModeration: true,

        // Notifications
        emailAlerts: true,
        securityAlerts: true,

        // Admin Info
        adminEmail: "admin@momentx.com",
        backupEmail: "backup@momentx.com"
    });

    const handleToggle = (key: keyof typeof config) => {
        setConfig(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleChange = (key: keyof typeof config, value: string) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    // ✅ Save Function
    const handleSave = async () => {
        setSaving(true);
        try {
            // Simulate API Call (Uncomment below line when connecting to real backend)
            // await api.patch('/admin/settings', config);

            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success("Settings updated successfully");
        } catch (error) {
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold">Platform Settings</h3>
                    <p className="text-sm text-muted-foreground">Control system behavior and notifications.</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-primary text-white rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </motion.button>
            </div>

            {/* 1. System Controls */}
            <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="glass-strong rounded-2xl p-6 border border-border/50 shadow-sm bg-card/50"
            >
                <h4 className="font-semibold flex items-center gap-2 mb-4 text-primary">
                    <Server className="w-5 h-5" /> System Controls
                </h4>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                        <div>
                            <p className="font-medium text-foreground">Maintenance Mode</p>
                            <p className="text-xs text-muted-foreground">Disable access for non-admin users.</p>
                        </div>
                        <Switch checked={config.maintenanceMode} onCheckedChange={() => handleToggle("maintenanceMode")} />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                        <div>
                            <p className="font-medium text-foreground">Allow New Registrations</p>
                            <p className="text-xs text-muted-foreground">Let new users sign up to the platform.</p>
                        </div>
                        <Switch checked={config.allowRegistrations} onCheckedChange={() => handleToggle("allowRegistrations")} />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                        <div>
                            <p className="font-medium text-foreground">AI Auto-Moderation</p>
                            <p className="text-xs text-muted-foreground">Automatically flag inappropriate content.</p>
                        </div>
                        <Switch checked={config.autoModeration} onCheckedChange={() => handleToggle("autoModeration")} />
                    </div>
                </div>
            </motion.div>

            {/* 2. Notifications & Security */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="glass-strong rounded-2xl p-6 border border-border/50 shadow-sm bg-card/50"
                >
                    <h4 className="font-semibold flex items-center gap-2 mb-4 text-primary">
                        <Bell className="w-5 h-5" /> Alerts
                    </h4>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Email Notifications</span>
                            <Switch checked={config.emailAlerts} onCheckedChange={() => handleToggle("emailAlerts")} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Security Alerts (Login/IP)</span>
                            <Switch checked={config.securityAlerts} onCheckedChange={() => handleToggle("securityAlerts")} />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="glass-strong rounded-2xl p-6 border border-border/50 shadow-sm bg-card/50"
                >
                    <h4 className="font-semibold flex items-center gap-2 mb-4 text-primary">
                        <Mail className="w-5 h-5" /> Contact Config
                    </h4>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Primary Admin Email</label>
                            <Input
                                variant="glass"
                                value={config.adminEmail}
                                onChange={(e) => handleChange("adminEmail", e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Backup Support Email</label>
                            <Input
                                variant="glass"
                                value={config.backupEmail}
                                onChange={(e) => handleChange("backupEmail", e.target.value)}
                            />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* 3. Danger Zone */}
            <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6"
            >
                <h4 className="font-semibold flex items-center gap-2 mb-4 text-red-500">
                    <Shield className="w-5 h-5" /> Danger Zone
                </h4>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <p className="font-medium text-foreground">Clear System Cache</p>
                        <p className="text-xs text-muted-foreground">Force refresh all cached data. Might slow down the site temporarily.</p>
                    </div>
                    <button
                        onClick={() => toast.success("Cache cleared")}
                        className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm hover:bg-red-500/20 transition-colors"
                    >
                        Clear Cache
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}