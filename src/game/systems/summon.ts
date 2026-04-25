import { getArchetype } from "./skill-serializer";

export interface PlacementIntent {
  skillName: string;
  kind: "house" | "farm" | "lantern";
  position: [number, number];
  buildingId: string;
}

export function makeBuildingId(kind: PlacementIntent["kind"]): string {
  const stamp = Date.now().toString(36);
  const rand = Math.floor(Math.random() * 1296).toString(36).padStart(2, "0");
  return `player-${kind}-${stamp}${rand}`;
}

export function buildCopyableCommand(skillName: string, kind: PlacementIntent["kind"]): string {
  return `use the ${skillName} skill to place a ${kind} here`;
}

export interface InvokeContext {
  skillName: string;
  archetypeId: string;
  kind: PlacementIntent["kind"];
  buildLabel: string;
  position: [number, number];
  buildingId: string;
  command: string;
}

export function buildInvokeContext(args: {
  skillName: string;
  archetypeId: string;
  position: [number, number];
}): InvokeContext | null {
  const archetype = getArchetype(args.archetypeId);
  if (!archetype) return null;
  const kind = archetype.buildKind;
  const buildingId = makeBuildingId(kind);
  return {
    skillName: args.skillName,
    archetypeId: args.archetypeId,
    kind,
    buildLabel: archetype.abilityLabel,
    position: args.position,
    buildingId,
    command: buildCopyableCommand(args.skillName, kind),
  };
}

export async function postPlacementIntent(intent: PlacementIntent): Promise<boolean> {
  try {
    const res = await fetch("/api/placement-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(intent),
    });
    return res.ok;
  } catch (err) {
    console.warn("Failed to post placement intent:", err);
    return false;
  }
}
