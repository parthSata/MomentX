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
            console.log("[Call] incoming call request:", data.callType, "from:", data.name);
            const type = data.callType || "voice";
            
            // Batch updates or at least ensure order
            setChatUser({
                _id: data.from,
                name: data.name,
                profilePic: data.avatar || "/image.png",
                username: data.username || "user"
            });
            setIncomingCall({ 
                isReceiving: true, 
                from: data.from, 
                signal: data.signal, 
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

        console.log("[Call] Initiating", type, "call to", target.name);

        navigator.mediaDevices
            .getUserMedia({ video: type === "video", audio: true })
            .then((currentStream) => {
                console.log("[Call] Local stream for initiation obtained. Video tracks:", currentStream.getVideoTracks().length);
                setStream(currentStream);
                
                const peer = new Peer({ initiator: true, trickle: false, stream: currentStream });
                
                peer.on("signal", (data) => {
                    console.log("[Call] Sending initiation signal to", target._id);
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
                    console.log("Remote stream received in initiateCall (Caller side)");
                    setRemoteStream(remote);
                });
                connectionRef.current = peer;
            })
            .catch((err) => {
                console.error("getUserMedia error:", err);
                toast.error("Could not access camera/microphone");
                setIsCallActive(false);
            });
    };

    const answerCall = () => {
        if (!incomingCall) return;
        
        const actualCallType = incomingCall.callType || "video";
        console.log("[Call] Answering as:", actualCallType);
        
        setCallAccepted(true);
        setCallType(actualCallType);
        
        navigator.mediaDevices
            .getUserMedia({ video: actualCallType === "video", audio: true })
            .then((currentStream) => {
                console.log("[Call] Local stream obtained for answering. Video tracks:", currentStream.getVideoTracks().length);
                setStream(currentStream);
                
                const peer = new Peer({ initiator: false, trickle: false, stream: currentStream });
                
                peer.on("signal", (data) => {
                    console.log("[Call] Sending answer signal to", incomingCall.from);
                    socket?.emit("answerCall", { signal: data, to: incomingCall.from });
                });
                
                peer.on("stream", (remote) => {
                    console.log("[Call] Remote stream arrived (Receiver side). Video tracks:", remote.getVideoTracks().length);
                    setRemoteStream(remote);
                });
                
                peer.signal(incomingCall.signal);
                connectionRef.current = peer;
            })
            .catch((err) => {
                console.error("answerCall media error:", err);
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
