import type { KAPLAYCtx } from "kaplay";

const PLAYER_W = 16;
const PLAYER_H = 24;
const SPEED = 120;

export function spawnPlayer(k: KAPLAYCtx, x: number, y: number) {
  let interacting = false;

  const player = k.add([
    k.rect(PLAYER_W, PLAYER_H),
    k.pos(x, y),
    k.anchor("center"),
    k.area(),
    k.body(),
    k.color(k.Color.fromHex("#4A7FBF")),
    k.z(5),
    "player",
  ]);

  player.onUpdate(() => {
    if (interacting) return;

    let dx = 0;
    let dy = 0;

    if (k.isButtonDown("left")) dx = -1;
    else if (k.isButtonDown("right")) dx = 1;
    else if (k.isButtonDown("up")) dy = -1;
    else if (k.isButtonDown("down")) dy = 1;

    player.move(dx * SPEED, dy * SPEED);
  });

  return {
    obj: player,
    setInteracting(val: boolean) {
      interacting = val;
    },
  };
}
