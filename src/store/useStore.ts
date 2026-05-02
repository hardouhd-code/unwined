import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supa } from "../lib/supabase";
import { Wine, UserProfile } from "../types";

interface AppState {
  user: any | null; // Supabase session user
  db: Wine[];
  userName: string;
  setUser: (u: any | null) => void;
  setUserName: (name: string) => void;
  setDb: (db: Wine[]) => void;
  addWine: (wine: Wine) => void;
  updateWine: (id: string | number, patch: Partial<Wine>) => void;
  deleteWine: (id: string | number) => void;
  syncProfile: () => Promise<void>;
  loadProfile: (userId: string) => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      db: [],
      userName: "",
      setUser: (u) => set({ user: u }),
      setUserName: (name) => {
        set({ userName: name });
        get().syncProfile();
      },
      setDb: (db) => {
        set({ db });
        get().syncProfile();
      },
      addWine: (wine) => {
        set((state) => ({ db: [wine, ...state.db] }));
        get().syncProfile();
      },
      updateWine: (id, patch) => {
        set((state) => ({
          db: state.db.map((w) => (w.id === id ? { ...w, ...patch } : w)),
        }));
        get().syncProfile();
      },
      deleteWine: (id) => {
        set((state) => ({
          db: state.db.filter((w) => w.id !== id),
        }));
        get().syncProfile();
      },
      syncProfile: async () => {
        const { user, userName, db } = get();
        if (!user) return;
        try {
          await supa.saveProfile(user.id, userName, db);
        } catch (e) {
          console.error("Sync failed:", e);
        }
      },
      loadProfile: async (userId) => {
        const profile = await supa.loadProfile(userId);
        if (profile) {
          set({ userName: profile.name || "" });
          if (profile.cave) {
            try {
              const parsed = JSON.parse(profile.cave);
              set({ db: Array.isArray(parsed) ? parsed : [] });
            } catch (e) {
              set({ db: [] });
            }
          }
        }
      },
    }),
    {
      name: "unwined-storage",
      partialize: (state) => ({ userName: state.userName, db: state.db }), // Persist backup
    }
  )
);
