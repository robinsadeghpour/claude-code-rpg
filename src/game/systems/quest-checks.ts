import charterData from "../../data/areas/village-charter.json";
import { getForgePipeline } from "./crafting";

type QuestCheck = () => boolean;

const checks: Record<string, QuestCheck> = {
  "charter-restored": () => {
    const keys = Object.keys(charterData);
    return keys.length > 0 && "name" in charterData;
  },
  "forge-prep-restored": () => {
    const pipeline = getForgePipeline();
    return pipeline.some((step) => step.name === "prepare");
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
