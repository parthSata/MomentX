import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import Peer from 'simple-peer';
import { CallScreen } from '@/components/chat/CallScreen';
import { toast } from 'sonner';

interface CallContextType {
    isCallActive: boolean;
    callType: "voice" | "video";
    initiateCall: (targetUser: any, type: "voice" | "video") => void;
    answerCall: () => void;
    leaveCall: () => void;
    incomingCall: any;
    callAccepted: boolean;
    stream: MediaStream | null;
    remoteStream: MediaStream | null;
    chatUser: any;
}

const CallContext = createContext<CallContextType | null>(null);

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) throw new Error("useCall must be used within CallProvider");
    return context;
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const socket = useSocket();
    const { user: currentUser } = useAuth();

    const [isCallActive, setIsCallActive] = useState(false);
    const [callType, setCallType] = useState<"voice" | "video">("voice");
    const [incomingCall, setIncomingCall] = useState<any>(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [chatUser, setChatUser] = useState<any>(null);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    const connectionRef = useRef<Peer.Instance | null>(null);

    useEffect(() => {
        if (!socket) return;

        socket.on("callUser", (data: any) => {


            if (!data) return;

            // Robustly extract callType from possible keys
            // check top level, type, or nested in signalData (original simple-peer structure)
            const incomingType = data.callType || data.type || (data.signalData?.callType) || "voice";
            const type = String(incomingType).toLowerCase() === "video" ? "video" : "voice";


            setChatUser({
                _id: data.from,
                name: data.name,
                profilePic: data.avatar || "/image.png",
                username: data.username || "user"
            });
            setIncomingCall({
                isReceiving: true,
                from: data.from,
                signal: data.signal || data.signalData,
                name: data.name,
                callType: type
            });
            setCallType(type);
            setIsCallActive(true);
        });

        socket.on("callAccepted", (signal: any) => {
            setCallAccepted(true);
            connectionRef.current?.signal(signal);
        });

        socket.on("callEnded", () => {
            leaveCall();
        });

        return () => {
            socket.off("callUser");
            socket.off("callAccepted");
            socket.off("callEnded");
        };
    }, [socket]);

    const initiateCall = (target: any, type: "voice" | "video") => {
        if (!currentUser || !target._id) return;

        setCallType(type);
        setChatUser(target);
        setIsCallActive(true);

        navigator.mediaDevices
            .getUserMedia({ video: type === "video", audio: true })
            .then((currentStream) => {
                setStream(currentStream);

                const peer = new Peer({
                    initiator: true,
                    trickle: false,
                    stream: currentStream,
                    config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
                });

                peer.on("signal", (data) => {
                    socket?.emit("callUser", {
                        userToCall: target._id,
                        signalData: data,
                        from: currentUser._id,
                        name: currentUser.name,
                        avatar: currentUser.profilePic,
                        username: currentUser.username,
                        callType: type
                    });
                });
                peer.on("stream", (remote) => {
                    setRemoteStream(remote);
                });
                peer.on("error", (err) => {
                    console.error("[Call] Peer error (Caller):", err);
                    toast.error("Connection error");
                    leaveCall();
                });
                connectionRef.current = peer;
            })
            .catch((err) => {
                console.error("[Call] getUserMedia error:", err);
                toast.error("Could not access camera/microphone");
                setIsCallActive(false);
            });
    };

    const answerCall = () => {
        if (!incomingCall) return;

        const actualCallType = incomingCall.callType || "voice";

        setCallAccepted(true);
        setCallType(actualCallType);

        navigator.mediaDevices
            .getUserMedia({ video: actualCallType === "video", audio: true })
            .then((currentStream) => {
                setStream(currentStream);

                const peer = new Peer({
                    initiator: false,
                    trickle: false,
                    stream: currentStream,
                    config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
                });

                peer.on("signal", (data) => {
                    socket?.emit("answerCall", { signal: data, to: incomingCall.from });
                });

                peer.on("stream", (remote) => {
                    setRemoteStream(remote);
                });

                peer.on("error", (err) => {
                    console.error("[Call] Peer error (Receiver):", err);
                    toast.error("Connection error");
                    leaveCall();
                });

                peer.signal(incomingCall.signal);
                connectionRef.current = peer;
            })
            .catch((err) => {
                console.error("[Call] Media error in answerCall:", err);
                toast.error("Could not access camera/microphone");
                leaveCall();
            });
    };

    const leaveCall = () => {
        setCallAccepted(false);
        setIsCallActive(false);
        setIncomingCall(null);
        setCallType("voice");

        connectionRef.current?.destroy();
        connectionRef.current = null;

        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
        setRemoteStream(null);

        if (chatUser?._id) {
            socket?.emit("endCall", { to: chatUser._id });
        }
    };

    return (
        <CallContext.Provider value={{
            isCallActive, callType, initiateCall, answerCall, leaveCall,
            incomingCall, callAccepted, stream, remoteStream, chatUser
        }}>
            {children}
            <CallScreen
                key={isCallActive ? `active-${callType}` : "inactive"}
                isOpen={isCallActive}
                callType={callType}
                user={{
                    name: chatUser?.name || "User",
                    avatar: chatUser?.profilePic || chatUser?.avatar || "/image.png",
                    username: chatUser?.username || "user",
                }}
                localStream={stream}
                remoteStream={remoteStream}
                endCall={leaveCall}
                isIncoming={!!incomingCall && !callAccepted}
                answerCall={answerCall}
            />
        </CallContext.Provider>
    );
};
