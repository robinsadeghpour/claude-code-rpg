import loreData from "../../data/apprentice/lore.json";
import { getArchetype } from "./skill-serializer";

export interface SummonEffect {
  archetypeId: string;
  label: string;   // e.g. "Whisper of Pages"
  flavor: string;  // one-line payload (lore / crafted-thing / found-thing)
  visual: "scroll" | "spark" | "sparkle";
}

const lore = loreData as unknown as Record<string, string[]>;

export const SUMMON_COOLDOWN_MS = 4500;
export const SUMMON_DURATION_MS = 2600;

export function rollSummon(archetypeId: string): SummonEffect | null {
  const archetype = getArchetype(archetypeId);
  if (!archetype) return null;
  const pool = lore[archetypeId] ?? [];
  const flavor = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : "—";
  const visual: SummonEffect["visual"] =
    archetypeId === "chronicler" ? "scroll" :
    archetypeId === "forgemaster" ? "spark" :
    "sparkle";
  return {
    archetypeId,
    label: archetype.abilityLabel,
    flavor,
    visual,
  };
}
