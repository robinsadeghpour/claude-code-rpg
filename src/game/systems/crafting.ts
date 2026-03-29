export interface CraftStep {
  name: string;
  action: () => boolean;
}

// [BUG] The prepare step is commented out.
// The forge sequence skips preparation entirely.
const forgePipeline: CraftStep[] = [
  // { name: "prepare", action: () => prepare() },
  { name: "heat", action: () => heat() },
  { name: "fold", action: () => fold() },
  { name: "strike", action: () => strike() },
  { name: "cool", action: () => cool() },
];

function prepare(): boolean { return true; }
function heat(): boolean { return true; }
function fold(): boolean { return true; }
function strike(): boolean { return true; }
function cool(): boolean { return true; }

export function runForge(): { success: boolean; stepsRun: string[] } {
  const stepsRun: string[] = [];
  for (const step of forgePipeline) {
    const result = step.action();
    stepsRun.push(step.name);
    if (!result) return { success: false, stepsRun };
  }
  return { success: true, stepsRun };
}

export function getForgePipeline(): CraftStep[] {
  return forgePipeline;
}
