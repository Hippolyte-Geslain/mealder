import { create } from 'zustand';
import type { Course } from '../db/types';

export type ComposePicks = {
  entree: string | null;
  plat: string | null;
  dessert: string | null;
};

type ComposeStore = ComposePicks & {
  setPick: (course: Course, recipeId: string) => void;
  reset: () => void;
};

export const useComposeStore = create<ComposeStore>((set) => ({
  entree: null,
  plat: null,
  dessert: null,
  setPick: (course, recipeId) => set({ [course]: recipeId } as Partial<ComposePicks>),
  reset: () => set({ entree: null, plat: null, dessert: null }),
}));
