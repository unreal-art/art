// src/stores/counter-store.ts
import { createStore } from "zustand/vanilla";

export type GenerationState = {
  isActive: boolean;
  mediaType: 'image' | 'video';
};

export type GenerationActions = {
  startGeneration: (mediaType?: 'image' | 'video') => void;
  stopGeneration: () => void;
};

export type GenerationStore = GenerationState & GenerationActions;

//initialize
export const initGenerationStore = (): GenerationState => {
  return { isActive: false, mediaType: 'image' };
};

export const defaultInitState: GenerationState = {
  isActive: false,
  mediaType: 'image',
};

export const createGenerationStore = (
  initState: GenerationState = defaultInitState
) => {
  return createStore<GenerationStore>()((set) => ({
    ...initState,
    // startGeneration: () => set((state) => ({ count: state.count - 1 })),
    // incrementCount: () => set((state) => ({ count: state.count + 1 })),
    startGeneration: (mediaType = 'image') => set(() => ({ isActive: true, mediaType })),
    stopGeneration: () => set(() => ({ isActive: false })),
  }));
};
