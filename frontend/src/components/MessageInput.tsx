import React, { useState } from "react";
import { useStore } from "../store/useStore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send } from "lucide-react";

export function MessageInput() {
  const [message, setMessage] = useState("");
  const { sendMessage, currentChannel, userState, guestName, setError } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentChannel) return;

    try {
      // Check if this is the nyheter channel and user is not authenticated
      if (currentChannel.name === 'nyheter' && userState?.type !== 'authenticated') {
        setError('Only authenticated users can send messages in the news channel');
        return;
      }

      const currentGuestName = useStore.getState().guestName;
      if (userState?.type === 'guest') {
        if (!currentGuestName) {
          console.error('No guest name found!');
          return;
        }
        await sendMessage(message.trim(), currentGuestName);
      } else {
        await sendMessage(message.trim());
      }
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-2 md:p-4 border-t bg-background">
      <div className="max-w-4xl mx-auto flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1"
          disabled={currentChannel?.name === 'nyheter' && userState?.type !== 'authenticated'}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || (currentChannel?.name === 'nyheter' && userState?.type !== 'authenticated')}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
