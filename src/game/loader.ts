import type { NPCData, QuestData } from "../store/types";
import mayorBrambleData from "../data/npcs/npc-mayor-bramble.json";
import buildTownHallData from "../data/quests/quest-build-town-hall.json";

// ── NPC registry ──
export const npcs: Record<string, NPCData> = {
  "mayor-bramble": mayorBrambleData as unknown as NPCData,
};

// ── Quest registry (single source of truth) ──
export const quests: Record<string, QuestData> = {
  "build-town-hall": buildTownHallData as unknown as QuestData,
};

export function getNPC(id: string): NPCData | undefined {
  return npcs[id];
}

export function getQuest(id: string): QuestData | undefined {
  return quests[id];
}

export function getAllQuests(): QuestData[] {
  return Object.values(quests);
}

export function getAllNPCs(): NPCData[] {
  return Object.values(npcs);
}

export function getNPCsForArea(areaId: string): NPCData[] {
  return Object.values(npcs).filter((npc) => npc.area === areaId);
}
