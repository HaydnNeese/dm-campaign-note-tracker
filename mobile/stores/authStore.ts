// ─── Auth store (Zustand) ───────────────────────────────────
// Manages logged-in user state and active campaign selection.

import { create } from "zustand";
import type { User, Campaign } from "@/types";
import { removeToken, getToken } from "@/services/api";
import { getMe } from "@/services/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeCampaign: Campaign | null;

  setUser: (user: User) => void;
  setActiveCampaign: (campaign: Campaign | null) => void;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  activeCampaign: null,

  setUser: (user) => set({ user, isAuthenticated: true }),

  setActiveCampaign: (campaign) => set({ activeCampaign: campaign }),

  logout: async () => {
    await removeToken();
    set({
      user: null,
      isAuthenticated: false,
      activeCampaign: null,
    });
  },

  /** Check for existing token on app start and load user */
  loadUser: async () => {
    try {
      const token = await getToken();
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const { user } = await getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      // Token expired or invalid
      await removeToken();
      set({ isLoading: false });
    }
  },
}));
