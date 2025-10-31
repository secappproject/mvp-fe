import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Project {
  id: number;
  projectName: string;
  wbs: string;
  category: string;
  quantity: number;
  vendorPanel: string;
  vendorBusbar: string;
  panelProgress: number;
  statusBusbar: "Punching/Bending" | "Plating" | "Heatshrink" | "Done";
  createdAt: string;
  updatedAt: string;

  planStart: string;
  fatStart: string | null;

  planDeliveryBasicKitPanel: string | null;
  planDeliveryBasicKitBusbar: string | null;
  actualDeliveryBasicKitPanel: string | null;
  actualDeliveryBasicKitBusbar: string | null;

  planDeliveryAccessoriesPanel: string | null;
  planDeliveryAccessoriesBusbar: string | null;
  actualDeliveryAccessoriesPanel: string | null;
  actualDeliveryAccessoriesBusbar: string | null;
}

interface UserState {
  username: string | null;
  role: string | null;
  companyName: string | null;
  vendorType: string | null; 
  isLoggedIn: boolean;
  login: (userData: {
    username: string;
    role: string;
    companyName: string | null;
    vendorType: string | null; 
  }) => void;
  logout: () => void;
}

type NullString = {
  String: string;
  Valid: boolean;
};

export type User = {
  id: number;
  username: string;
  role: string;
  companyName: NullString | null;  
  vendorType: NullString | null;  
};

export interface Vendor {
  id: number;
  companyName: string;
  vendorType: string;
  createdAt: string;
  updatedAt: string;
}

export const useAuthStore = create<UserState>()(
  persist(
    (set) => ({
      username: null,
      role: null,
      companyName: null,
      vendorType: null, 
      isLoggedIn: false,

      login: (userData) => set({
        username: userData.username,
        role: userData.role,
        companyName: userData.companyName,
        vendorType: userData.vendorType, 
        isLoggedIn: true,
      }),

      logout: () => set({
        username: null,
        role: null,
        companyName: null,
        vendorType: null, 
        isLoggedIn: false,
      }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);