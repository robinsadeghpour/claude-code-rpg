import type { GameObj, KAPLAYCtx, OpacityComp } from "kaplay";

export function transitionScene(k: KAPLAYCtx) {
  const W = 800;
  const H = 600;

  // Simple fade to black, then switch to world
  const blackScreen = k.add([
    k.rect(W, H),
    k.pos(0, 0),
    k.color(k.Color.fromHex("#000000")),
    k.opacity(0),
    k.z(10),
  ]) as GameObj<OpacityComp>;

  let elapsed = 0;
  let done = false;

  k.onUpdate(() => {
    if (done) return;
    elapsed += k.dt();

    // Fade in (0 - 0.4s)
    if (elapsed <= 0.4) {
      blackScreen.opacity = elapsed / 0.4;
    }
    // Hold black (0.4 - 0.6s)
    else if (elapsed <= 0.6) {
      blackScreen.opacity = 1;
    }
    // Switch scene
    else if (!done) {
      done = true;
      k.go("world");
    }
  });
}
