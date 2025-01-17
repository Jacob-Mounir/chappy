import React, { useState } from "react";
import { useStore } from "../store/useStore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send } from "lucide-react";

export function MessageInput() {
  const [message, setMessage] = useState("");
  const { sendMessage, currentChannel, userState, guestName } = useStore();

  const isNewsChannel = currentChannel?.name === 'nyheter';
  const isGuest = userState?.type !== 'authenticated';
  const isDisabled = isNewsChannel && isGuest;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentChannel) return;

    try {
      if (userState?.type === 'guest') {
        await sendMessage(message.trim(), guestName || '');
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
          placeholder={isDisabled ? "You cannot send messages in the news channel" : "Type your message..."}
          className="flex-1"
          disabled={isDisabled}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || isDisabled}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
