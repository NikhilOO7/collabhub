import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize socket connection with reconnection options
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token'),
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Handle connection events
      newSocket.on('connect', () => {
        console.log('Socket connected');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      setSocket(newSocket);

      // Clean up socket connection on unmount
      return () => {
        if (newSocket) {
          newSocket.off('connect');
          newSocket.off('connect_error');
          newSocket.off('disconnect');
          newSocket.disconnect();
        }
      };
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (socket) {
      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
      };
    }
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);