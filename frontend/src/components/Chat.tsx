import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { useChatFeatures, useAuth } from "../store/useStore";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ScrollArea } from "./ui/scroll-area";
import { Hash, Lock, Users } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import type { Channel } from "../types/channel";

export default function Chat() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const {
    currentChannel,
    fetchMessages,
    fetchChannels,
    channels = [],
    error,
    isLoading,
    clearState,
  } = useChatFeatures();
  const { logout } = useAuth();
  const { userState } = useUser();

  const handleLogout = async () => {
    try {
      // Clean up socket connections
      if (socket) {
        socket.disconnect();
      }

      // Clear chat state first
      if (typeof clearState === "function") {
        clearState();
      }

      // Logout from auth
      await logout();

      // Navigate to login page
      navigate("/login", { replace: true });

      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to log out");
    }
  };

  useEffect(() => {
    // Only fetch if we don't have channels already and we're not currently loading
    if (!isLoading && (!channels || channels.length === 0)) {
      fetchChannels().catch((error: Error) => {
        console.error("Failed to fetch channels:", error);
        toast.error("Failed to load channels");
      });
    }
  }, [fetchChannels, channels, isLoading]);

  useEffect(() => {
    // Fetch messages when channel changes
    if (currentChannel?._id) {
      fetchMessages(currentChannel._id).catch((error: Error) => {
        console.error("Failed to fetch messages:", error);
        toast.error("Failed to load messages");
      });
    }
  }, [currentChannel?._id, fetchMessages]);

  useEffect(() => {
    if (!socket) return;

    // Handle channel updates
    socket.on("user_status", () => {
      console.log("User status changed, refreshing channels");
      if (!isLoading && channels && channels.length > 0) {
        fetchChannels().catch(console.error);
      }
    });

    const handleReconnect = (attemptNumber: number) => {
      toast.success(`Reconnected after ${attemptNumber} attempts!`);
      if (currentChannel?._id) {
        fetchMessages(currentChannel._id);
      }
      if (!isLoading && channels && channels.length > 0) {
        fetchChannels().catch(console.error);
      }
    };

    socket.on("reconnect", handleReconnect);

    return () => {
      socket.off("user_status");
      socket.off("reconnect");
    };
  }, [socket, currentChannel, fetchMessages, fetchChannels, channels, isLoading]);

  const canSendMessage = (channel: Channel) => {
    // For private channels, only authenticated users can send messages
    if (channel?.isPrivate) {
      return userState?.type === "authenticated";
    }

    // For public channels, anyone can send messages
    return true;
  };

  if (isLoading) {
    return <div>Loading channels...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!currentChannel) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 flex-col gap-4">
        <Users className="h-12 w-12 opacity-50" />
        <div className="text-center">
          <h3 className="font-medium">Select a channel</h3>
          <p className="text-sm text-gray-500">
            Choose a channel to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-[#1f1f1f] p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-gray-200">
          {currentChannel.isPrivate ? (
            <Lock className="h-5 w-5" />
          ) : (
            <Hash className="h-5 w-5" />
          )}
          <span className="font-medium">{currentChannel.name}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-300 hover:bg-[#1f1f1f] hover:text-gray-100"
          onClick={handleLogout}
        >
          Logga ut
        </Button>
      </div>

      {/* Error Display */}
      {error && <div className="p-4 bg-red-500/10 text-red-500">{error}</div>}

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            <MessageList />
          </div>
        </ScrollArea>
      </div>

      {/* Message Input */}
      <div className="mt-auto border-t border-[#1f1f1f]">
        {canSendMessage(currentChannel) ? (
          <MessageInput />
        ) : (
          <div className="p-4 text-center text-yellow-500 bg-yellow-500/10">
            You need to be logged in to send messages in this channel
          </div>
        )}
      </div>

      {currentChannel.isPrivate && !userState && (
        <div className="text-center p-4 bg-yellow-500/10 text-yellow-500">
          This is a private channel. Please log in to participate.
        </div>
      )}
    </div>
  );
}
