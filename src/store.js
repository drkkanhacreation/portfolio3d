import { create } from 'zustand'

export const useGameStore = create((set, get) => ({
  // Loading
  loaded: false,
  loadingProgress: 0,
  setLoaded: () => set({ loaded: true }),
  setLoadingProgress: (p) => set({ loadingProgress: p }),

  // UI overlays
  activeSection: null,
  setActiveSection: (s) => set({ activeSection: s }),

  // Car state
  carPosition: [0, 0.5, 0],
  setCarPosition: (p) => set({ carPosition: p }),
  carSpeed: 18,
  setCarSpeed: (s) => set({ carSpeed: s }),
  selectedCar: 'cyber',
  setSelectedCar: (c) => set({ selectedCar: c }),

  // Auto Drive
  autoDrive: false,
  toggleAutoDrive: () => set((s) => ({ autoDrive: !s.autoDrive })),

  // Intelligent Navigation
  navTarget: null,       // 'about' | 'projects' | 'skills' | 'contact' | 'awards' | 'experience' | 'milestones' | 'map' | null
  isNavigating: false,
  navigateTo: (section) => set({ navTarget: section, isNavigating: true, autoDrive: false }),
  clearNav: () => set({ navTarget: null, isNavigating: false }),

  // Camera Mode: 'follow' | 'topdown' | 'cinematic'
  cameraMode: 'follow',
  setCameraMode: (m) => set({ cameraMode: m }),

  // Live speed (for speed-based visual effects)
  currentSpeed: 0,
  setCurrentSpeed: (s) => set({ currentSpeed: s }),

  // Controls hint shown
  hintsShown: false,
  setHintsShown: () => set({ hintsShown: true }),

  // Day / Night
  isDayMode: false,
  toggleDayMode: () => set((s) => ({ isDayMode: !s.isDayMode })),

  // Map overlay
  showMap: false,
  setShowMap: (v) => set({ showMap: v }),

  // Sound
  soundEnabled: true,
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),

  // Reset
  resetKey: 0,
  resetCar: () => set((s) => ({ resetKey: s.resetKey + 1, activeSection: null })),
}))

