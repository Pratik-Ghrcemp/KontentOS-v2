/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-base)",
        surface: {
          DEFAULT: "var(--bg-surface)",
          low: "var(--bg-surface-low)",
          lowest: "var(--bg-surface-lowest)",
          card: "var(--bg-surface-card)",
          high: "var(--bg-surface-high)",
          highest: "var(--bg-surface-highest)",
        },
        text: {
          main: "var(--text-main)",
          muted: "var(--text-muted)",
          dim: "var(--text-dim)",
          inverse: "var(--text-inverse)",
        },
        accent: {
          primary: {
            DEFAULT: "var(--accent-primary)",
            light: "var(--accent-primary-light)",
            dim: "var(--accent-primary-dim)",
          },
          tertiary: {
            DEFAULT: "var(--accent-tertiary)",
            light: "var(--accent-tertiary-light)",
          },
          cyan: "var(--accent-cyan)",
          green: "var(--accent-green)",
          amber: "var(--accent-amber)",
          rose: "var(--accent-rose)",
        }
      },
      boxShadow: {
        neoRaised: "var(--shadow-neo-raised)",
        neoRaisedSm: "var(--shadow-neo-raised-sm)",
        neoPressed: "var(--shadow-neo-pressed)",
        neoHover: "var(--shadow-neo-hover)",
        glow: "var(--shadow-glow)",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      }
    },
  },
  plugins: [],
};
