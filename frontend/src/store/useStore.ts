import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../api/axios';

interface ApiError extends Error {
  response?: {
    data?: {
      message?: string
      details?: string
    }
    status?: number
  }
}

// Define user states
type AuthenticatedUser = {
  _id: string
  username: string
  email: string
  type: 'authenticated'
}

type GuestUser = {
  type: 'guest'
  username: string
}

type UserState = AuthenticatedUser | GuestUser

interface Channel {
  _id: string
  name: string
  description?: string
  isPrivate: boolean
  isRestricted?: boolean
  members: string[]
  createdBy?: any
  createdAt?: string
  updatedAt?: string
}

interface BaseMessage {
  _id?: string;
  content: string;
  createdAt: string;
}

interface Message extends BaseMessage {
  sender: {
    _id: string;
    username: string;
    type?: 'authenticated' | 'guest';
  };
}

interface DirectMessage extends BaseMessage {
  _id: string;
  sender: AuthenticatedUser;
  recipient: AuthenticatedUser;
}

interface Conversation {
  _id: string;
  username: string;
  isOnline?: boolean;
  lastMessage?: {
    content: string;
    createdAt: string;
  };
}

interface StoreState {
  userState: UserState | null
  token: string | null
  error: string | null
  currentChannel: Channel | null
  currentConversation: Conversation | null
  channels: Channel[]
  messages: Message[]
  directMessages: DirectMessage[]
  conversations: Conversation[]
  isLoading: boolean
  isInitialized: boolean
  guestName: string | null

  // Auth actions
  login: (credentials: { username: string; password: string }) => Promise<void>
  loginAsGuest: () => Promise<boolean>
  register: (userData: { username: string; email: string; password: string }) => Promise<void>
  logout: () => void
  clearError: () => void
  checkAuth: () => Promise<boolean>
  setError: (message: string | null) => void

  // Channel actions
  fetchChannels: () => Promise<void>
  createChannel: (channelData: { name: string; isPrivate: boolean; description?: string }) => Promise<void>
  joinChannel: (channelId?: string) => Promise<void>
  leaveChannel: (channelId: string) => Promise<void>

  // Message actions
  sendMessage: (content: string, guestName?: string) => Promise<void>
  fetchMessages: (channelId: string) => Promise<void>

  // DM actions
  fetchConversations: () => Promise<void>
  fetchDirectMessages: (userId: string) => Promise<void>
  sendDirectMessage: (content: string, recipientId: string) => Promise<void>
  setCurrentConversation: (conversation: Conversation | null) => void

  // Guest actions
  setGuestName: (name: string) => void

  addMessage: (message: DirectMessage) => void
}

