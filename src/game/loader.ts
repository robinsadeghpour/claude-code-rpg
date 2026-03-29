import type { NPCData, QuestData } from "../store/types";
import mayorData from "../data/npcs/npc-mayor.json";
import blacksmithData from "../data/npcs/npc-blacksmith.json";

export const npcs: Record<string, NPCData> = {
  mayor: mayorData as unknown as NPCData,
  blacksmith: blacksmithData as unknown as NPCData,
};

export const quests: Record<string, QuestData> = {};

export function getNPC(id: string): NPCData | undefined {
  return npcs[id];
}

export function getAllNPCs(): NPCData[] {
  return Object.values(npcs);
}

export function getNPCsForArea(areaId: string): NPCData[] {
  return Object.values(npcs).filter((npc) => npc.area === areaId);
}
