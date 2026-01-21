import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Phone, PhoneOff, Video as VideoIcon, VideoOff, Mic, MicOff,
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
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    endCall: () => void;
    isIncoming?: boolean;
    answerCall?: () => void;
}

export function CallScreen({
    isOpen, onClose, callType, user,
    localStream, remoteStream, endCall,
    isIncoming, answerCall
}: CallScreenProps) {
    const [callDuration, setCallDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    const myVideo = useRef<HTMLVideoElement>(null);
    const userVideo = useRef<HTMLVideoElement>(null);

    // Attach Streams
    useEffect(() => {
        if (myVideo.current && localStream) {
            myVideo.current.srcObject = localStream;
        }
    }, [localStream, isOpen, isMinimized]);

    useEffect(() => {
        if (userVideo.current && remoteStream) {
            userVideo.current.srcObject = remoteStream;
        }
    }, [remoteStream, isOpen, isMinimized]);

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
            <motion.div drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} className="fixed top-20 right-4 z-50">
                <motion.div onClick={() => setIsMinimized(false)} className="bg-gradient-primary p-3 rounded-2xl shadow-2xl cursor-pointer">
                    <div className="flex items-center gap-3">
                        <AvatarRing src={user.avatar} size="sm" />
                        <div className="text-white">
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs opacity-80">{remoteStream ? formatDuration(callDuration) : "Calling..."}</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        );
    }

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background">

                {/* REMOTE VIDEO */}
                {callType === "video" && (
                    <div className="absolute inset-0 bg-black">
                        {remoteStream && (
                            <video ref={userVideo} playsInline autoPlay className="w-full h-full object-cover" />
                        )}
                        {/* LOCAL VIDEO PIP */}
                        {!isCameraOff && (
                            <motion.div drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} className="absolute top-20 right-4 w-32 h-44 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 z-50">
                                <video ref={myVideo} playsInline muted autoPlay className="w-full h-full object-cover transform scale-x-[-1]" />
                            </motion.div>
                        )}
                    </div>
                )}

                {/* Overlay UI */}
                <div className="absolute inset-0 flex flex-col justify-between p-4 z-10 pointer-events-none">
                    <div className="flex justify-between pointer-events-auto">
                        <button onClick={() => { setIsMinimized(true); onClose(); }} className="p-2 glass rounded-full"><Minimize2 className="w-5 h-5" /></button>
                    </div>

                    {/* Info / Status */}
                    {(callType === "voice" || !remoteStream) && (
                        <div className="flex flex-col items-center justify-center flex-1">
                            <AvatarRing src={user.avatar} size="lg" className="w-32 h-32 mb-6" />
                            <h2 className="text-2xl font-bold">{user.name}</h2>
                            <p className="text-green-400 mt-2">{remoteStream ? formatDuration(callDuration) : isIncoming ? "Incoming Call..." : "Calling..."}</p>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="flex justify-center gap-6 mb-8 pointer-events-auto">
                        {isIncoming && !remoteStream ? (
                            <>
                                <button onClick={endCall} className="p-5 rounded-full bg-red-500 text-white"><PhoneOff className="w-7 h-7" /></button>
                                <button onClick={answerCall} className="p-5 rounded-full bg-green-500 text-white"><Phone className="w-7 h-7" /></button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-full ${isMuted ? "bg-white text-black" : "glass"}`}>{isMuted ? <MicOff /> : <Mic />}</button>
                                <button onClick={endCall} className="p-5 rounded-full bg-red-500 text-white"><PhoneOff className="w-7 h-7" /></button>
                                {callType === "video" && <button onClick={() => setIsCameraOff(!isCameraOff)} className={`p-4 rounded-full ${isCameraOff ? "bg-white text-black" : "glass"}`}>{isCameraOff ? <VideoOff /> : <VideoIcon />}</button>}
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}