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
      auth: {
        token
      }
    });

    // Lyssna efter nya meddelanden
    socketRef.current.on('receive_message', (message) => {
      addMessage(message);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [addMessage]);

  // Funktion för att gå med i en konversation
  const joinConversation = (conversationId: string) => {
    socketRef.current?.emit('join_conversation', conversationId);
  };

  // Funktion för att skicka meddelande
  const sendMessage = (conversationId: string, message: any) => {
    socketRef.current?.emit('send_message', {
      conversationId,
      message
    });
  };

  return {
    joinConversation,
    sendMessage
  };
};