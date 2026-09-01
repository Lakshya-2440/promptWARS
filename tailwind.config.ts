import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#040814",
          900: "#0A1128",
          850: "#0D1836",
          800: "#122046",
          700: "#1A2F63",
          600: "#27458E",
          500: "#3B66C4",
        },
        saffron: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },
        ashoka: {
          emerald: "#059669",
          jade: "#10B981",
          gold: "#F59E0B",
          navy: "#0A1128",
          azure: "#0284C7",
        }
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "system-ui", "sans-serif"],
        serif: ["var(--font-cinzel)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "jaali-pattern": "radial-gradient(circle at 1px 1px, rgba(245, 158, 11, 0.08) 1px, transparent 0)",
        "mesh-glow": "radial-gradient(at 0% 0%, rgba(245, 158, 11, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(5, 150, 105, 0.15) 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(10, 17, 40, 0.8) 0px, transparent 100%)",
      },
      boxShadow: {
        "saffron-glow": "0 0 25px -5px rgba(245, 158, 11, 0.3)",
        "emerald-glow": "0 0 25px -5px rgba(16, 185, 129, 0.3)",
        "card-elevation": "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 4s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        }
      }
    },
  },
  plugins: [],
};

export default config;
