import { useEffect, useRef } from "react";
import { useStore } from "../store/useStore";
import type { Message } from "../types";
import LoadingSpinner from "./LoadingSpinner";
import { CodeBlock } from "./CodeBlock";
import { parseMessage } from "../utils/messageParser";

const AVATAR_COLORS = [
  "bg-red-500",
  "bg-green-500",
  "bg-blue-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-cyan-500",
];

function getColorForUsername(username: string): string {
  // Use a simple hash function to get a consistent color for each username
  const hash = username.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function MessageItem({ message }: { message: Message }) {
  const messageParts = parseMessage(message.content);
  const avatarColor = getColorForUsername(message.sender.username);

  return (
    <div className="py-2 hover:bg-accent/10">
      <div className="flex items-start gap-x-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${avatarColor}`}
        >
          {message.sender.username[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-x-2">
            <span className="font-medium text-foreground">
              {message.sender.username}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(message.createdAt).toLocaleTimeString()}
            </span>
          </div>
          <div className="space-y-2">
            {messageParts.map((part, index) => (
              <div key={index}>
                {part.type === "text" ? (
                  <p className="text-foreground whitespace-pre-wrap">
                    {part.content}
                  </p>
                ) : (
                  <CodeBlock code={part.content} language={part.language} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MessageList() {
  const { messages, currentChannel, fetchMessages, isLoading } = useStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentChannel) {
      fetchMessages(currentChannel._id);
    }
  }, [currentChannel?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentChannel) return null;

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-1">
        {messages.map((message) => (
          <MessageItem key={message._id} message={message} />
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
