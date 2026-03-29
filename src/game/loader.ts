import type { NPCData, QuestData } from "../store/types";
import mayorData from "../data/npcs/npc-mayor.json";
import blacksmithData from "../data/npcs/npc-blacksmith.json";
import missingCharterData from "../data/quests/quest-missing-charter.json";
import forgottenPrepData from "../data/quests/quest-forgotten-prep.json";

export const npcs: Record<string, NPCData> = {
  mayor: mayorData as unknown as NPCData,
  blacksmith: blacksmithData as unknown as NPCData,
};

export const quests: Record<string, QuestData> = {
  "missing-charter": missingCharterData as unknown as QuestData,
  "forgotten-prep": forgottenPrepData as unknown as QuestData,
};

export function getNPC(id: string): NPCData | undefined {
  return npcs[id];
}

export function getAllNPCs(): NPCData[] {
  return Object.values(npcs);
}

export function getNPCsForArea(areaId: string): NPCData[] {
  return Object.values(npcs).filter((npc) => npc.area === areaId);
}
