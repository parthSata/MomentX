import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Phone,
    PhoneOff,
    Video,
    VideoOff,
    Mic,
    MicOff,
    Volume2,
    Camera,
    RotateCcw,
    Minimize2
} from "lucide-react";
import { AvatarRing } from "@/components/ui/avatar-ring";

interface CallScreenProps {
    isOpen: boolean;
    onClose: () => void;
    callType: "voice" | "video";
    user: {
        name: string;
        avatar: string;
        username: string;
    };
}

export function CallScreen({ isOpen, onClose, callType, user }: CallScreenProps) {
    const [callStatus, setCallStatus] = useState<"calling" | "ringing" | "connected" | "ended">("calling");
    const [callDuration, setCallDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setCallStatus("calling");
            setCallDuration(0);
            setIsMuted(false);
            setIsCameraOff(false);
            setIsSpeakerOn(false);
            setIsMinimized(false);
            return;
        }

        // Simulate call connection
        const ringingTimeout = setTimeout(() => setCallStatus("ringing"), 1500);
        const connectedTimeout = setTimeout(() => setCallStatus("connected"), 4000);

        return () => {
            clearTimeout(ringingTimeout);
            clearTimeout(connectedTimeout);
        };
    }, [isOpen]);

    useEffect(() => {
        if (callStatus !== "connected") return;

        const interval = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [callStatus]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleEndCall = () => {
        setCallStatus("ended");
        setTimeout(onClose, 1000);
    };

    const getStatusText = () => {
        switch (callStatus) {
            case "calling": return "Calling...";
            case "ringing": return "Ringing...";
            case "connected": return formatDuration(callDuration);
            case "ended": return "Call ended";
        }
    };

    if (!isOpen) return null;

    // Minimized call view
    if (isMinimized) {
        return (
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="fixed top-20 right-4 z-50"
            >
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setIsMinimized(false)}
                    className="bg-gradient-primary p-3 rounded-2xl shadow-2xl cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <AvatarRing src={user.avatar} size="sm" />
                        <div className="text-white">
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs opacity-80">{getStatusText()}</p>
                        </div>
                        {callType === "video" ? (
                            <Video className="w-5 h-5 text-white" />
                        ) : (
                            <Phone className="w-5 h-5 text-white" />
                        )}
                    </div>
                </motion.div>
            </motion.div>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-background"
            >
                {/* Video Background (for video calls) */}
                {callType === "video" && callStatus === "connected" && !isCameraOff && (
                    <div className="absolute inset-0">
                        {/* Remote video (simulated with gradient) */}
                        <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-background to-accent/20" />

                        {/* Local video preview */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            drag
                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                            className="absolute top-20 right-4 w-32 h-44 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20"
                        >
                            <div className="w-full h-full bg-linear-to-br from-primary via-accent to-secondary" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white/60 text-xs">Your camera</span>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsMinimized(true)}
                        className="p-2 glass rounded-full"
                    >
                        <Minimize2 className="w-5 h-5" />
                    </motion.button>

                    <div className="flex items-center gap-2">
                        {callType === "video" && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 glass rounded-full"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* User Info - Center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {(callType === "voice" || callStatus !== "connected" || isCameraOff) && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center"
                        >
                            {/* Pulsing ring effect during calling/ringing */}
                            <div className="relative">
                                {(callStatus === "calling" || callStatus === "ringing") && (
                                    <>
                                        <motion.div
                                            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                            className="absolute inset-0 rounded-full bg-primary/30"
                                            style={{ width: 120, height: 120, marginLeft: -10, marginTop: -10 }}
                                        />
                                        <motion.div
                                            animate={{ scale: [1, 1.3], opacity: [0.3, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                                            className="absolute inset-0 rounded-full bg-primary/20"
                                            style={{ width: 120, height: 120, marginLeft: -10, marginTop: -10 }}
                                        />
                                    </>
                                )}
                                <AvatarRing
                                    src={user.avatar}
                                    size="lg"
                                    className="w-24 h-24"
                                />
                            </div>

                            <h2 className="text-2xl font-bold mt-6">{user.name}</h2>
                            <p className="text-muted-foreground">@{user.username}</p>

                            <motion.p
                                key={callStatus}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`mt-4 text-lg ${callStatus === "connected" ? "text-green-400" : "text-muted-foreground"}`}
                            >
                                {callType === "video" ? "Video " : "Voice "}{getStatusText()}
                            </motion.p>

                            {/* Encryption notice */}
                            <div className="flex items-center gap-2 mt-4 text-muted-foreground text-sm">
                                <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                </div>
                                <span>End-to-end encrypted</span>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Controls */}
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute bottom-0 left-0 right-0 p-8 pb-12"
                >
                    <div className="flex items-center justify-center gap-6">
                        {/* Mute */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsMuted(!isMuted)}
                            className={`p-4 rounded-full ${isMuted ? "bg-white text-black" : "glass"}`}
                        >
                            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </motion.button>

                        {/* Camera (video call only) */}
                        {callType === "video" && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsCameraOff(!isCameraOff)}
                                className={`p-4 rounded-full ${isCameraOff ? "bg-white text-black" : "glass"}`}
                            >
                                {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                            </motion.button>
                        )}

                        {/* End Call */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleEndCall}
                            className="p-5 rounded-full bg-red-500 text-white"
                        >
                            <PhoneOff className="w-7 h-7" />
                        </motion.button>

                        {/* Speaker */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                            className={`p-4 rounded-full ${isSpeakerOn ? "bg-white text-black" : "glass"}`}
                        >
                            <Volume2 className="w-6 h-6" />
                        </motion.button>

                        {/* Flip Camera (video call only) */}
                        {callType === "video" && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-4 rounded-full glass"
                            >
                                <Camera className="w-6 h-6" />
                            </motion.button>
                        )}
                    </div>

                    {/* Additional options during connected call */}
                    {callStatus === "connected" && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-center gap-8 mt-6"
                        >
                            <button className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                                Effects
                            </button>
                            <button className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                                Add person
                            </button>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
