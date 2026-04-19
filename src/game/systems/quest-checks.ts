import { useGameStore } from "../../store/game-store";

type QuestCheck = () => boolean;

const checks: Record<string, QuestCheck> = {
  "town-hall-exists": () => {
    const { worldState } = useGameStore.getState();
    return worldState.buildings["town-hall"]?.exists ?? false;
  },
  "forge-exists": () => {
    const { worldState } = useGameStore.getState();
    return worldState.buildings["forge"]?.exists ?? false;
  },
  "library-exists": () => {
    const { worldState } = useGameStore.getState();
    return worldState.buildings["library"]?.exists ?? false;
  },
};

export function runQuestCheck(checkId: string): boolean {
  const check = checks[checkId];
  if (!check) {
    console.warn(`No check function for: ${checkId}`);
    return false;
  }
  return check();
}
