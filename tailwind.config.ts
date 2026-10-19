import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        "surface-soft": "var(--surface-soft)",
        "surface-sunken": "var(--surface-sunken)",
        ink: "var(--ink)",
        "ink-muted": "var(--ink-muted)",
        line: "var(--line)",
        cobalt: "var(--cobalt)",
        "cobalt-deep": "var(--cobalt-deep)",
        "cobalt-tint": "var(--cobalt-tint)",
        "cobalt-tint-strong": "var(--cobalt-tint-strong)",
        "cobalt-faint": "var(--cobalt-faint)",
        "risk-high": "var(--risk-high)",
        "risk-high-tint": "var(--risk-high-tint)",
        "risk-moderate": "var(--risk-moderate)",
        "risk-moderate-tint": "var(--risk-moderate-tint)",
        scrim: "var(--scrim)",
        "on-accent": "var(--on-accent)",
      },
      borderRadius: {
        shell: "var(--radius-shell)",
        panel: "var(--radius-panel)",
        card: "var(--radius-card)",
        item: "var(--radius-item)",
        input: "var(--radius-input)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-geist)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
