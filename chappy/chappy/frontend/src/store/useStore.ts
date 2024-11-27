import { create } from 'zustand'
import api from '../lib/axios'
import type { User, Channel, Message, Conversation, LoginCredentials, RegisterData, ApiError } from '../types'

interface State {
  user: User | null
  setUser: (user: User | null) => void
  currentChannel: Channel | null
  setCurrentChannel: (channel: Channel | null) => void
  currentConversation: Conversation | null
  setCurrentConversation: (conversation: Conversation | null) => void
  channels: Channel[]
  setChannels: (channels: Channel[]) => void
  messages: Message[]
  setMessages: (messages: Message[]) => void
  directMessages: { [key: string]: Message[] }
  setDirectMessages: (messages: { [key: string]: Message[] }) => void
  onlineUsers: string[]
  setOnlineUsers: (users: string[]) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void

  // Auth actions
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>

  // Channel actions
  fetchChannels: () => Promise<void>
  createChannel: (name: string, isPrivate: boolean) => Promise<void>
  joinChannel: (channelId: string) => Promise<void>
  leaveChannel: (channelId: string) => Promise<void>

  // Message actions
  sendMessage: (content: string, channelId?: string, recipientId?: string) => Promise<void>
  fetchMessages: (channelId: string) => Promise<void>
  fetchDirectMessages: (userId: string) => Promise<void>
}

export const useStore = create<State>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  currentChannel: null,
  setCurrentChannel: (channel) => {
    set({ currentChannel: channel })
    if (channel) {
      get().setCurrentConversation(null)
      get().fetchMessages(channel._id)
    }
  },
  currentConversation: null,
  setCurrentConversation: (conversation) => {
    set({ currentConversation: conversation })
    if (conversation) {
      get().setCurrentChannel(null)
      get().fetchDirectMessages(conversation._id)
    }
  },
  channels: [],
  setChannels: (channels) => set({ channels }),
  messages: [],
  setMessages: (messages) => set({ messages }),
  directMessages: {},
  setDirectMessages: (messages) => set({ directMessages: messages }),
  onlineUsers: [],
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),

  // Auth actions
  login: async (credentials) => {
    try {
      set({ isLoading: true, error: null })
      const response = await api.post<User>('/auth/login', credentials)
      set({ user: response.data })
    } catch (error) {
      const apiError = error as ApiError
      set({ error: apiError.message || 'Failed to login' })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (data) => {
    try {
      set({ isLoading: true, error: null })
      const response = await api.post<User>('/auth/register', data)
      set({ user: response.data })
    } catch (error) {
      const apiError = error as ApiError
      set({ error: apiError.message || 'Failed to register' })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true, error: null })
      await api.post('/auth/logout')
      set({
        user: null,
        currentChannel: null,
        currentConversation: null,
        channels: [],
        messages: [],
        directMessages: {},
        onlineUsers: []
      })
    } catch (error) {
      const apiError = error as ApiError
      set({ error: apiError.message || 'Failed to logout' })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  // Channel actions
  fetchChannels: async () => {
    try {
      set({ isLoading: true, error: null })
      const response = await api.get<Channel[]>('/channels')
      set({ channels: response.data })
    } catch (error) {
      const apiError = error as ApiError
      set({ error: apiError.message || 'Failed to fetch channels' })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  createChannel: async (name: string, isPrivate: boolean) => {
    try {
      set({ isLoading: true, error: null })
      const response = await api.post<Channel>('/channels', { name, isPrivate })
      set((state) => ({ channels: [...state.channels, response.data] }))
    } catch (error) {
      const apiError = error as ApiError
      set({ error: apiError.message || 'Failed to create channel' })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  joinChannel: async (channelId: string) => {
    try {
      set({ isLoading: true, error: null })
      const response = await api.post<Channel>(`/channels/${channelId}/join`)
      set((state) => ({
        channels: state.channels.map(ch =>
          ch._id === channelId ? response.data : ch
        )
      }))
    } catch (error) {
      const apiError = error as ApiError
      set({ error: apiError.message || 'Failed to join channel' })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  leaveChannel: async (channelId: string) => {
    try {
      set({ isLoading: true, error: null })
      await api.post(`/channels/${channelId}/leave`)
      set((state) => ({
        channels: state.channels.filter(ch => ch._id !== channelId),
        currentChannel: state.currentChannel?._id === channelId ? null : state.currentChannel
      }))
    } catch (error) {
      const apiError = error as ApiError
      set({ error: apiError.message || 'Failed to leave channel' })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  // Message actions
  sendMessage: async (content: string, channelId?: string, recipientId?: string) => {
    try {
      set({ isLoading: true, error: null })
      if (channelId) {
        const response = await api.post<Message>('/messages', { content, channelId })
        set((state) => ({ messages: [...state.messages, response.data] }))
      } else if (recipientId) {
        const response = await api.post<Message>('/messages/dm', { content, recipientId })
        const currentDirectMessages = get().directMessages
        set({
          directMessages: {
            ...currentDirectMessages,
            [recipientId]: [...(currentDirectMessages[recipientId] || []), response.data]
          }
        })
      }
    } catch (error) {
      const apiError = error as ApiError
      set({ error: apiError.message || 'Failed to send message' })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  fetchMessages: async (channelId: string) => {
    try {
      set({ isLoading: true, error: null })
      const response = await api.get<Message[]>(`/messages/${channelId}`)
      set({ messages: response.data })
    } catch (error) {
      const apiError = error as ApiError
      set({ error: apiError.message || 'Failed to fetch messages' })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  fetchDirectMessages: async (userId: string) => {
    try {
      set({ isLoading: true, error: null })
      const response = await api.get<Message[]>(`/messages/dm/${userId}`)
      const currentDirectMessages = get().directMessages
      set({
        directMessages: {
          ...currentDirectMessages,
          [userId]: response.data
        }
      })
    } catch (error) {
      const apiError = error as ApiError
      set({ error: apiError.message || 'Failed to fetch direct messages' })
      throw error
    } finally {
      set({ isLoading: false })
    }
  }
}))