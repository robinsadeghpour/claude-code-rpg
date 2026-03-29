/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        healthy: {
          cream: "#FFF8E7",
          sage: "#C5D5A5",
          peach: "#FFB088",
          lavender: "#C4A8D8",
          mint: "#88D4B0",
          sunbeam: "#FFE066",
          terracotta: "#C67B5C",
          brown: "#8B6549",
          charcoal: "#3A3A3A",
          gray: "#7A7A7A",
        },
        glitch: {
          cyan: "#00FFD4",
          magenta: "#FF00FF",
          purple: "#9B30FF",
          red: "#FF3355",
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', "monospace"],
        mono: ['"Silkscreen"', "monospace"],
      },
    },
  },
  plugins: [],
};
