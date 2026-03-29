import type { KAPLAYCtx } from "kaplay";

export function worldScene(k: KAPLAYCtx) {
  k.add([
    k.text("World loading...", { size: 12 }),
    k.pos(400, 300),
    k.anchor("center"),
    k.color(k.Color.fromHex("#FFF8E7")),
  ]);
}
