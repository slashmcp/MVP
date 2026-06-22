import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  bypassedServices: string[];
  bypassService: (service: string) => void;

  // Real Database State
  isDbLoading: boolean;
  dbCandidates: any[];
  dbJobs: any[];
  dbClients: any[];
  dbSequences: any[];
  fetchDatabase: () => Promise<void>;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface CredentialPromptState {
  service: 'google-sheets' | 'anthropic' | 'outlook' | 'n8n' | 'serper' | 'apify' | 'juicebox';
  feature: string;
}

let toastCounter = 0;

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
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
  bypassedServices: [],
  bypassService: (service) => set((state) => ({ bypassedServices: [...state.bypassedServices, service] })),

  isDbLoading: true,
  dbCandidates: [],
  dbJobs: [],
  dbClients: [],
  dbSequences: [],
  fetchDatabase: async () => {
    set({ isDbLoading: true });
    // Dynamically import to avoid server-side issues with Zustand
    const { getCandidates, getJobs, getClients, getSequences } = await import('@/lib/db-client');
    const [cands, jobs, clients, sequences] = await Promise.all([
      getCandidates(),
      getJobs(),
      getClients(),
      getSequences()
    ]);
    set({
      dbCandidates: cands,
      dbJobs: jobs,
      dbClients: clients,
      dbSequences: sequences,
      isDbLoading: false
    });
  }
    }),
    {
      name: 'recruitment-command-center-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        hiddenClientIds: state.hiddenClientIds,
        hiddenCandidateIds: state.hiddenCandidateIds,
        hiddenJobIds: state.hiddenJobIds,
      }),
    }
  )
);
