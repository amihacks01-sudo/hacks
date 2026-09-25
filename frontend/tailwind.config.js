/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080c14",
        surface: "#0e1526",
        "surface-border": "#1b253b",
        "electric-blue": "#00f0ff",
        "blue-glow": "#0055ff",
        "sev-critical": "#ef4444",
        "sev-high": "#f97316",
        "sev-medium": "#eab308",
        "sev-low": "#10b981",
        "sev-info": "#3b82f6",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
