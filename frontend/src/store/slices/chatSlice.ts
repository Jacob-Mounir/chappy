import { StateCreator } from 'zustand';
import { StoreState } from '../../types/store';
import api from '../../lib/api';
import { socketService } from '../../lib/socket';
import type { Channel, Message, User } from '../../types/chat';
import { toast } from 'sonner';

export const createChatSlice: StateCreator<
  StoreState,
  [],
  [],
  Pick<StoreState, 'chat'>
> = (set, get) => ({
  chat: {
    channels: [],
    currentChannel: null,
    messages: [],
    isLoading: false,
    error: null,

    fetchChannels: async () => {
      try {
        set(state => ({ chat: { ...state.chat, isLoading: true } }));
        const { data } = await api.get<Channel[]>('/api/channels');
        set(state => ({
          chat: {
            ...state.chat,
            channels: data,
            isLoading: false
          }
        }));
      } catch (error) {
        set(state => ({
          chat: {
            ...state.chat,
            error: 'Failed to fetch channels',
            isLoading: false
          }
        }));
      }
    },

    setCurrentChannel: async (channelId: string) => {
      try {
        set(state => ({ chat: { ...state.chat, isLoading: true } }));

        // Leave current channel if any
        const currentChannel = get().chat.currentChannel;
        if (currentChannel) {
          socketService.leaveChannel(currentChannel._id);
        }

        // Join the channel first (this will handle private channel access)
        await api.post(`/api/channels/${channelId}/join`);

        // Fetch channel details and messages
        const [channelRes, messagesRes] = await Promise.all([
          api.get<Channel>(`/api/channels/${channelId}`),
          api.get<Message[]>(`/api/channels/${channelId}/messages`)
        ]);

        // Join socket room
        socketService.joinChannel(channelId);

        set(state => ({
          chat: {
            ...state.chat,
            currentChannel: channelRes.data,
            messages: messagesRes.data,
            isLoading: false
          }
        }));
      } catch (error) {
        console.error('Failed to load channel:', error);
        set(state => ({
          chat: {
            ...state.chat,
            error: error.response?.data?.message || 'Failed to load channel',
            isLoading: false
          }
        }));
        toast.error(error.response?.data?.message || 'Failed to load channel');
      }
    },

    sendMessage: async (content: string, channelId: string) => {
      if (!content.trim() || !channelId) return;

      const guestUser: User = {
        _id: 'guest',
        username: localStorage.getItem('guestName') || 'Guest',
        type: 'guest'
      };

      const optimisticMessage: Message = {
        _id: `temp-${Date.now()}`,
        content: content.trim(),
        channel: channelId,
        createdAt: new Date().toISOString(),
        sender: get().auth.user || guestUser
      };

      // Add optimistic message
      set(state => ({
        chat: {
          ...state.chat,
          messages: [...state.chat.messages, optimisticMessage]
        }
      }));

      try {
        // Send via socket
        socketService.sendMessage(channelId, content);
      } catch (error) {
        console.error('Failed to send message:', error);
        // Remove optimistic message on failure
        set(state => ({
          chat: {
            ...state.chat,
            messages: state.chat.messages.filter(msg => msg._id !== optimisticMessage._id),
            error: 'Failed to send message'
          }
        }));
        toast.error('Failed to send message');
      }
    },

    addMessage: (message: Message) => {
      set(state => ({
        chat: {
          ...state.chat,
          messages: [...state.chat.messages, message]
        }
      }));
    },

    fetchChannel: async (channelId: string) => {
      try {
        const response = await api.get(`/api/channels/${channelId}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching channel:', error);
        throw error;
      }
    }
  }
});