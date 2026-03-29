import type { KAPLAYCtx } from "kaplay";
import type { NPCData } from "../../store/types";

export function spawnNPC(k: KAPLAYCtx, data: NPCData) {
  const NPC_W = 18;
  const NPC_H = 24;
  const INTERACT_SCALE = 2.5;

  const isGlitched = data.state === "glitched";
  const isHealed = data.state === "healed";

  const baseColor = isHealed ? "#88D4B0" : "#C67B5C";

  const npcBody = k.add([
    k.rect(NPC_W, NPC_H),
    k.pos(data.position.x, data.position.y),
    k.anchor("center"),
    k.area({ scale: INTERACT_SCALE }),
    k.body({ isStatic: true }),
    k.color(k.Color.fromHex(baseColor)),
    k.z(5),
    "npc",
    {
      npcId: data.id,
      npcData: data,
      isInteractable: false,
    },
  ]);

  // Name label above NPC
  k.add([
    k.text(data.name, { size: 8, font: "monospace" }),
    k.pos(data.position.x, data.position.y - NPC_H / 2 - 8),
    k.anchor("center"),
    k.color(k.Color.fromHex("#FFF8E7")),
    k.z(6),
  ]);

  // [E] interaction prompt — hidden until player is near
  const prompt = k.add([
    k.text("[E]", { size: 10, font: "monospace" }),
    k.pos(data.position.x, data.position.y - NPC_H / 2 - 22),
    k.anchor("center"),
    k.color(k.Color.fromHex("#FFE066")),
    k.opacity(0),
    k.z(7),
  ]);

  // Glitch flicker effect
  if (isGlitched) {
    let glitchCooldown = 3 + k.rand(0, 3);
    let glitchActive = false;
    let glitchTimer = 0;

    npcBody.onUpdate(() => {
      glitchCooldown -= k.dt();

      if (!glitchActive && glitchCooldown <= 0) {
        glitchActive = true;
        glitchTimer = 0;
        glitchCooldown = 3 + k.rand(0, 3);
      }

      if (glitchActive) {
        glitchTimer += k.dt();
        if (glitchTimer < 0.08) {
          npcBody.color = k.Color.fromHex("#9B30FF");
        } else if (glitchTimer < 0.14) {
          npcBody.color = k.Color.fromHex(baseColor);
        } else if (glitchTimer < 0.18) {
          npcBody.color = k.Color.fromHex("#9B30FF");
        } else {
          npcBody.color = k.Color.fromHex(baseColor);
          glitchActive = false;
        }
      }
    });
  }

  // Show/hide [E] prompt when player enters/leaves interaction zone
  npcBody.onCollide("player", () => {
    prompt.opacity = 1;
    npcBody.isInteractable = true;
  });

  npcBody.onCollideEnd("player", () => {
    prompt.opacity = 0;
    npcBody.isInteractable = false;
  });

  return npcBody;
}
