import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Phone, PhoneOff, Video as VideoIcon, VideoOff, Mic, MicOff,
    Minimize2
} from "lucide-react";
import { AvatarRing } from "@/components/ui/avatar-ring";

interface CallScreenProps {
    isOpen: boolean;
    callType: "voice" | "video";
    user: {
        name: string;
        avatar: string;
        username: string;
    };
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    endCall: () => void;
    isIncoming?: boolean;
    answerCall?: () => void;
}

export function CallScreen({
    isOpen, callType, user,
    localStream, remoteStream, endCall,
    isIncoming, answerCall
}: CallScreenProps) {
    const [callDuration, setCallDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    // Sync state when call starts
    useEffect(() => {
        if (isOpen) {
            setCallDuration(0);
            setIsMuted(false);
            setIsCameraOff(callType === "voice");
            setIsMinimized(false);
        }
    }, [isOpen, callType]);

    const myVideo = useRef<HTMLVideoElement>(null);
    const userVideo = useRef<HTMLVideoElement>(null);

    // Audio/Video control
    useEffect(() => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });
        }
    }, [isMuted, localStream]);

    useEffect(() => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !isCameraOff;
            });
        }
    }, [isCameraOff, localStream]);

    // Attach Streams
    useEffect(() => {
        if (!isOpen) return;

        const attachStreams = () => {
            if (myVideo.current && localStream && !isCameraOff) {
                myVideo.current.srcObject = localStream;
            }
            if (userVideo.current && remoteStream) {
                userVideo.current.srcObject = remoteStream;
            }
        };

        // Aggressive attachment attempt
        attachStreams();
        
        // Retry for cases where refs might not be ready
        const timeout = setTimeout(attachStreams, 300);
        return () => clearTimeout(timeout);
    }, [localStream, remoteStream, isOpen, isMinimized, isCameraOff]);

    // Timer
    useEffect(() => {
        if (!isOpen || !remoteStream) { setCallDuration(0); return; }
        const interval = setInterval(() => setCallDuration(prev => prev + 1), 1000);
        return () => clearInterval(interval);
    }, [isOpen, remoteStream]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    // Mini View
    if (isMinimized) {
        return (
            <motion.div 
                drag 
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} 
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="fixed bottom-24 right-4 z-50 group"
            >
                <div className="relative p-1 rounded-2xl bg-gradient-to-tr from-primary via-purple-500 to-pink-500 animate-gradient-xy">
                    <motion.div 
                        onClick={() => setIsMinimized(false)} 
                        className="bg-[#1a1a1a] backdrop-blur-xl p-3 rounded-2xl shadow-2xl cursor-pointer hover:bg-neutral-800 transition-colors flex items-center gap-3 pr-5"
                    >
                        <div className="relative">
                            <AvatarRing src={user.avatar} size="sm" />
                            {remoteStream && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a1a] animate-pulse" />
                            )}
                        </div>
                        <div className="min-w-[80px]">
                            <p className="text-sm font-bold text-white truncate">{user.name}</p>
                            <p className="text-[10px] text-primary font-bold animate-pulse">
                                {remoteStream ? formatDuration(callDuration) : "Connecting..."}
                            </p>
                        </div>
                        <div className="p-1.5 glass rounded-full opacity-60 group-hover:opacity-100 transition-opacity">
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                                <Phone className="w-3 h-3 text-white" />
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="fixed inset-0 z-50 bg-[#050505] text-white flex flex-col overflow-hidden"
            >
                {/* Background Decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full animate-blob" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full animate-blob animation-delay-2000" />
                </div>

                {/* VIDEO DISPLAY AREA */}
                <div className="relative flex-1 overflow-hidden">
                    {/* REMOTE MEDIA (Always rendered for voice/video to ensure audio stays active) */}
                    <div className={`absolute inset-0 transition-opacity duration-700 ${callType === "video" && remoteStream ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                        <video 
                            ref={userVideo} 
                            playsInline 
                            autoPlay 
                            className="w-full h-full object-cover" 
                        />
                    </div>

                    {callType === "video" ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            {!remoteStream && (
                                <div className="flex flex-col items-center gap-6">
                                    <div className="relative">
                                        <div className="absolute inset-[-15px] rounded-full border-2 border-primary/50 border-t-transparent animate-spin duration-1000" />
                                        <div className="absolute inset-[-30px] rounded-full border border-primary/20 border-b-transparent animate-spin-reverse duration-1500" />
                                        <AvatarRing src={user.avatar} size="xl" className="w-32 h-32" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-2xl font-bold tracking-tight">{user.name}</h3>
                                        <div className="flex items-center gap-2 justify-center mt-2">
                                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                                            <p className="text-sm font-medium text-primary ml-1 uppercase tracking-widest">
                                                {isIncoming ? "Incoming video call" : "Connecting..."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* LOCAL VIDEO PIP */}
                            <motion.div 
                                drag 
                                dragConstraints={{ left: -300, right: 0, top: 0, bottom: 500 }}
                                initial={{ x: 20, y: 20 }}
                                className="absolute top-8 right-8 w-32 md:w-48 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/10 z-50 glass-strong group"
                            >
                                <AnimatePresence mode="wait">
                                    {isCameraOff ? (
                                        <motion.div 
                                            key="camera-off"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="w-full h-full flex flex-col items-center justify-center bg-neutral-900"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
                                                <VideoOff className="w-6 h-6 text-white/40" />
                                            </div>
                                            <span className="text-[10px] text-white/30 uppercase tracking-tighter">Camera Off</span>
                                        </motion.div>
                                    ) : (
                                        <motion.video 
                                            key="camera-on"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            ref={myVideo} 
                                            playsInline 
                                            muted 
                                            autoPlay 
                                            className="w-full h-full object-cover transform scale-x-[-1]" 
                                        />
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="relative mb-8 group">
                                <motion.div 
                                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                    transition={{ repeat: Infinity, duration: 4 }}
                                    className="absolute inset-[-40px] rounded-full bg-primary/10 blur-3xl" 
                                />
                                <AvatarRing src={user.avatar} size="xl" className="w-44 h-44 shadow-2xl border-4 border-white/5" />
                                {remoteStream && (
                                    <div className="absolute -bottom-2 right-4 bg-green-500 rounded-full p-2 border-4 border-[#050505]">
                                        <Mic className="w-5 h-5 text-white" />
                                    </div>
                                )}
                            </div>
                            <h2 className="text-4xl font-extrabold mb-3 tracking-tight">{user.name}</h2>
                            <div className="flex items-center gap-3">
                                {remoteStream ? (
                                    <div className="px-4 py-1.5 glass rounded-full border border-primary/20 bg-primary/5">
                                        <span className="text-primary font-bold tracking-widest tabular-nums">{formatDuration(callDuration)}</span>
                                    </div>
                                ) : (
                                    <p className="text-primary font-bold tracking-[0.3em] text-xs uppercase animate-pulse">
                                        {isIncoming ? "Incoming conversation" : "Establishing connection"}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Top Controls */}
                    <div className="absolute top-8 left-8 z-50 flex items-center gap-4">
                        <motion.button 
                            whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => { setIsMinimized(true); }} 
                            className="p-3.5 glass rounded-2xl text-white/80 hover:text-white transition-colors flex items-center gap-2"
                        >
                            <Minimize2 className="w-5 h-5" />
                            <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Minimize</span>
                        </motion.button>
                        
                        {/* ✅ Fix Lint: Optionally use onClose here if we wanted a separate 'back' button, 
                            but since minimize exists, let's just use it to avoid redundancy. */}
                    </div>
                </div>

                {/* BOTTOM ACTION BAR */}
                <div className="h-40 bg-gradient-to-t from-black via-black/90 to-transparent flex items-center justify-center px-6">
                    <motion.div 
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="glass-strong rounded-[40px] p-5 flex items-center gap-6 sm:gap-10 shadow-3xl border border-white/5"
                    >
                        {isIncoming && !remoteStream ? (
                            <div className="flex items-center gap-14 px-8">
                                <div className="flex flex-col items-center gap-3">
                                    <motion.button 
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={endCall} 
                                        className="p-7 rounded-3xl bg-red-500 shadow-2xl shadow-red-500/40 text-white"
                                    >
                                        <PhoneOff className="w-9 h-9" />
                                    </motion.button>
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Decline</span>
                                </div>
                                
                                <div className="flex flex-col items-center gap-3">
                                    <motion.button 
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={answerCall} 
                                        className="p-7 rounded-3xl bg-green-500 shadow-2xl shadow-green-500/40 text-white animate-pulse"
                                    >
                                        <Phone className="w-9 h-9" />
                                    </motion.button>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">Accept</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col items-center gap-2">
                                    <motion.button 
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setIsMuted(!isMuted)} 
                                        className={`p-5 rounded-2xl transition-all duration-300 ${isMuted ? "bg-red-500 text-white shadow-xl shadow-red-500/30" : "bg-white/10 hover:bg-white/20"}`}
                                    >
                                        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                                    </motion.button>
                                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">{isMuted ? "Muted" : "Mute"}</span>
                                </div>

                                <motion.button 
                                    whileHover={{ scale: 1.1, rotate: 135 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={endCall} 
                                    className="p-7 rounded-[32px] bg-red-600 shadow-2xl shadow-red-600/50 text-white border border-white/10 group"
                                >
                                    <PhoneOff className="w-10 h-10 transition-transform group-hover:scale-90" />
                                </motion.button>

                                {callType === "video" && (
                                    <div className="flex flex-col items-center gap-2">
                                        <motion.button 
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setIsCameraOff(!isCameraOff)} 
                                            className={`p-5 rounded-2xl transition-all duration-300 ${isCameraOff ? "bg-neutral-700 text-white shadow-xl" : "bg-white/10 hover:bg-white/20"}`}
                                        >
                                            {isCameraOff ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
                                        </motion.button>
                                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">{isCameraOff ? "Hidden" : "Camera"}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
