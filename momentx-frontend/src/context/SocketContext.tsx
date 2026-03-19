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

        if (!socket) {
            const newSocket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000', {
                transports: ['websocket'],
                withCredentials: true,
                reconnection: true,
                reconnectionAttempts: 10,
                timeout: 20000
            });

            newSocket.on('connect', () => {
                newSocket.emit('join_user_room', user._id);
            });

            setSocket(newSocket);
        } else {
            // Re-join just in case
            socket.emit('join_user_room', user._id);
        }
    }, [user?._id, socket]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
