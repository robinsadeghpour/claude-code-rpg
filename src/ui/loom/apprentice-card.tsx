import { useMemo } from "react";
import { getArchetype, shapeBadgeColor, type VoiceRecipe } from "../../game/systems/skill-serializer";

interface Props {
  name: string;
  archetypeId: string;
  shape: VoiceRecipe["shape"];
  description: string;
  catchphrase: string;
}

export function ApprenticeCard({ name, archetypeId, shape, description, catchphrase }: Props) {
  const archetype = getArchetype(archetypeId);
  const svg = useMemo(
    () => buildSvg({ name, archetype, shape, description, catchphrase }),
    [name, archetype, shape, description, catchphrase],
  );

  const onDownload = () => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `apprentice-${name}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div
        style={{ width: 320, height: 400 }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <button
        onClick={onDownload}
        style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 9,
          padding: "8px 14px",
          background: "#1a1a2e",
          color: "#FFE066",
          border: "2px solid #FFE066",
          cursor: "pointer",
        }}
      >
        ▾ DOWNLOAD CARD
      </button>
    </div>
  );
}

function buildSvg(args: {
  name: string;
  archetype: ReturnType<typeof getArchetype>;
  shape: VoiceRecipe["shape"];
  description: string;
  catchphrase: string;
}): string {
  const { name, archetype, shape, description, catchphrase } = args;
  const badge = shapeBadgeColor(shape);
  const cloth = archetype?.clothColor ?? "#FFF8E7";
  const accent = archetype?.accentColor ?? "#8B6549";
  const archLabel = archetype?.label ?? "Apprentice";
  const glyph = archetype?.glyph ?? "◈";
  const abilityLabel = archetype?.abilityLabel ?? "Ability";
  const abilityBlurb = archetype?.abilityBlurb ?? "";

  const truncDesc = description.length > 120 ? description.slice(0, 117) + "…" : description;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 400" width="320" height="400" font-family="'Press Start 2P', monospace">
  <defs>
    <linearGradient id="cloth" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${cloth}"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.35"/>
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="320" height="400" fill="#1a1a2e"/>
  <rect x="8" y="8" width="304" height="384" fill="url(#cloth)" stroke="${accent}" stroke-width="3"/>

  <rect x="20" y="20" width="280" height="22" fill="${badge.bg}"/>
  <text x="160" y="36" fill="${badge.fg}" font-size="9" text-anchor="middle">${badge.label}</text>

  <rect x="110" y="60" width="100" height="90" fill="${accent}" opacity="0.2"/>
  <text x="160" y="125" fill="${accent}" font-size="54" text-anchor="middle" font-weight="bold" font-family="serif">${escapeXml(glyph)}</text>
  <text x="160" y="165" fill="${accent}" font-size="8" text-anchor="middle">${archLabel.toUpperCase()}</text>

  <text x="160" y="200" fill="#1a1a2e" font-size="13" text-anchor="middle">${escapeXml(name)}</text>

  ${wrapText(escapeXml(catchphrase), 160, 225, 32, "#3a2e00", 7)}

  <rect x="20" y="260" width="280" height="50" fill="rgba(255,255,255,0.3)"/>
  <text x="160" y="278" fill="${accent}" font-size="7" text-anchor="middle">${escapeXml(abilityLabel.toUpperCase())}</text>
  ${wrapText(escapeXml(abilityBlurb), 160, 294, 40, "#1a1a2e", 6)}

  ${wrapText(escapeXml(truncDesc), 30, 335, 46, "#1a1a2e", 6, "start")}

  <text x="160" y="385" fill="${accent}" font-size="6" text-anchor="middle">FORGED IN CLAUDE CODE RPG</text>
</svg>`.trim();
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(
  text: string,
  x: number,
  y: number,
  perLine: number,
  color: string,
  size: number,
  anchor: "middle" | "start" = "middle",
): string {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > perLine) {
      if (current) lines.push(current.trim());
      current = w;
    } else {
      current = (current + " " + w).trim();
    }
  }
  if (current) lines.push(current);
  return lines
    .slice(0, 3)
    .map(
      (ln, i) =>
        `<text x="${x}" y="${y + i * (size + 4)}" fill="${color}" font-size="${size}" text-anchor="${anchor}">${ln}</text>`,
    )
    .join("");
}
