import { create } from 'zustand';

interface User {
  _id: string;
  name: string;
  email: string;
  trustScore: number;
  token: string;
}

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null, // Read from localStorage ideally
  setUser: (user) => set({ user }),
  logout: () => set({ user: null })
}));
