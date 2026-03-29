import { useGameStore } from "../../store/game-store";
import type { QuestData, QuestState } from "../../store/types";
import missingCharterData from "../../data/quests/quest-missing-charter.json";
import forgottenPrepData from "../../data/quests/quest-forgotten-prep.json";
import { runQuestCheck } from "./quest-checks";

const questRegistry: Record<string, QuestData> = {
  "missing-charter": missingCharterData as QuestData,
  "forgotten-prep": forgottenPrepData as QuestData,
};

// Which quests unlock when a given quest is completed
const questUnlockMap: Record<string, string[]> = {
  "missing-charter": ["forgotten-prep"],
};

export function getQuestState(questId: string): QuestState {
  const store = useGameStore.getState();
  const runtimeState = store.questStates[questId];
  if (runtimeState) return runtimeState;
  // Fall back to the data file's initial state
  const quest = questRegistry[questId];
  if (!quest) {
    console.warn(`Unknown questId: ${questId}`);
    return "locked";
  }
  return quest.state;
}

export function tryCompleteQuest(questId: string): boolean {
  const quest = questRegistry[questId];
  if (!quest) {
    console.warn(`tryCompleteQuest: unknown questId: ${questId}`);
    return false;
  }

  const currentState = getQuestState(questId);
  if (currentState === "completed") return true;

  const passed = runQuestCheck(quest.checkId);
  if (!passed) return false;

  const store = useGameStore.getState();

  // Mark quest completed
  store.setQuestState(questId, "completed");

  // Heal the NPC
  store.setNPCState(quest.npcId, "healed");

  // Trigger heal moment
  store.triggerHeal(quest.npcId, quest.healMoment.visual, quest.healMoment.audio);

  // Heal the area after the heal moment duration
  setTimeout(() => {
    store.healArea(quest.areaId);
    store.finishHeal();
  }, quest.healMoment.duration);

  // Unlock dependent quests
  const toUnlock = questUnlockMap[questId] ?? [];
  for (const dependentId of toUnlock) {
    const depState = getQuestState(dependentId);
    if (depState === "locked") {
      store.setQuestState(dependentId, "available");
    }
  }

  return true;
}
