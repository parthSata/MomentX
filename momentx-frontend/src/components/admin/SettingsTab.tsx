import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Bell, FileText, Shield, Trash2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";

// --- Custom Switch Component (for self-containment) ---
function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (c: boolean) => void }) {
    return (
        <button
            onClick={() => onCheckedChange(!checked)}
            className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${checked ? "bg-primary" : "bg-white/20"
                }`}
        >
            <motion.div
                initial={false}
                animate={{ x: checked ? 24 : 2 }}
                className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm"
            />
        </button>
    );
}

export function SettingsTab() {
    // State for all settings
    const [settings, setSettings] = useState([
        {
            category: "General",
            items: [
                { id: "siteName", label: "Site Name", type: "text", value: "MomentX" },
                { id: "supportEmail", label: "Support Email", type: "text", value: "support@momentx.com" },
                { id: "maintenanceMode", label: "Maintenance Mode", type: "toggle", value: false },
            ]
        },
        {
            category: "Notifications",
            items: [
                { id: "emailNotifs", label: "Email Notifications", type: "toggle", value: true },
                { id: "pushNotifs", label: "Push Notifications", type: "toggle", value: true },
                { id: "weeklyDigest", label: "Weekly Digest", type: "toggle", value: false },
            ]
        },
        {
            category: "Content",
            items: [
                { id: "autoModeration", label: "Auto-Moderation AI", type: "toggle", value: true },
                { id: "allowComments", label: "Allow Comments", type: "toggle", value: true },
                { id: "maxUploadSize", label: "Max Upload Size (MB)", type: "number", value: 50 },
            ]
        },
        {
            category: "Security",
            items: [
                { id: "twoFactor", label: "Require 2FA for Admins", type: "toggle", value: true },
                { id: "sessionTimeout", label: "Session Timeout (mins)", type: "number", value: 30 },
            ]
        }
    ]);

    // Handler to update specific setting
    const handleSettingChange = (categoryIndex: number, itemIndex: number, newValue: string | number | boolean) => {
        const newSettings = [...settings];
        newSettings[categoryIndex].items[itemIndex].value = newValue;
        setSettings(newSettings);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto space-y-6"
        >
            {settings.map((section, categoryIndex) => (
                <motion.div
                    key={section.category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: categoryIndex * 0.1 }}
                    className="glass-strong rounded-2xl overflow-hidden"
                >
                    <div className="p-4 border-b border-border/50 bg-gradient-primary/10">
                        <h3 className="font-semibold flex items-center gap-2">
                            {section.category === "General" && <Globe className="w-5 h-5 text-primary" />}
                            {section.category === "Notifications" && <Bell className="w-5 h-5 text-primary" />}
                            {section.category === "Content" && <FileText className="w-5 h-5 text-primary" />}
                            {section.category === "Security" && <Shield className="w-5 h-5 text-primary" />}
                            {section.category}
                        </h3>
                    </div>
                    <div className="divide-y divide-border/50">
                        {section.items.map((item, itemIndex) => (
                            <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                                <div>
                                    <p className="font-medium">{item.label}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {item.type === "toggle"
                                            ? `Currently ${item.value ? "enabled" : "disabled"}`
                                            : `Current value: ${item.value}`
                                        }
                                    </p>
                                </div>

                                {item.type === "toggle" ? (
                                    <Switch
                                        checked={item.value as boolean}
                                        onCheckedChange={(checked) => handleSettingChange(categoryIndex, itemIndex, checked)}
                                    />
                                ) : (
                                    <Input
                                        variant="glass"
                                        type={item.type}
                                        value={item.value as string | number}
                                        onChange={(e) => handleSettingChange(categoryIndex, itemIndex, e.target.value)}
                                        className="w-40 text-right"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            ))}

            {/* Danger Zone */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-strong rounded-2xl overflow-hidden border border-red-500/30"
            >
                <div className="p-4 border-b border-red-500/30 bg-red-500/10">
                    <h3 className="font-semibold text-red-500 flex items-center gap-2">
                        <Trash2 className="w-5 h-5" />
                        Danger Zone
                    </h3>
                </div>
                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Clear Cache</p>
                            <p className="text-sm text-muted-foreground">Clear all cached server data</p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 rounded-xl font-medium transition-colors"
                        >
                            Clear
                        </motion.button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Reset Database</p>
                            <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-xl font-medium transition-colors"
                        >
                            Reset
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Save Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-primary text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
            >
                <Check className="w-5 h-5" />
                Save All Changes
            </motion.button>
        </motion.div>
    );
}