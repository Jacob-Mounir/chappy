import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '../store/useStore';

const isDevelopment = process.env.NODE_ENV === 'development';

const SOCKET_URL = isDevelopment
  ? 'http://localhost:5001'
  : 'https://chappyv.onrender.com';

export const useSocket = () => {
  const socketRef = useRef<Socket>();
  const { userState, addMessage } = useStore();

  useEffect(() => {
    // Skapa socket anslutning med auth token
    const token = localStorage.getItem('token');
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      auth: { token }
    });

    // Lyssna efter nya meddelanden
    const handleMessage = (message: any) => {
      // Kontrollera att meddelandet inte redan finns
      addMessage(message);
    };

    socketRef.current.on('receive_message', handleMessage);

    return () => {
      socketRef.current?.off('receive_message', handleMessage);
      socketRef.current?.disconnect();
    };
  }, [addMessage]);

  // Funktion för att skicka meddelande med optimistisk uppdatering
  const sendMessage = (conversationId: string, message: any) => {
    // Lägg till meddelandet lokalt direkt (optimistisk uppdatering)
    addMessage(message);

    // Skicka via Socket.IO
    socketRef.current?.emit('send_message', {
      conversationId,
      message
    });
  };

  const joinConversation = (conversationId: string) => {
    socketRef.current?.emit('join_conversation', conversationId);
  };

  return {
    joinConversation,
    sendMessage
  };
};