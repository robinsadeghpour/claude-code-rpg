import type { KAPLAYCtx } from "kaplay";
import type { NPCData } from "../../store/types";

const INTERACT_SCALE = 2.0;
const NPC_SPRITE_SCALE = 0.13; // 440px content * 0.13 ≈ 57px tall

export function spawnNPC(k: KAPLAYCtx, data: NPCData) {
  const isFulfilled = data.state === "fulfilled";

  const cx = data.position.x;
  const cy = data.position.y;

  const spriteId = isFulfilled
    ? data.sprite.fulfilled
    : data.sprite.waiting;

  // NPC sprite
  const npcSprite = k.add([
    k.sprite(spriteId),
    k.pos(cx, cy),
    k.anchor("center"),
    k.scale(NPC_SPRITE_SCALE),
    k.color(k.Color.fromHex("#FFFFFF")),
    k.z(5),
  ]);

  // Invisible collision body (for interaction detection)
  const npcBody = k.add([
    k.rect(18, 24),
    k.pos(cx, cy),
    k.anchor("center"),
    k.area({ scale: INTERACT_SCALE }),
    k.body({ isStatic: true }),
    k.opacity(0),
    k.z(5),
    "npc",
    {
      npcId: data.id,
      npcData: data,
      isInteractable: false,
    },
  ]);

  // Shadow beneath NPC
  k.add([
    k.rect(14, 4),
    k.anchor("center"),
    k.pos(cx, cy + 22),
    k.color(k.Color.fromHex("#000000")),
    k.opacity(0.18),
    k.z(4),
  ]);

  // ── Idle bobbing animation ──
  let bobTimer = k.rand(0, Math.PI * 2);
  const baseSpriteY = npcSprite.pos.y;

  npcBody.onUpdate(() => {
    bobTimer += k.dt();
    const bobOffset = Math.sin(bobTimer * 1.8) * 1.2;
    npcSprite.pos.y = baseSpriteY + bobOffset;
  });

  // ── Name label ──
  const nameLabel = k.add([
    k.text(data.name, { size: 11, font: "monospace" }),
    k.pos(cx, cy - 36),
    k.anchor("center"),
    k.color(k.Color.fromHex("#FFF8E7")),
    k.z(6),
  ]);
  const nameLabelBaseY = nameLabel.pos.y;
  nameLabel.onUpdate(() => {
    const bobOffset = Math.sin(bobTimer * 1.8) * 1.2;
    nameLabel.pos.y = nameLabelBaseY + bobOffset;
  });

  // ── [E] interaction prompt ──
  const prompt = k.add([
    k.text("< E >", { size: 13, font: "monospace" }),
    k.pos(cx, cy - 52),
    k.anchor("center"),
    k.color(k.Color.fromHex("#FFE066")),
    k.opacity(0),
    k.z(7),
  ]);
  const promptBaseY = prompt.pos.y;
  prompt.onUpdate(() => {
    const bobOffset = Math.sin(bobTimer * 1.8) * 1.2;
    prompt.pos.y = promptBaseY + bobOffset;
  });

  // ── Fulfilled sparkle particles ──
  if (isFulfilled) {
    const sparkleOffsets = [
      { x: -10, y: -12 },
      { x: 9, y: -8 },
      { x: -6, y: 5 },
    ];
    for (const off of sparkleOffsets) {
      const sparkle = k.add([
        k.rect(2, 2),
        k.pos(cx + off.x, cy + off.y),
        k.anchor("center"),
        k.color(k.Color.fromHex("#FFFACD")),
        k.opacity(0),
        k.z(8),
      ]);
      const delay = k.rand(0, 3);
      let timer = delay;
      sparkle.onUpdate(() => {
        timer += k.dt();
        const cycle = timer % 2.5;
        if (cycle < 0.3) {
          sparkle.opacity = cycle / 0.3;
        } else if (cycle < 0.6) {
          sparkle.opacity = 1 - (cycle - 0.3) / 0.3;
        } else {
          sparkle.opacity = 0;
        }
      });
    }
  }

  // Show/hide [E] prompt
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
