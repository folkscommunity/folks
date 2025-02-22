import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/editor/components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/editor/extensions/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/editor/hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/editor/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    fontFamily: {
      sans: [
        "Inter",
        "--apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "Roboto",
        "Helvetica",
        "Arial",
        "sans-serif"
      ],
      mono: ["var(--font-ibm-plex-mono)", "monospace"],
      serif: ["Zodiak", "serif"],
      ansi: ["Courier New", "monospace"]
    },
    fontSize: {
      base: "14px",
      ansi: "12px",
      ansiLg: "24px",
      xs: "12px",
      sm: "14px",
      md: "16px",
      lg: "18px",
      xl: "20px",
      "2xl": "24px",
      "3xl": "30px",
      "4xl": "36px",
      "5xl": "48px",
      "6xl": "60px",
      "7xl": "72px"
    },
    extend: {
      lineHeight: {
        DEFAULT: "24px",
        ansi: "12px",
        ansiLg: "24px"
      },
      letterSpacing: {
        DEFAULT: "-.42px",
        ansiLg: "-1px"
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        black: {
          DEFAULT: "rgb(0 5 12)",
          50: "rgb(243 245 248)",
          100: "rgb(226 229 234)",
          200: "rgb(210 214 219)",
          300: "rgb(185 191 198)",
          400: "rgb(155 163 172)",
          500: "rgb(123 132 143)",
          600: "rgb(90 100 114)",
          700: "rgb(39 48 61)",
          800: "rgb(0 5 12)",
          900: "rgb(0 5 12)"
        },
        red: {
          100: "rgb(255 185 197)",
          200: "rgb(255 159 178)",
          300: "rgb(255 129 150)",
          400: "rgb(242 37 74/0.8)",
          500: "rgb(208 20 54)",
          600: "rgb(174 7 37)",
          800: "rgb(106 0 19)",
          900: "rgb(72 0 13)"
        }
      }
    }
  },
  safelist: ["text-sky-600", "ProseMirror"]
} satisfies Config;
