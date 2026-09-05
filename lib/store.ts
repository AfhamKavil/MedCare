import { create } from 'zustand';
import { User, mockPatients, Patient } from './db';

interface AppState {
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;
  getPatient: (id: string) => Patient | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  login: (user) => set({ currentUser: user }),
  logout: () => set({ currentUser: null }),
  getPatient: (id) => mockPatients.find((p) => p.id === id),
}));
