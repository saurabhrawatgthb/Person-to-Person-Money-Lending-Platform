import { create } from 'zustand';
import api from '../api/axios';

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
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('smartpeer_user') || 'null'),
  setUser: (user) => {
    localStorage.setItem('smartpeer_user', JSON.stringify(user));
    set({ user });
  },
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    localStorage.setItem('smartpeer_user', JSON.stringify(res.data));
    set({ user: res.data });
  },
  register: async (data) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('smartpeer_user', JSON.stringify(res.data));
    set({ user: res.data });
  },
  logout: () => {
    localStorage.removeItem('smartpeer_user');
    set({ user: null });
  }
}));
