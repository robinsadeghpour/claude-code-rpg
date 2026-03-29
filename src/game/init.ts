import kaplay from "kaplay";
import { menuScene } from "./scenes/menu";
import { transitionScene } from "./scenes/transition";
import { worldScene } from "./scenes/world";

export function initGame(canvas: HTMLCanvasElement) {
  const k = kaplay({
    canvas,
    width: 800,
    height: 600,
    letterbox: true,
    pixelDensity: 1,
    background: [0, 0, 0],
    global: false,
    buttons: {
      interact: { keyboard: ["e", "space", "enter"] },
      up: { keyboard: ["w", "up"] },
      down: { keyboard: ["s", "down"] },
      left: { keyboard: ["a", "left"] },
      right: { keyboard: ["d", "right"] },
    },
  });

  k.scene("menu", () => menuScene(k));
  k.scene("transition", () => transitionScene(k));
  k.scene("world", () => worldScene(k));

  k.go("menu");
  return k;
}
