import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DialogueLine, NPCState, QuestState } from "./types";

export interface SkillEntry {
  name: string;
  description: string;
  category: string;
  path: string;
  content?: string;
}

export interface AgentEntry {
  name: string;
  role: string;
  description: string;
  path: string;
}

export interface WorldState {
  buildings: Record<string, { exists: boolean; builtAt: string | null }>;
  questProgress: Record<string, string>;
  lastEvent: string | null;
}

export type VoiceShape = "wide" | "sharp" | "narrow";

export interface ActiveInvoke {
  skillName: string;
  archetypeId: string;
  kind: "house" | "farm" | "lantern";
  buildLabel: string;
  position: [number, number];
  buildingId: string;
  command: string;
  /** "ready" → showing copyable + place button. "waiting" → intent posted, waiting for build. */
  phase: "ready" | "waiting" | "error";
  errorMessage?: string;
  startedAt: number;
}

interface GameStore {
  inWorld: boolean;
  setInWorld: (val: boolean) => void;
  playerPosition: { x: number; y: number };
  currentArea: string;

  hasStartedGame: boolean;
  startGame: () => void;
  resetGame: () => Promise<void>;

  // World state (mirrors game-data/world-state.json)
  worldState: WorldState;
  fetchWorldState: () => Promise<void>;

  npcStates: Record<string, NPCState>;
  setNPCState: (npcId: string, state: NPCState) => void;

  questStates: Record<string, QuestState>;
  setQuestState: (questId: string, state: QuestState) => void;

  seenQuestIds: string[];
  markQuestsSeen: (ids: string[]) => void;

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

  // Claude data (Workshop)
  skills: SkillEntry[];
  agents: AgentEntry[];
  claudeLoading: boolean;
  isBookshelfOpen: boolean;
  isEditorOpen: boolean;
  editingSkill: string | null;
  fetchSkills: () => Promise<void>;
  fetchAgents: () => Promise<void>;
  fetchSkillContent: (name: string) => Promise<string | null>;
  saveSkill: (name: string, content: string) => Promise<boolean>;
  openBookshelf: () => void;
  closeBookshelf: () => void;
  openEditor: (skillName?: string | null) => void;
  closeEditor: () => void;

  // Apprentice / Loom
  isLoomOpen: boolean;
  openLoom: () => void;
  closeLoom: () => void;
  lastForgedApprentice: string | null;
  lastApprenticeArchetype: string | null;
  lastApprenticeShape: VoiceShape | null;
  hasUsedForgedSkill: boolean;
  recordApprentice: (name: string, archetype: string, shape: VoiceShape) => void;

  activeInvoke: ActiveInvoke | null;
  openInvoke: (s: ActiveInvoke) => void;
  setInvokePhase: (phase: ActiveInvoke["phase"], errorMessage?: string) => void;
  clearInvoke: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      inWorld: false,
      setInWorld: (val) => set({ inWorld: val }),
      playerPosition: { x: 400, y: 380 },
      currentArea: "village-square",

      hasStartedGame: false,
      startGame: () => set({ hasStartedGame: true }),
      resetGame: async () => {
        // Wipe server-side built assets + world-state so the village starts blank.
        try {
          await fetch("/api/reset-world", { method: "POST" });
        } catch (err) {
          console.warn("Failed to reset world on server:", err);
        }
        set({
          hasStartedGame: false,
          playerPosition: { x: 400, y: 380 },
          currentArea: "village-square",
          npcStates: {},
          questStates: {},
          seenQuestIds: [],
          healedAreas: [],
          worldState: { buildings: {}, questProgress: {}, lastEvent: null },
          lastForgedApprentice: null,
          lastApprenticeArchetype: null,
          lastApprenticeShape: null,
          hasUsedForgedSkill: false,
        });
      },

      worldState: { buildings: {}, questProgress: {}, lastEvent: null },
      fetchWorldState: async () => {
        try {
          const res = await fetch("/api/world-state");
          const data = await res.json();
          set({ worldState: data });
        } catch (err) {
          console.warn("Failed to fetch world state:", err);
        }
      },

