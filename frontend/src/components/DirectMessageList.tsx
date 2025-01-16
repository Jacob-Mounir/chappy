import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { ScrollArea } from './ui/scroll-area';
import type { AuthenticatedUser } from '../types/store';

export function DirectMessageList() {
  const { directMessages, currentConversation, userState } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filtrera meddelanden för aktuell konversation
  const conversationMessages = directMessages.filter(
    msg =>
      (msg.sender._id === currentConversation?._id || msg.recipient._id === currentConversation?._id)
  );

  // Auto-scroll till botten när nya meddelanden kommer
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationMessages]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div className="flex flex-col p-4 gap-4">
        {conversationMessages.map((message) => {
          const isOwnMessage = userState?.type === 'authenticated' &&
            message.sender._id === (userState as AuthenticatedUser)._id;

          return (
            <div
              key={message._id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[70%] rounded-lg p-3
                  ${isOwnMessage
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-muted'
                  }
                `}
              >
                <div className="flex flex-col gap-1">
                  {!isOwnMessage && (
                    <span className="text-xs font-medium opacity-70">
                      {message.sender.username}
                    </span>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  <span className="text-xs opacity-70 ml-auto">
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}