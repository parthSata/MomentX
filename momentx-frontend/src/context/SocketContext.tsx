import React, { createContext, useContext, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = React.useState<Socket | null>(null);

    useEffect(() => {
        if (!user?._id) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        // Only create if not exists
        if (!socket) {
            const newSocket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000', {
                transports: ['websocket'],
                withCredentials: true,
                reconnection: true,
                reconnectionAttempts: 5
            });

            newSocket.on('connect', () => {
                newSocket.emit('join_user_room', user._id);
            });

            newSocket.on('connect_error', (err) => {
                console.error("[Socket] Connection error:", err.message);
            });

            setSocket(newSocket);
        }

        return () => {
            // Cleanup logic if needed when user changes
        };
    }, [user?._id, socket]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
