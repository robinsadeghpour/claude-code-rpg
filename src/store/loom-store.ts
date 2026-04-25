import { create } from "zustand";

export type LoomStage = "intro" | "station" | "reveal" | "closed";

interface LoomStore {
  stage: LoomStage;
  station: number; // 1..3
  archetypeId: string | null;
  name: string;
  recipeId: string | null;
  saveError: string | null;

  reset: () => void;
  setStage: (stage: LoomStage) => void;
  setStation: (n: number) => void;
  setArchetype: (id: string) => void;
  setName: (n: string) => void;
  setRecipe: (id: string) => void;
  setSaveError: (err: string | null) => void;
}

const initial = {
  stage: "intro" as LoomStage,
  station: 1,
  archetypeId: null as string | null,
  name: "",
  recipeId: null as string | null,
  saveError: null,
};

export const useLoomStore = create<LoomStore>((set) => ({
  ...initial,
  reset: () => set(initial),
  setStage: (stage) => set({ stage }),
  setStation: (station) => set({ station }),
  setArchetype: (id) => set({ archetypeId: id, name: "", recipeId: null }),
  setName: (name) => set({ name }),
  setRecipe: (recipeId) => set({ recipeId }),
  setSaveError: (err) => set({ saveError: err }),
}));
