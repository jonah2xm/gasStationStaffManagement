import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

// Colors resolve to the RGB channel variables in app/globals.css, so opacity
// modifiers (bg-primary/80) keep working.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

// A semantic tone: the solid color plus the subtle fill, border and text shades badges use.
const tone = (name: string) => ({
  DEFAULT: token(name),
  subtle: token(`${name}-subtle`),
  border: token(`${name}-border`),
  text: token(`${name}-text`),
});

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: token("background"),
        foreground: token("foreground"),
        card: { DEFAULT: token("card"), foreground: token("card-foreground") },
        popover: { DEFAULT: token("popover"), foreground: token("popover-foreground") },
        primary: {
          DEFAULT: token("primary"),
          foreground: token("primary-foreground"),
          hover: token("primary-hover"),
          subtle: token("primary-subtle"),
          border: token("primary-border"),
          strong: token("primary-strong"),
        },
        secondary: { DEFAULT: token("secondary"), foreground: token("secondary-foreground") },
        muted: { DEFAULT: token("muted"), foreground: token("muted-foreground") },
        accent: { DEFAULT: token("accent"), foreground: token("accent-foreground") },
        destructive: {
          ...tone("destructive"),
          foreground: token("destructive-foreground"),
          hover: token("destructive-hover"),
        },
        success: tone("success"),
        warning: tone("warning"),
        info: tone("info"),
        teal: tone("teal"),
        violet: tone("violet"),
        brand: {
          DEFAULT: token("brand"),
          foreground: token("brand-foreground"),
          hover: token("brand-hover"),
          strong: token("brand-strong"),
          subtle: token("brand-subtle"),
          border: token("brand-border"),
          text: token("brand-text"),
        },
        bleu: {
          DEFAULT: token("bleu"),
          strong: token("bleu-strong"),
          subtle: token("bleu-subtle"),
          border: token("bleu-border"),
          text: token("bleu-text"),
        },
        border: token("border"),
        input: token("input"),
        ring: token("ring"),
        chart: {
          1: token("chart-1"),
          2: token("chart-2"),
          3: token("chart-3"),
          4: token("chart-4"),
          5: token("chart-5"),
          muted: token("chart-muted"),
        },
        sidebar: {
          DEFAULT: token("sidebar-background"),
          foreground: token("sidebar-foreground"),
          muted: token("sidebar-muted"),
          primary: { DEFAULT: token("sidebar-primary"), foreground: token("sidebar-primary-foreground") },
          accent: { DEFAULT: token("sidebar-accent"), foreground: token("sidebar-accent-foreground") },
          border: token("sidebar-border"),
          ring: token("sidebar-ring"),
        },
        // Cool ink neutrals from the design, for text and surfaces between the tokens above.
        ink: {
          50: "#FBFCFD",
          100: "#F6F7F9",
          150: "#F1F3F6",
          200: "#EDEFF3",
          250: "#E8EBF0",
          300: "#E2E6EC",
          350: "#D5DBE3",
          400: "#C4CCD6",
          450: "#C0C8D2",
          500: "#A9B3BF",
          550: "#94A3B3",
          600: "#8A95A3",
          700: "#63707F",
          750: "#48545F",
          800: "#29313D",
          850: "#1B222C",
          900: "#10151C",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(16, 21, 28, 0.06)",
        sm: "0 1px 2px rgba(16, 21, 28, 0.06)",
        md: "0 4px 12px rgba(16, 21, 28, 0.08)",
        popover: "0 8px 24px rgba(16, 21, 28, 0.10)",
        lg: "0 16px 40px rgba(16, 21, 28, 0.16)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-320px 0" },
          "100%": { backgroundPosition: "320px 0" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        shimmer: "shimmer 1.3s linear infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
