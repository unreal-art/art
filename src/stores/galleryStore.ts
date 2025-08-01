import { create } from "zustand"

export type GalleryTab =
  | "EXPLORE"
  | "FOLLOWING"
  | "FEED"
  | "SEARCH"
  | "FEATURED MINTS"

interface GalleryState {
  // Active tab in the gallery
  activeTab: GalleryTab

  // Is a tab transition in progress?
  isTabTransitioning: boolean

  // Previous active tab (for transition optimization)
  previousTab: GalleryTab | null

  // Setters
  setActiveTab: (tab: GalleryTab) => void
  setIsTabTransitioning: (isTransitioning: boolean) => void

  // Initialize from URL parameter
  initFromUrl: (urlParam: string | null) => void
}

export const useGalleryStore = create<GalleryState>((set) => ({
  // Default tab //TODO: active tab
  activeTab: "EXPLORE",

  // Default transition state
  isTabTransitioning: false,

  // No previous tab initially
  previousTab: null,

  // Set the active tab
  setActiveTab: (tab: GalleryTab) =>
    set((state) => {
      // Only set transitioning if the tab is changing
      const isChanging = state.activeTab !== tab
      return {
        activeTab: tab,
        isTabTransitioning: isChanging,
        // Track previous tab when changing
        previousTab: isChanging ? state.activeTab : state.previousTab,
      }
    }),

  // Set the transitioning state
  setIsTabTransitioning: (isTransitioning: boolean) =>
    set({ isTabTransitioning: isTransitioning }),

  // Initialize from URL parameter
  initFromUrl: (urlParam) => {
    if (!urlParam) return

    // Convert URL parameter to uppercase for gallery tab
    const paramUppercase = urlParam.toUpperCase() as GalleryTab

    // Only set if it's a valid tab
    const validTabs: GalleryTab[] = [
      "EXPLORE",
      "FOLLOWING",
      "FEED",
      "SEARCH",
      "FEATURED MINTS",
    ]
    if (validTabs.includes(paramUppercase)) {
      set((state) => ({
        previousTab:
          state.activeTab !== paramUppercase
            ? state.activeTab
            : state.previousTab,
        activeTab: paramUppercase,
        // Don't set transitioning on initial load
        isTabTransitioning: false,
      }))
    }
  },
}))
