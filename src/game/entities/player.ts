import type { KAPLAYCtx } from "kaplay";

const SPEED = 120;
const SPRITE_SCALE = 0.21; // 212px content * 0.21 ≈ 45px tall

export function spawnPlayer(k: KAPLAYCtx, x: number, y: number) {
  let interacting = false;
  let lastDir: "down" | "up" | "left" | "right" = "down";
  let wasMoving = false;

  // Shadow beneath feet
  const shadow = k.add([
    k.rect(14, 4),
    k.anchor("center"),
    k.pos(x, y + 18),
    k.color(k.Color.fromHex("#000000")),
    k.opacity(0.18),
    k.z(4),
  ]);

  // Main player sprite
  const player = k.add([
    k.sprite("player-sprite", { anim: "idle-down" }),
    k.pos(x, y),
    k.anchor("center"),
    k.scale(SPRITE_SCALE),
    k.area({ scale: 0.5 }),
    k.body(),
    k.z(5),
    "player",
  ]);

  player.onUpdate(() => {
    if (interacting) return;

    let dx = 0;
    let dy = 0;
    let dir: "down" | "up" | "left" | "right" = lastDir;

    if (k.isButtonDown("left")) { dx = -1; dir = "left"; }
    else if (k.isButtonDown("right")) { dx = 1; dir = "right"; }
    else if (k.isButtonDown("up")) { dy = -1; dir = "up"; }
    else if (k.isButtonDown("down")) { dy = 1; dir = "down"; }

    const isMoving = dx !== 0 || dy !== 0;

    if (isMoving && (!wasMoving || dir !== lastDir)) {
      player.play(`walk-${dir}`);
    }

    if (!isMoving && wasMoving) {
      player.play(`idle-${dir}`);
    }

    wasMoving = isMoving;
    lastDir = dir;

    player.move(dx * SPEED, dy * SPEED);

    // Sync shadow
    shadow.pos.x = player.pos.x;
    shadow.pos.y = player.pos.y + 18;
  });

  return {
    obj: player,
    setInteracting(val: boolean) {
      interacting = val;
    },
  };
}