      npcStates: {},
      setNPCState: (npcId, state) =>
        set((s) => ({ npcStates: { ...s.npcStates, [npcId]: state } })),

      questStates: {},
      setQuestState: (questId, state) =>
        set((s) => ({ questStates: { ...s.questStates, [questId]: state } })),

      seenQuestIds: [],
      markQuestsSeen: (ids) =>
        set((s) => {
          const next = new Set(s.seenQuestIds);
          for (const id of ids) next.add(id);
          if (next.size === s.seenQuestIds.length) return {};
          return { seenQuestIds: Array.from(next) };
        }),

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

      // Claude data (Workshop)
      skills: [],
      agents: [],
      claudeLoading: false,
      isBookshelfOpen: false,
      isEditorOpen: false,
      editingSkill: null,

      fetchSkills: async () => {
        set({ claudeLoading: true });
        try {
          const res = await fetch("/api/claude/skills");
          const data = await res.json();
          set({ skills: data });
        } catch (err) {
          console.warn("Failed to fetch skills:", err);
        } finally {
          set({ claudeLoading: false });
        }
      },

      fetchAgents: async () => {
        try {
          const res = await fetch("/api/claude/agents");
          const data = await res.json();
          set({ agents: data });
        } catch (err) {
          console.warn("Failed to fetch agents:", err);
        }
      },

      fetchSkillContent: async (name: string) => {
        try {
          const res = await fetch(`/api/claude/skills/${encodeURIComponent(name)}`);
          if (!res.ok) return null;
          const data = await res.json();
          // Update the skill entry with content
          set((s) => ({
            skills: s.skills.map((sk) =>
              sk.name === name || sk.path.includes(`/${name}/`)
                ? { ...sk, content: data.content }
                : sk,
            ),
          }));
          return data.content as string;
        } catch (err) {
          console.warn("Failed to fetch skill content:", err);
          return null;
        }
      },

      saveSkill: async (name: string, content: string) => {
        try {
          const res = await fetch(`/api/claude/skills/${encodeURIComponent(name)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          });
          if (res.ok) {
            await get().fetchSkills();
            return true;
          }
          return false;
        } catch (err) {
          console.warn("Failed to save skill:", err);
          return false;
        }
      },

      openBookshelf: () => set({ isBookshelfOpen: true }),
      closeBookshelf: () => set({ isBookshelfOpen: false, isEditorOpen: false, editingSkill: null }),
      openEditor: (skillName = null) => set({ isEditorOpen: true, editingSkill: skillName ?? null }),
      closeEditor: () => set({ isEditorOpen: false, editingSkill: null }),

      // Apprentice / Loom
      isLoomOpen: false,
      openLoom: () => set({ isLoomOpen: true }),
      closeLoom: () => set({ isLoomOpen: false }),
      lastForgedApprentice: null,
      lastApprenticeArchetype: null,
      lastApprenticeShape: null,
      hasUsedForgedSkill: false,
      recordApprentice: (name, archetype, shape) =>
        set({
          lastForgedApprentice: name,
          lastApprenticeArchetype: archetype,
          lastApprenticeShape: shape,
          hasUsedForgedSkill: false,
        }),

      activeInvoke: null,
      openInvoke: (s) => set({ activeInvoke: s, hasUsedForgedSkill: true }),
      setInvokePhase: (phase, errorMessage) =>
        set((state) =>
          state.activeInvoke
            ? { activeInvoke: { ...state.activeInvoke, phase, errorMessage } }
            : {},
        ),
      clearInvoke: () => set({ activeInvoke: null }),
    }),
    {
      name: "claude-code-rpg-save",
      partialize: (state) => ({
        hasStartedGame: state.hasStartedGame,
        playerPosition: state.playerPosition,
        currentArea: state.currentArea,
        npcStates: state.npcStates,
        questStates: state.questStates,
        seenQuestIds: state.seenQuestIds,
        healedAreas: state.healedAreas,
        lastForgedApprentice: state.lastForgedApprentice,
        lastApprenticeArchetype: state.lastApprenticeArchetype,
        lastApprenticeShape: state.lastApprenticeShape,
        hasUsedForgedSkill: state.hasUsedForgedSkill,
      }),
    }
  )
);
