import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DialogueLine, NPCState, QuestState } from "./types";

interface GameStore {
  playerPosition: { x: number; y: number };
  currentArea: string;

  npcStates: Record<string, NPCState>;
  setNPCState: (npcId: string, state: NPCState) => void;

  questStates: Record<string, QuestState>;
  setQuestState: (questId: string, state: QuestState) => void;

  isDialogueOpen: boolean;
  currentDialogue: DialogueLine[] | null;
  dialogueIndex: number;
  openDialogue: (lines: DialogueLine[]) => void;
  advanceDialogue: () => void;
  closeDialogue: () => void;

  isHealing: boolean;
  healData: { npcId: string; visual: string; audio: string } | null;
  triggerHeal: (npcId: string, visual: string, audio: string) => void;
  finishHeal: () => void;

  healedAreas: string[];
  healArea: (areaId: string) => void;

  savePosition: (x: number, y: number) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      playerPosition: { x: 400, y: 300 },
      currentArea: "village-square",

      npcStates: {},
      setNPCState: (npcId, state) =>
        set((s) => ({ npcStates: { ...s.npcStates, [npcId]: state } })),

      questStates: {},
      setQuestState: (questId, state) =>
        set((s) => ({ questStates: { ...s.questStates, [questId]: state } })),

      isDialogueOpen: false,
      currentDialogue: null,
      dialogueIndex: 0,
      openDialogue: (lines) =>
        set({ isDialogueOpen: true, currentDialogue: lines, dialogueIndex: 0 }),
      advanceDialogue: () => {
        const { dialogueIndex, currentDialogue } = get();
        if (!currentDialogue) return;
        if (dialogueIndex < currentDialogue.length - 1) {
          set({ dialogueIndex: dialogueIndex + 1 });
        } else {
          set({ isDialogueOpen: false, currentDialogue: null, dialogueIndex: 0 });
        }
      },
      closeDialogue: () =>
        set({ isDialogueOpen: false, currentDialogue: null, dialogueIndex: 0 }),

      isHealing: false,
      healData: null,
      triggerHeal: (npcId, visual, audio) =>
        set({ isHealing: true, healData: { npcId, visual, audio } }),
      finishHeal: () => set({ isHealing: false, healData: null }),

      healedAreas: [],
      healArea: (areaId) =>
        set((s) => ({
          healedAreas: s.healedAreas.includes(areaId)
            ? s.healedAreas
            : [...s.healedAreas, areaId],
        })),

      savePosition: (x, y) => set({ playerPosition: { x, y } }),
    }),
    {
      name: "claude-code-rpg-save",
      partialize: (state) => ({
        playerPosition: state.playerPosition,
        currentArea: state.currentArea,
        npcStates: state.npcStates,
        questStates: state.questStates,
        healedAreas: state.healedAreas,
      }),
    }
  )
);
