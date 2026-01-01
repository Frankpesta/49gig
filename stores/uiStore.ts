import { create } from "zustand";

export interface Notification {
  id: string;
  title: string;
  description?: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
}

interface UIState {
  // Modals
  activeModal: string | null;
  modalProps: Record<string, any>;

  // Notifications
  notifications: Notification[];

  // Theme
  theme: "light" | "dark" | "system";

  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Loading overlays
  globalLoading: boolean;
  loadingMessage: string | undefined;

  // Actions
  openModal: (modalId: string, props?: Record<string, any>) => void;
  closeModal: () => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  toggleSidebar: () => void;
  setGlobalLoading: (loading: boolean, message?: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  activeModal: null,
  modalProps: {},
  notifications: [],
  theme: "system",
  sidebarOpen: true,
  sidebarCollapsed: false,
  globalLoading: false,
  loadingMessage: undefined,

  // Actions
  openModal: (modalId, props = {}) =>
    set({
      activeModal: modalId,
      modalProps: props,
    }),

  closeModal: () =>
    set({
      activeModal: null,
      modalProps: {},
    }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, notification],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  setTheme: (theme) => set({ theme }),

  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),

  setGlobalLoading: (loading, message) =>
    set({
      globalLoading: loading,
      loadingMessage: message,
    }),
}));

