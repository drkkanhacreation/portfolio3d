import { create } from 'zustand'

export const useGameStore = create((set, get) => ({
  phase: 'loading', // loading | playing | paused
  activeSection: null, // null | 'about' | 'projects' | 'contact'
  controls: {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    boost: false,
    reset: false,
  },
  loadingProgress: 0,
  notifications: [],

  setPhase: (phase) => set({ phase }),
  setActiveSection: (section) => set({ activeSection: section }),
  setLoadingProgress: (p) => set({ loadingProgress: p }),

  setControl: (key, value) =>
    set((s) => ({ controls: { ...s.controls, [key]: value } })),

  addNotification: (msg) => {
    const id = Date.now()
    set((s) => ({ notifications: [...s.notifications, { id, msg }] }))
    setTimeout(() => {
      set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }))
    }, 3000)
  },

  resetControls: () =>
    set({
      controls: {
        forward: false, backward: false,
        left: false, right: false,
        jump: false, boost: false, reset: false,
      }
    }),
}))
