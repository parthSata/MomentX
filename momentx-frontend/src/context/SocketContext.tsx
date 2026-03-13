import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!user?._id) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            return;
        }

        if (!socketRef.current) {
            socketRef.current = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000', {
                transports: ['websocket'],
                withCredentials: true,
            });

            socketRef.current.on('connect', () => {
                socketRef.current?.emit('join_user_room', user._id);
            });
        }

        return () => {
            // We keep it alive as long as user is logged in
        };
    }, [user?._id]);

    return (
        <SocketContext.Provider value={socketRef.current}>
            {children}
        </SocketContext.Provider>
    );
};
