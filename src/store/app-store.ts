import { create } from 'zustand';

interface AppState {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarMobileOpen: (open: boolean) => void;

  // Modal state
  activeModal: string | null;
  modalData: Record<string, unknown> | null;
  openModal: (id: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Entity management
  hiddenClientIds: string[];
  hideClient: (id: string) => void;
  hiddenCandidateIds: string[];
  hideCandidate: (id: string) => void;
  hiddenJobIds: string[];
  hideJob: (id: string) => void;

  // Toast state
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  // Search
  globalSearch: string;
  setGlobalSearch: (query: string) => void;

  // Credential prompt
  credentialPrompt: CredentialPromptState | null;
  showCredentialPrompt: (state: CredentialPromptState) => void;
  dismissCredentialPrompt: () => void;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface CredentialPromptState {
  service: 'google-sheets' | 'openai' | 'outlook' | 'n8n';
  feature: string;
}

let toastCounter = 0;

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),

  activeModal: null,
  modalData: null,
  openModal: (id, data) => set({ activeModal: id, modalData: data || null }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  hiddenClientIds: [],
  hideClient: (id) => set((state) => ({ hiddenClientIds: [...state.hiddenClientIds, id] })),
  hiddenCandidateIds: [],
  hideCandidate: (id) => set((state) => ({ hiddenCandidateIds: [...state.hiddenCandidateIds, id] })),
  hiddenJobIds: [],
  hideJob: (id) => set((state) => ({ hiddenJobIds: [...state.hiddenJobIds, id] })),

  toasts: [],
  addToast: (toast) => {
    const id = `toast-${++toastCounter}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, toast.duration || 4000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  globalSearch: '',
  setGlobalSearch: (query) => set({ globalSearch: query }),

  credentialPrompt: null,
  showCredentialPrompt: (state) => set({ credentialPrompt: state }),
  dismissCredentialPrompt: () => set({ credentialPrompt: null }),
}));
