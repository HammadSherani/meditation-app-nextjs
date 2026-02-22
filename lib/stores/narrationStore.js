import { create } from 'zustand';

export const useNarrationStore = create((set) => ({
  narrations: [],
  isLoading: false,
  error: null,

  // Fetch narrations from API
  fetchNarrations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/get-narrations");
      const data = await response.json();
      
      if (data.success) {
        set({ narrations: data.narrations, isLoading: false });
      } else {
        set({ error: data.message || "Failed to fetch narrations", isLoading: false });
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Add new narration to store
  addNarration: (narration) => {
    set((state) => ({
      narrations: [narration, ...state.narrations],
    }));
  },

  // Update narration
  updateNarration: (id, updatedData) => {
    set((state) => ({
      narrations: state.narrations.map((n) =>
        n._id === id || n.id === id ? { ...n, ...updatedData } : n
      ),
    }));
  },

  // Delete narration
  deleteNarration: (id) => {
    set((state) => ({
      narrations: state.narrations.filter(
        (n) => n._id !== id && n.id !== id
      ),
    }));
  },

  // Clear all narrations
  clearNarrations: () => {
    set({ narrations: [] });
  },
}));
