import React, { useEffect } from "react";
import { useStore } from "../store/useStore";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Plus, Hash, Lock, MessageSquare, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const {
    channels = [],
    currentChannel,
    conversations = [],
    joinChannel,
    error,
    isLoading,
    userState,
    fetchChannels,
    fetchConversations,
    setError
  } = useStore();

  const navigate = useNavigate();
  const isAuthenticated = userState?.type === 'authenticated';

  useEffect(() => {
    // Fetch initial data
    const loadData = async () => {
      try {
        await fetchChannels();
        if (isAuthenticated) {
          await fetchConversations();
        }
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    loadData();
  }, [fetchChannels, fetchConversations, isAuthenticated]);

  // Debug logging
  console.log('Channels:', channels);

  return (
    <aside className="w-full h-full border-r bg-background flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h1 className="font-bold text-xl">Chappy</h1>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {error && (
            <div className="p-2 text-sm text-destructive bg-destructive/10 rounded">
              {error}
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Channels
              </h2>
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/chat/channels/new')}
                  className="rounded-full"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-1">
              {isLoading ? (
                <div className="text-sm text-muted-foreground p-2">Loading channels...</div>
              ) : channels.length === 0 ? (
                <div className="text-sm text-muted-foreground p-2">No channels yet</div>
              ) : (
                channels.map((channel) => {
                  const isPrivateAndNotMember = channel.isPrivate &&
                    userState?.type === 'authenticated' &&
                    !channel.members?.some(memberId => memberId === userState._id);

                  // Don't show private channels to non-members
                  if (channel.isPrivate && userState?.type !== 'authenticated') {
                    return null;
                  }

                  return (
                    <Button
                      key={channel._id}
                      variant={currentChannel?._id === channel._id ? "secondary" : "ghost"}
                      className={`w-full justify-start gap-2 ${
                        currentChannel?._id === channel._id
                          ? 'bg-accent'
                          : channel.isPrivate || channel.isRestricted
                            ? 'text-muted-foreground hover:text-primary hover:bg-accent/50'
                            : 'hover:bg-accent/50'
                      }`}
                      onClick={() => {
                        if (channel.isRestricted) {
                          setError('You must be logged in to access the news channel');
                          return;
                        }
                        if (channel.isPrivate && userState?.type !== 'authenticated') {
                          setError('You must be logged in to join private channels');
                          return;
                        }
                        if (isPrivateAndNotMember) {
                          setError('You are not a member of this private channel');
                          return;
                        }
                        joinChannel(channel._id);
                        onClose?.();
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-[24px]">
                        {channel.isPrivate || channel.isRestricted ? (
                          <Lock className={`h-4 w-4 ${currentChannel?._id === channel._id ? 'text-primary' : ''}`} />
                        ) : (
                          <Hash className="h-4 w-4" />
                        )}
                      </div>
                      <span className={`flex-1 truncate ${currentChannel?._id === channel._id ? 'font-medium' : ''}`}>
                        {channel.name}
                      </span>
                      {(channel.isPrivate || channel.isRestricted) && (
                        <span className={`text-[10px] font-medium ml-2 px-1.5 py-0.5 rounded-full ${
                          currentChannel?._id === channel._id
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {channel.isRestricted ? 'LOGIN REQUIRED' : isPrivateAndNotMember ? 'NO ACCESS' : 'PRIVATE'}
                        </span>
                      )}
                    </Button>
                  );
                })
              )}
            </div>
          </div>

          {/* Direct Messages Section */}
          {isAuthenticated && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Direct Messages
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    navigate('/messages');
                    onClose?.();
                  }}
                  className="rounded-full"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-1">
                {conversations.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-2">
                    No conversations yet
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <Button
                      key={conversation._id}
                      variant="ghost"
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        navigate(`/messages/${conversation._id}`);
                        onClose?.();
                      }}
                    >
                      <MessageSquare className="h-4 w-4" />
                      {conversation.username}
                    </Button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}