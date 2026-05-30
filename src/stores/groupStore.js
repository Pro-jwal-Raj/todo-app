import { create } from "zustand";
import { supabase } from "../lib/supabase";

const useGroupStore = create((set, get) => ({
  groups: [],
  activeGroup: null, // currently selected group (null = personal)
  members: {}, // { groupId: [members] }
  loading: false,
  error: null,

  // Fetch all groups the user belongs to
  fetchGroups: async () => {
    set({ loading: true });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ loading: false });
      return;
    }

    const { data, error } = await supabase
      .from("group_members")
      .select(`
        role,
        group:groups(*)
      `)
      .eq("user_id", user.id)
      .order("joined_at", { ascending: false });

    if (error) {
      set({ error: error.message, loading: false });
      return;
    }

    const groups = (data || [])
      .filter((item) => item.group) // filter out null joins (RLS edge case)
      .map((item) => ({
        ...item.group,
        myRole: item.role,
      }));
    set({ groups, loading: false, error: null });
  },

  // Create a new group
  createGroup: async (name, description, type) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    // Use server-side function that atomically creates group + member
    const { data: group, error } = await supabase
      .rpc("create_group", {
        group_name: name,
        group_description: description || "",
        group_type: type || "custom",
      });

    if (error) {
      set({ error: error.message });
      return { error: error.message };
    }

    // Add to local state
    set((state) => ({
      groups: [{ ...group, myRole: "owner" }, ...state.groups],
      error: null,
    }));
    return { group };
  },

  // Join a group via invite code
  joinGroup: async (inviteCode) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    // Use server-side function that bypasses RLS for invite lookup
    const { data, error } = await supabase
      .rpc("join_group_by_invite", { code: inviteCode.trim().toLowerCase() });

    if (error) {
      if (error.message.includes("Invalid invite code")) {
        return { error: "Invalid invite code. Please check and try again." };
      }
      if (error.message.includes("duplicate") || error.message.includes("conflict")) {
        return { error: "You're already a member of this group" };
      }
      return { error: error.message };
    }

    if (!data) {
      return { error: "Unexpected response from server" };
    }

    // Try to fetch group details with timeout
    try {
      const { data: groupData } = await Promise.race([
        supabase.from("groups").select("*").eq("id", data).single(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
      ]);

      if (groupData) {
        set((state) => ({
          groups: [{ ...groupData, myRole: "member" }, ...state.groups.filter(g => g.id !== groupData.id)],
        }));
        return { success: true, groupName: groupData.name };
      }
    } catch {
      // Group fetch timed out — still a successful join
    }

    return { success: true, groupName: "group" };
  },

  // Get members of a group
  fetchMembers: async (groupId) => {
    const { data, error } = await supabase
      .from("group_members")
      .select(`
        role,
        user:profiles(id, email, display_name, avatar_url)
      `)
      .eq("group_id", groupId);

    if (error) {
      set({ error: error.message });
      return [];
    }

    const members = data.map((item) => ({
      ...item.user,
      role: item.role,
    }));

    set((state) => ({
      members: { ...state.members, [groupId]: members },
    }));
    return members;
  },

  // Remove a member (admin/owner only)
  removeMember: async (groupId, userId) => {
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);

    if (error) {
      set({ error: error.message });
      return false;
    }

    await get().fetchMembers(groupId);
    return true;
  },

  // Leave a group
  leaveGroup: async (groupId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id);

    if (error) {
      set({ error: error.message });
      return false;
    }

    set((state) => ({
      groups: state.groups.filter((g) => g.id !== groupId),
      activeGroup: state.activeGroup?.id === groupId ? null : state.activeGroup,
    }));
    return true;
  },

  // Delete group (owner only)
  deleteGroup: async (groupId) => {
    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId);

    if (error) {
      set({ error: error.message });
      return false;
    }

    set((state) => ({
      groups: state.groups.filter((g) => g.id !== groupId),
      activeGroup: state.activeGroup?.id === groupId ? null : state.activeGroup,
    }));
    return true;
  },

  setActiveGroup: (group) => set({ activeGroup: group }),
  clearError: () => set({ error: null }),
  reset: () => set({ groups: [], activeGroup: null, members: {}, loading: false, error: null }),
}));

export default useGroupStore;
