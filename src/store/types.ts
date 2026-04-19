export type NPCState = "waiting" | "fulfilled";
export type QuestState = "locked" | "available" | "active" | "completed";

export interface DialogueLine {
  speaker: string;
  text: string;
}

export interface NPCData {
  id: string;
  name: string;
  role: string;
  area: string;
  position: { x: number; y: number };
  state: NPCState;
  catchphrase: string;
  personality: {
    trait: string;
    speechPattern: string;
    quirk: string;
  };
  dialogue: {
    intro: DialogueLine[];
    reminder: DialogueLine[];
    fulfilled: DialogueLine[];
  };
  sprite: {
    waiting: string;
    fulfilled: string;
  };
  questId: string | null;
  _creatorNote: string;
}

export interface HealMoment {
  duration: number;
  visual: string;
  audio: string;
  npcReaction: DialogueLine[];
  worldChange: string;
}

export interface QuestHudHints {
  objective: string;
  instruction: string;
  detail: string;
  copyable: string;
}

export interface QuestData {
  id: string;
  title: string;
  npcId: string;
  areaId: string;
  state: QuestState;
  description: string;
  checkId: string;
  trigger: {
    type: string;
    condition: string;
  };
  hudHints?: QuestHudHints;
  healMoment: HealMoment;
  rewards: {
    unlocksArea?: string;
    unlocksNPC?: string;
    worldChange?: string;
  };
  _creatorNote: {
    concept: string;
    lesson: string;
    realWorldParallel: string;
  };
}

export interface AreaData {
  id: string;
  name: string;
  tilemap: string;
  unlocked: boolean;
  glitched: boolean;
}
