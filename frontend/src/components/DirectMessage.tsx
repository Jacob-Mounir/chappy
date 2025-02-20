import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../store';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import api from '../lib/api';
import type { User, Message } from '../types/chat';

export const DirectMessage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [recipient, setRecipient] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDirectMessages = async () => {
      try {
        setIsLoading(true);
        const [userRes, messagesRes] = await Promise.all([
          api.get<User>(`/api/users/${userId}`),
          api.get<Message[]>(`/api/direct-messages/${userId}`)
        ]);

        setRecipient(userRes.data);
        setMessages(messagesRes.data);
      } catch (error) {
        console.error('Error loading direct messages:', error);
        setError('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadDirectMessages();
    }
  }, [userId]);

  const handleSendMessage = async (content: string) => {
    if (!userId || !content.trim()) return;

    try {
      const { data } = await api.post<Message>(`/api/direct-messages/${userId}`, {
        content: content.trim()
      });

      setMessages(prev => [...prev, data]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading conversation...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (!recipient) {
    return <div className="p-4">User not found</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-700 p-4">
        <h2 className="text-xl font-semibold">
          Chat with {recipient.username}
          <span className="ml-2 text-sm text-gray-400">
            {recipient.isOnline ? 'Online' : 'Offline'}
          </span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <MessageList messages={messages} />
      </div>

      <div className="border-t border-gray-700 p-4">
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};