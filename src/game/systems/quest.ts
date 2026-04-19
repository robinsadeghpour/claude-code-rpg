import { useGameStore } from "../../store/game-store";
import type { QuestState } from "../../store/types";
import { quests } from "../loader";
import { runQuestCheck } from "./quest-checks";
import { onFileEvent } from "./file-watcher";

export function getQuestState(questId: string): QuestState {
  const store = useGameStore.getState();
  const runtimeState = store.questStates[questId];
  if (runtimeState) return runtimeState;
  const quest = quests[questId];
  if (!quest) {
    console.warn(`Unknown questId: ${questId}`);
    return "locked";
  }
  return quest.state;
}

/** Get the currently active quest (first non-completed, non-locked quest) */
export function getActiveQuest() {
  for (const quest of Object.values(quests)) {
    const state = getQuestState(quest.id);
    if (state === "active" || state === "available") return quest;
  }
  return null;
}

export function tryCompleteQuest(questId: string): boolean {
  const quest = quests[questId];
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

  // Mark NPC as fulfilled
  store.setNPCState(quest.npcId, "fulfilled");

  // Trigger heal moment
  store.triggerHeal(quest.npcId, quest.healMoment.visual, quest.healMoment.audio);

  // Heal the area after the heal moment duration
  setTimeout(() => {
    store.healArea(quest.areaId);
    store.finishHeal();
  }, quest.healMoment.duration);

  // Unlock dependent quests (data-driven from rewards.unlocksNPC)
  // Find quests whose npcId matches the unlocked NPC
  if (quest.rewards.unlocksNPC) {
    const unlockedNpcId = quest.rewards.unlocksNPC;
    for (const [depId, depQuest] of Object.entries(quests)) {
      if (depQuest.npcId === unlockedNpcId && getQuestState(depId) === "locked") {
        store.setQuestState(depId, "available");
      }
    }
  }

  return true;
}

/**
 * Start listening for file watcher events and auto-check quests.
 * When a building asset appears, refresh world state and try to complete
 * any quest that depends on that asset.
 */
export function startQuestWatcher() {
  return onFileEvent(async (event) => {
    if (event.type !== "created" || event.category !== "building") return;

    // Refresh world state so quest checks see the new file
    await useGameStore.getState().fetchWorldState();

    // Try to complete any active quests
    for (const questId of Object.keys(quests)) {
      const state = getQuestState(questId);
      if (state === "active" || state === "available") {
        tryCompleteQuest(questId);
      }
    }
  });
}
