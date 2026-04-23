import archetypesData from "../../data/apprentice/archetypes.json";
import namesData from "../../data/apprentice/names.json";
import voicesData from "../../data/apprentice/voices.json";

export interface Archetype {
  id: string;
  label: string;
  tagline: string;
  abilityLabel: string;
  abilityBlurb: string;
  clothColor: string;
  accentColor: string;
  glyph: string;
  defaultTools: string[];
  bodyTemplate: string;
}

export interface VoiceRecipe {
  id: string;
  shape: "wide" | "sharp" | "narrow";
  label: string;
  description: string;
  fires: string[];
  lesson: string;
}

export interface SamplePrompt {
  id: string;
  text: string;
  isTarget: boolean;
}

export interface VoiceBundle {
  samplePrompts: SamplePrompt[];
  recipes: VoiceRecipe[];
}

export const archetypes = archetypesData as unknown as Record<string, Archetype>;
export const names = namesData as unknown as Record<string, string[]>;
export const voices = voicesData as unknown as Record<string, VoiceBundle> & { _note?: string };

export function getArchetype(id: string): Archetype | undefined {
  return archetypes[id];
}

export function getNamesFor(archetypeId: string): string[] {
  return names[archetypeId] ?? [];
}

export function getVoiceBundle(archetypeId: string): VoiceBundle | undefined {
  const raw = voices[archetypeId];
  if (!raw || typeof raw === "string") return undefined;
  return raw as VoiceBundle;
}

export function getRecipe(archetypeId: string, recipeId: string): VoiceRecipe | undefined {
  return getVoiceBundle(archetypeId)?.recipes.find((r) => r.id === recipeId);
}

export interface LoomDraft {
  archetypeId: string;
  name: string;
  recipeId: string;
}

export function serializeApprentice(draft: LoomDraft): string {
  const archetype = getArchetype(draft.archetypeId);
  if (!archetype) throw new Error(`Unknown archetype: ${draft.archetypeId}`);
  const recipe = getRecipe(draft.archetypeId, draft.recipeId);
  if (!recipe) throw new Error(`Unknown recipe: ${draft.recipeId}`);

  const frontmatter = [
    "---",
    `name: ${draft.name}`,
    `description: ${yamlInline(recipe.description)}`,
    `allowed-tools: [${archetype.defaultTools.join(", ")}]`,
    "forged: apprentice",
    `archetype: ${archetype.id}`,
    `shape: ${recipe.shape}`,
    "---",
  ].join("\n");

  const title = `# ${draft.name}`;
  const tagline = `${archetype.tagline}\n\n> Woven at Ysil's loom.`;

  return [frontmatter, title, tagline, archetype.bodyTemplate].join("\n\n") + "\n";
}

function yamlInline(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") return '""';
  if (/[:#\-{}[\]&*!|>'"%@`\n]/.test(trimmed)) {
    return JSON.stringify(trimmed);
  }
  return trimmed;
}

export function synthesizeCatchphrase(archetype: Archetype, name: string): string {
  return `${archetype.label}. Call me ${name.replace(/-/g, " ")}.`;
}

export function shapeBadgeColor(shape: VoiceRecipe["shape"]): { bg: string; fg: string; label: string } {
  switch (shape) {
    case "sharp": return { bg: "#88D4B0", fg: "#1a3a24", label: "SHARP VOICE" };
    case "wide": return { bg: "#FFB088", fg: "#3a1e0c", label: "WIDE VOICE" };
    case "narrow": return { bg: "#C4A8D8", fg: "#2a1540", label: "NARROW VOICE" };
  }
}
