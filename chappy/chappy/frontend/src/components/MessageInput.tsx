import { useState, useRef } from "react";
import { useStore } from "../store/useStore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { EmojiPicker } from "./EmojiPicker";
import { Smile, Send } from "lucide-react";

export function MessageInput() {
  const { currentChannel, currentConversation, sendMessage } = useStore();
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      if (currentChannel) {
        await sendMessage(message, currentChannel._id);
      } else if (currentConversation) {
        await sendMessage(message, undefined, currentConversation._id);
      }
      setMessage("");
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-border relative">
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <Input
            data-test="message-input"
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentChannel
              ? `Skriv ett meddelande i #${currentChannel.name}...`
              : `Skriv ett meddelande till ${currentConversation?.username}...`
            }
            className="min-h-[44px] bg-background text-foreground pr-10"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          data-test="send-message-button"
          type="submit"
          size="icon"
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {showEmojiPicker && (
        <div className="absolute bottom-full right-0 mb-2 z-50">
          <EmojiPicker
            onEmojiSelect={(emoji) => {
              setMessage((prev) => prev + emoji);
              setShowEmojiPicker(false);
            }}
          />
        </div>
      )}
    </form>
  );
}
