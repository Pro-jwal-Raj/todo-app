import { create } from "zustand";
import { supabase } from "../lib/supabase";

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,
  _initialized: false,
  _authSubscription: null,

  // Initialize — call on app mount (idempotent)
  initialize: async () => {
    if (get()._initialized) return;
    set({ _initialized: true });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await get().fetchProfile(session.user.id);
        set({ user: session.user, profile, loading: false });
      } else {
        set({ loading: false });
      }

      // Listen for auth changes (store subscription for cleanup)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_OUT") {
          set({ user: null, profile: null, loading: false });
          return;
        }
        if (session?.user) {
          const profile = await get().fetchProfile(session.user.id);
          set({ user: session.user, profile, loading: false });
        } else {
          set({ user: null, profile: null, loading: false });
        }
      });
      set({ _authSubscription: subscription });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchProfile: async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    return data;
  },

  signUp: async (email, password, displayName) => {
    set({ error: null, loading: true });
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });
      if (error) {
        set({ error: error.message, loading: false });
        return false;
      }
      set({ loading: false });
      return true;
    } catch (err) {
      const msg = err?.message?.includes("fetch")
        ? "Cannot reach Supabase. Check your VITE_SUPABASE_URL in .env and restart the dev server."
        : err?.message || "Sign up failed";
      set({ error: msg, loading: false });
      return false;
    }
  },

  signIn: async (email, password) => {
    set({ error: null, loading: true });
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        set({ error: error.message, loading: false });
        return false;
      }
      set({ loading: false });
      return true;
    } catch (err) {
      const msg = err?.message?.includes("fetch")
        ? "Cannot reach Supabase. Check your VITE_SUPABASE_URL in .env and restart the dev server."
        : err?.message || "Sign in failed";
      set({ error: msg, loading: false });
      return false;
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
    set({ user: null, profile: null, loading: false });
  },

  updateProfile: async (updates) => {
    const user = get().user;
    if (!user) return false;
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();
    if (error) {
      set({ error: error.message });
      return false;
    }
    set({ profile: data });
    return true;
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