// Helper function to check if user is authenticated
const isAuthenticated = (userState: UserState | null): userState is AuthenticatedUser => {
  return userState?.type === 'authenticated'
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      userState: null,
      token: null,
      error: null,
      currentChannel: null,
      currentConversation: null,
      channels: [],
      messages: [],
      directMessages: [],
      conversations: [],
      isLoading: false,
      isInitialized: false,
      guestName: null,

      checkAuth: async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            set({ isInitialized: true });
            return false;
          }

          const { data } = await api.get('/auth/me');

          if (!data || !data._id) {
            // Rensa token om den är ogiltig
            localStorage.removeItem('token');
            set({
              userState: null,
              token: null,
              isInitialized: true
            });
            return false;
          }

          const authenticatedUser: AuthenticatedUser = {
            _id: data._id,
            username: data.username,
            email: data.email,
            type: 'authenticated'
          };

          set({
            userState: authenticatedUser,
            token,
            isInitialized: true
          });
          return true;
        } catch (error) {
          console.error('Auth check error:', error);
          // Rensa token vid fel
          localStorage.removeItem('token');
          set({
            userState: null,
            token: null,
            isInitialized: true,
            error: 'Authentication failed. Please log in again.'
          });
          return false;
        }
      },

      login: async (credentials) => {
        try {
          set({ isLoading: true, error: null });
          const { data } = await api.post('/auth/login', credentials);

          if (!data || !data.token || !data.user) {
            throw new Error('Invalid response from server');
          }

          const authenticatedUser: AuthenticatedUser = {
            _id: data.user._id,
            username: data.user.username,
            email: data.user.email,
            type: 'authenticated'
          };

          // Update axios default headers
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

          // Store token in localStorage
          localStorage.setItem('token', data.token);

          // Update store state
          set({
            userState: authenticatedUser,
            token: data.token,
            isLoading: false,
            error: null,
            isInitialized: true,
            channels: [],
            messages: [],
            conversations: [],
            currentChannel: null,
            currentConversation: null,
            directMessages: []
          });

          // Fetch initial data
          await get().fetchChannels();
          await get().fetchConversations();
        } catch (error: any) {
          console.error('Login error:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Failed to login';

          // Clear any invalid auth state
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];

          set({
            error: errorMessage,
            isLoading: false,
            userState: null,
            token: null,
            channels: [],
            messages: [],
            conversations: [],
            currentChannel: null,
            currentConversation: null,
            directMessages: []
          });

          throw new Error(errorMessage);
        }
      },

      loginAsGuest: async () => {
        try {
          set({ isLoading: true, error: null });
          const { guestName } = get();

          if (!guestName) {
            throw new Error('Guest name is required');
          }

          const guestUser: GuestUser = {
            type: 'guest',
            username: guestName
          };

          // Clear any existing auth
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];

          // Update store state
          set({
            userState: guestUser,
            token: null,
            isLoading: false,
            error: null,
            isInitialized: true,
            channels: [],  // Reset channels
            messages: [],  // Reset messages
            currentChannel: null  // Reset current channel
          });

          // Fetch channels without auth
          await get().fetchChannels();
          return true;
        } catch (error: any) {
          console.error('Guest login error:', error);
          set({
            error: error.message || 'Failed to login as guest',
            isLoading: false,
            userState: null
          });
          throw error;
        }
      },

      logout: () => {
        console.log('Logging out...');

        // Clear auth header
        delete api.defaults.headers.common['Authorization'];

        // Clear localStorage
        localStorage.removeItem('token');

        // Reset store state
        set({
          userState: null,
          token: null,
          error: null,
          currentChannel: null,
          currentConversation: null,
          channels: [],
          messages: [],
          directMessages: [],
          conversations: [],
          isLoading: false,
          isInitialized: true
        });

        console.log('Logout complete');
      },

      clearError: () => set({ error: null }),

      // Channel actions
      fetchChannels: async () => {
        try {
          const { data } = await api.get('/channels');
          const channelsWithMembers = data.map((channel: any) => ({
            ...channel,
            isRestricted: channel.name === 'nyheter',
            members: channel.members || []
          }));
          set({ channels: channelsWithMembers || [], error: null });
        } catch (error: any) {
          console.error('Failed to fetch channels:', error);
          set({
            channels: [],
            error: error.message || 'Failed to fetch channels'
          });
        }
      },

      createChannel: async (channelData) => {
        try {
          const { data } = await api.post('/channels', channelData);
          set((state) => ({
            channels: [...state.channels, data]
          }));
          return data;
        } catch (error) {
          console.error('Failed to create channel:', error);
          throw error;
        }
      },

      joinChannel: async (channelId) => {
        if (!channelId) return;
        try {
          const channel = get().channels.find(c => c._id === channelId);
          const userState = get().userState;

          // Check if channel is private and user is not authenticated
          if (channel?.isPrivate && userState?.type !== 'authenticated') {
            throw new Error('You must be logged in to join private channels');
          }

          // For private channels, check if user is a member
          if (channel?.isPrivate && userState?.type === 'authenticated') {
            const isMember = channel.members.some(
              memberId => memberId === userState._id
            );
            if (!isMember) {
              throw new Error('You are not a member of this private channel');
            }
          }

          const { data } = await api.post(`/channels/${channelId}/join`);
          set({ currentChannel: data, error: null });
          await get().fetchMessages(channelId);
        } catch (error: any) {
          console.error('Failed to join channel:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Failed to join channel';
          set({ error: errorMessage });
          throw error;
        }
      },

      leaveChannel: async (channelId) => {
        try {
          await api.post(`/channels/${channelId}/leave`);
          set((state) => ({
            currentChannel: state.currentChannel?._id === channelId ? null : state.currentChannel,
            channels: state.channels.filter((c) => c._id !== channelId)
          }));
        } catch (error) {
          console.error('Failed to leave channel:', error);
        }
      },

      // Message actions
      sendMessage: async (content: string, guestName?: string) => {
        const { currentChannel, userState } = get();
        if (!currentChannel) return;

        try {
          // Block guest messages in nyheter channel immediately
          if (currentChannel.name === 'nyheter' && userState?.type !== 'authenticated') {
            set({ error: 'Only logged in users can send messages in the news channel' });
            return;
          }

          const messageData = {
            content,
            ...(userState?.type === 'guest' && { guestName })
          };

          const { data } = await api.post(
            `/messages/channel/${currentChannel._id}`,
            messageData
          );

          set((state) => ({
            messages: [...state.messages, data],
            error: null
          }));
        } catch (error: any) {
          console.error('Failed to send message:', error);
          if (error.response?.data?.isRestricted) {
            set({ error: 'This channel is restricted to authenticated users only' });
          } else {
            set({ error: error.message || 'Failed to send message' });
          }
        }
      },

      fetchMessages: async (channelId) => {
        try {
          const { data } = await api.get(`/messages/channel/${channelId}`);
          set({ messages: data || [] });
        } catch (error) {
          console.error('Failed to fetch messages:', error);
          set({ messages: [] });
        }
      },

      // DM actions
      fetchConversations: async () => {
        try {
          const { data } = await api.get('/dm/conversations');
          set({ conversations: data || [] });
        } catch (error) {
          console.error('Failed to fetch conversations:', error);
          set({ conversations: [] });
        }
      },

      fetchDirectMessages: async (userId) => {
        try {
          const { data } = await api.get(`/dm/${userId}`);
          set({ directMessages: data || [] });
        } catch (error) {
          console.error('Failed to fetch direct messages:', error);
          set({ directMessages: [] });
        }
      },

      sendDirectMessage: async (content, recipientId) => {
        try {
          const { data } = await api.post('/dm', { content, recipientId });
          set((state) => ({
            directMessages: [...state.directMessages, data]
          }));
          await get().fetchConversations();
        } catch (error) {
          console.error('Failed to send direct message:', error);
          throw error;
        }
      },

      setCurrentConversation: (conversation) => {
        set({ currentConversation: conversation });
        if (conversation) {
          get().fetchDirectMessages(conversation._id);
        }
      },

      register: async (userData) => {
        try {
          set({ isLoading: true, error: null });
          console.log('Attempting registration:', { ...userData, password: '[REDACTED]' });

          const { data } = await api.post('/auth/register', userData);
          console.log('Registration response:', data);

          if (!data.token || !data.user) {
            throw new Error('Invalid response from server');
          }

          const authenticatedUser: AuthenticatedUser = {
            _id: data.user.id,
            username: data.user.username,
            email: data.user.email,
            type: 'authenticated'
          };

          // Update axios default headers
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

          // Update store state
          set({
            userState: authenticatedUser,
            token: data.token,
            isLoading: false,
            error: null,
            isInitialized: true,
            channels: [],
            messages: [],
            conversations: [],
            currentChannel: null,
            currentConversation: null,
            directMessages: []
          });

          // Store token in localStorage
          localStorage.setItem('token', data.token);
          console.log('Registration successful, user state updated');

          // Fetch initial data
          await get().fetchChannels();
          await get().fetchConversations();

        } catch (error) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.message || apiError.message;
          console.error('Registration error:', errorMessage);

          set({
            error: errorMessage,
            isLoading: false,
            userState: null,
            token: null,
            channels: [],
            messages: [],
            conversations: [],
            currentChannel: null,
            currentConversation: null,
            directMessages: []
          });

          throw new Error(errorMessage);
        }
      },

      setGuestName: (name) => {
        console.log('Setting guest name in store:', name);
        set({ guestName: name });
      },

      addMessage: (message: DirectMessage) => {
        set((state) => {
          // Kontrollera om meddelandet redan finns
          const isDuplicate = state.directMessages.some(
            (m) => m._id === message._id
          );

          if (isDuplicate) {
            return state;
          }

          // Kontrollera att användaren är autentiserad
          const authenticatedUser = state.userState?.type === 'authenticated' ? state.userState : null;
          if (!authenticatedUser) {
            return state;
          }

          // Uppdatera conversations-listan med det senaste meddelandet
          const updatedConversations = state.conversations.map(conv => {
            if (conv._id === message.sender._id || conv._id === message.recipient._id) {
              return {
                ...conv,
                lastMessage: {
                  content: message.content,
                  createdAt: message.createdAt
                }
              };
            }
            return conv;
          });

          // Om konversationen inte finns, lägg till den
          const conversationExists = updatedConversations.some(
            conv => conv._id === message.sender._id || conv._id === message.recipient._id
          );

          if (!conversationExists) {
            const newConversation = {
              _id: message.sender._id === authenticatedUser._id ? message.recipient._id : message.sender._id,
              username: message.sender._id === authenticatedUser._id ? message.recipient.username : message.sender.username,
              lastMessage: {
                content: message.content,
                createdAt: message.createdAt
              }
            };
            updatedConversations.push(newConversation);
          }

          return {
            directMessages: [...state.directMessages, message],
            conversations: updatedConversations
          };
        });
      },

      setError: (message) => {
        set({ error: message });
      }
    }),
    {
      name: 'chappy-store',
      partialize: (state) => ({
        userState: state.userState,
        token: state.token,
        isInitialized: state.isInitialized,
        guestName: state.guestName,
        currentChannel: state.currentChannel,
        currentConversation: state.currentConversation,
        channels: state.channels,
        conversations: state.conversations
      }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => localStorage.removeItem(name)
      }
    }
  )
);