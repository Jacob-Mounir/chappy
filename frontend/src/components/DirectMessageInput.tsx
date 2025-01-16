import { useState, FormEvent } from 'react';
import { useStore } from '../store/useStore';
import { useSocket } from '../hooks/useSocket';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send } from 'lucide-react';
import type { DirectMessage } from '../types/store';

export function DirectMessageInput() {
  const { currentConversation, userState } = useStore();
  const { sendMessage } = useSocket();
  const [content, setContent] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !currentConversation || !userState || userState.type !== 'authenticated') return;

    try {
      const message: DirectMessage = {
        _id: Date.now().toString(), // Temporärt ID tills servern ger oss ett riktigt
        content: content.trim(),
        sender: userState,
        recipient: {
          _id: currentConversation._id,
          username: currentConversation.username,
          email: '', // Detta är inte optimalt men krävs av typen
          type: 'authenticated'
        },
        createdAt: new Date().toISOString()
      };

      // Skicka via Socket.IO
      sendMessage(currentConversation._id, message);
      setContent('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
      <div className="flex gap-2">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!content.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}