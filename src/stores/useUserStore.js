import { create } from "zustand";

export const useUserStore = create((set) => ({
  userStore: null, // 初始用户数据
  setUserStore: (userStore) => set({ userStore }),
}));
