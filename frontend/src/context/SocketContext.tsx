import { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '../store/useStore';
import { toast } from 'sonner';
import { socketService } from '../services/socket';

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socketService.disconnect();
        setSocket(null);
      }
      return;
    }

    const token = localStorage.getItem('token');
    const guestName = localStorage.getItem('guestName');

    const newSocket = socketService.connect(token, guestName);

    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      toast.success('Connected to chat server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Connection error: ' + error.message);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        newSocket.connect();
      } else if (reason === 'transport close') {
        toast.error('Lost connection to chat server');
      }
    });

    setSocket(newSocket);

    return () => {
      socketService.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};