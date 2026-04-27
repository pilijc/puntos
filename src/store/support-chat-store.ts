import type { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";
import {
  getOrCreateSupportConversation,
  hydrateUnreadCounts,
  listSupportConversations,
  loadSupportMessages,
  markSupportMessagesRead,
  removeSupportChannel,
  sendSupportMessage,
  setSupportConversationStatus,
  subscribeToSupportConversations,
  subscribeToSupportMessages,
} from "@/services/support-chat-service";
import {
  SupportConversation,
  SupportConversationStatus,
  SupportMessage,
  SupportSenderRole,
} from "@/type/support-chat";

interface SupportChatState {
  conversations: SupportConversation[];
  activeConversationId: string | null;
  messagesByConversationId: Record<string, SupportMessage[]>;
  loading: boolean;
  loadingMessages: boolean;
  sending: boolean;
  error: string | null;
  inboxChannel: RealtimeChannel | null;
  messageChannel: RealtimeChannel | null;

  loadManagerConversation: (storeId: number, ownerId: string) => Promise<SupportConversation | null>;
  loadAdminConversations: () => Promise<void>;
  openConversation: (conversationId: string, reader?: "store" | "admin") => Promise<void>;
  sendMessage: (body: string, senderRole: SupportSenderRole) => Promise<void>;
  markRead: (conversationId: string, reader: "store" | "admin") => Promise<void>;
  setStatus: (conversationId: string, status: SupportConversationStatus) => Promise<void>;
  subscribeInbox: () => void;
  subscribeMessages: (conversationId: string) => void;
  cleanupRealtime: () => void;
  clearError: () => void;
}

function sortConversations(conversations: SupportConversation[]) {
  return [...conversations].sort((a, b) => {
    const aTime = a.last_message_at ?? a.updated_at ?? a.created_at;
    const bTime = b.last_message_at ?? b.updated_at ?? b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

function upsertMessage(messages: SupportMessage[], message: SupportMessage) {
  const exists = messages.some((item) => item.id === message.id);
  const next = exists
    ? messages.map((item) => (item.id === message.id ? message : item))
    : [...messages, message];
  return next.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export const useSupportChatStore = create<SupportChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messagesByConversationId: {},
  loading: false,
  loadingMessages: false,
  sending: false,
  error: null,
  inboxChannel: null,
  messageChannel: null,

  loadManagerConversation: async (storeId, ownerId) => {
    set({ loading: true, error: null });
    try {
      const conversation = await getOrCreateSupportConversation(storeId, ownerId);
      const [withCounts] = await hydrateUnreadCounts([conversation]);
      set((state) => ({
        conversations: sortConversations([
          withCounts,
          ...state.conversations.filter((item) => item.id !== withCounts.id),
        ]),
        activeConversationId: withCounts.id,
      }));
      await get().openConversation(withCounts.id, "store");
      return withCounts;
    } catch (e: any) {
      set({ error: e?.message ?? "Failed to load support chat" });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  loadAdminConversations: async () => {
    set({ loading: true, error: null });
    try {
      const conversations = await listSupportConversations();
      set({ conversations: sortConversations(conversations) });
    } catch (e: any) {
      set({ error: e?.message ?? "Failed to load support inbox" });
    } finally {
      set({ loading: false });
    }
  },

  openConversation: async (conversationId, reader) => {
    set({ activeConversationId: conversationId, loadingMessages: true, error: null });
    try {
      const messages = await loadSupportMessages(conversationId);
      set((state) => ({
        messagesByConversationId: {
          ...state.messagesByConversationId,
          [conversationId]: messages,
        },
      }));
      get().subscribeMessages(conversationId);
      if (reader) await get().markRead(conversationId, reader);
    } catch (e: any) {
      set({ error: e?.message ?? "Failed to load messages" });
    } finally {
      set({ loadingMessages: false });
    }
  },

  sendMessage: async (body, senderRole) => {
    const conversationId = get().activeConversationId;
    if (!conversationId || !body.trim()) return;

    set({ sending: true, error: null });
    try {
      const message = await sendSupportMessage(conversationId, body, senderRole);
      set((state) => ({
        messagesByConversationId: {
          ...state.messagesByConversationId,
          [conversationId]: upsertMessage(
            state.messagesByConversationId[conversationId] ?? [],
            message,
          ),
        },
      }));
    } catch (e: any) {
      set({ error: e?.message ?? "Failed to send message" });
    } finally {
      set({ sending: false });
    }
  },

  markRead: async (conversationId, reader) => {
    try {
      await markSupportMessagesRead(conversationId, reader);
      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                unread_admin_count: reader === "admin" ? 0 : conversation.unread_admin_count,
                unread_store_count: reader === "store" ? 0 : conversation.unread_store_count,
              }
            : conversation,
        ),
      }));
    } catch (e: any) {
      set({ error: e?.message ?? "Failed to mark messages read" });
    }
  },

  setStatus: async (conversationId, status) => {
    try {
      await setSupportConversationStatus(conversationId, status);
      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation.id === conversationId ? { ...conversation, status } : conversation,
        ),
      }));
    } catch (e: any) {
      set({ error: e?.message ?? "Failed to update conversation" });
    }
  },

  subscribeInbox: () => {
    removeSupportChannel(get().inboxChannel);
    const channel = subscribeToSupportConversations(async () => {
      await get().loadAdminConversations();
    });
    set({ inboxChannel: channel });
  },

  subscribeMessages: (conversationId) => {
    removeSupportChannel(get().messageChannel);
    const channel = subscribeToSupportMessages(
      conversationId,
      (message) => {
        set((state) => ({
          messagesByConversationId: {
            ...state.messagesByConversationId,
            [conversationId]: upsertMessage(
              state.messagesByConversationId[conversationId] ?? [],
              message,
            ),
          },
        }));
      },
      (message) => {
        set((state) => ({
          messagesByConversationId: {
            ...state.messagesByConversationId,
            [conversationId]: upsertMessage(
              state.messagesByConversationId[conversationId] ?? [],
              message,
            ),
          },
        }));
      },
    );
    set({ messageChannel: channel });
  },

  cleanupRealtime: () => {
    removeSupportChannel(get().inboxChannel);
    removeSupportChannel(get().messageChannel);
    set({ inboxChannel: null, messageChannel: null });
  },

  clearError: () => set({ error: null }),
}));
