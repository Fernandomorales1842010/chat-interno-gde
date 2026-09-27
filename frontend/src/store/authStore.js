import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token, user } = response.data.data;
      
      localStorage.setItem('token', token);
      set({ token, user, isLoading: false });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  fetchMe: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data.data });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
