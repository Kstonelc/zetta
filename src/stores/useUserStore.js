import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUserStore = create(
  persist(
    (set) => ({
      userStore: null,
      setUserStore: (userStore) => set({ userStore }),
    }),
    {
      name: "bichon-user-info",
      // 可选：只持久化特定字段
      partialize: (state) => ({ userStore: state.userStore }),
    },
  ),
);
