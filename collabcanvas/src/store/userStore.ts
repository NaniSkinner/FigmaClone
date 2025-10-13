import { create } from "zustand";
import { User, UserPresence } from "@/types";

interface UserStore {
  currentUser: User | null;
  onlineUsers: Map<string, UserPresence>;
  setCurrentUser: (user: User | null) => void;
  updateOnlineUsers: (users: UserPresence[]) => void;
  removeOnlineUser: (userId: string) => void;
  addOnlineUser: (user: UserPresence) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  currentUser: null,
  onlineUsers: new Map(),

  setCurrentUser: (user) => set({ currentUser: user }),

  updateOnlineUsers: (users) =>
    set({ onlineUsers: new Map(users.map((u) => [u.userId, u])) }),

  removeOnlineUser: (userId) =>
    set((state) => {
      const newMap = new Map(state.onlineUsers);
      newMap.delete(userId);
      return { onlineUsers: newMap };
    }),

  addOnlineUser: (user) =>
    set((state) => {
      const newMap = new Map(state.onlineUsers);
      newMap.set(user.userId, user);
      return { onlineUsers: newMap };
    }),
}));
