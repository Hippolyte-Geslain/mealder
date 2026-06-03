import { create } from 'zustand';
import type { Course } from '../db/types';

export type ComposePick = { course: Course; recipeId: string };

type ComposeStore = {
  picks: ComposePick[];
  addPick: (course: Course, recipeId: string) => void;
  removePickAt: (index: number) => void;
  reset: () => void;
};

export const useComposeStore = create<ComposeStore>((set) => ({
  picks: [],
  addPick: (course, recipeId) =>
    set((s) => ({ picks: [...s.picks, { course, recipeId }] })),
  removePickAt: (index) =>
    set((s) => ({ picks: s.picks.filter((_, i) => i !== index) })),
  reset: () => set({ picks: [] }),
}));
