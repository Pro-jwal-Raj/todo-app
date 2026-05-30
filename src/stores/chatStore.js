import { create } from "zustand";
import { supabase } from "../lib/supabase";

const useChatStore = create((set, get) => ({
  messages: [], // messages for the active group
  loading: false,
  sending: false,
  subscription: null,

  // Fetch messages for a group (latest 50)
  fetchMessages: async (groupId) => {
    if (!groupId) {
      set({ messages: [] });
      return;
    }

    set({ loading: true });

    const { data, error } = await supabase
      .from("group_messages")
      .select(`
        id,
        content,
        message_type,
        created_at,
        sender:profiles!sender_id(id, display_name, avatar_url)
      `)
      .eq("group_id", groupId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("fetchMessages error:", error);
      set({ loading: false });
      return;
    }

    set({ messages: data || [], loading: false });
  },

  // Send a message
  sendMessage: async (groupId, content) => {
    const trimmed = content.trim();
    if (!trimmed || !groupId) return { error: "Invalid input" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    set({ sending: true });

    const { error } = await supabase
      .from("group_messages")
      .insert({
        group_id: groupId,
        sender_id: user.id,
        content: trimmed,
        message_type: "text",
      });

    set({ sending: false });

    if (error) {
      console.error("sendMessage error:", error);
      return { error: error.message };
    }

    return { success: true };
  },

  // Delete own message
  deleteMessage: async (messageId) => {
    const { error } = await supabase
      .from("group_messages")
      .delete()
      .eq("id", messageId);

    if (error) return { error: error.message };

    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    }));
    return { success: true };
  },

  // Subscribe to real-time messages for a group
  subscribeToGroup: (groupId) => {
    const { subscription } = get();

    // Unsubscribe from previous
    if (subscription) {
      supabase.removeChannel(subscription);
    }

    if (!groupId) {
      set({ subscription: null, messages: [] });
      return;
    }

    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          // Fetch the full message with sender profile
          const { data } = await supabase
            .from("group_messages")
            .select(`
              id,
              content,
              message_type,
              created_at,
              sender:profiles!sender_id(id, display_name, avatar_url)
            `)
            .eq("id", payload.new.id)
            .single();

          if (data) {
            set((state) => {
              // Avoid duplicates
              if (state.messages.some((m) => m.id === data.id)) return state;
              return { messages: [...state.messages, data] };
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          set((state) => ({
            messages: state.messages.filter((m) => m.id !== payload.old.id),
          }));
        }
      )
      .subscribe();

    set({ subscription: channel });
  },

  // Cleanup
  unsubscribe: () => {
    const { subscription } = get();
    if (subscription) {
      supabase.removeChannel(subscription);
    }
    set({ subscription: null, messages: [] });
  },

  reset: () => {
    const { subscription } = get();
    if (subscription) {
      supabase.removeChannel(subscription);
    }
    set({ messages: [], loading: false, sending: false, subscription: null });
  },
}));

export default useChatStore;
