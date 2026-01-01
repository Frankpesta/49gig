/**
 * Design Tokens - Andela-Inspired Design System
 * 
 * Centralized design tokens for consistent styling across the application
 */

export const designTokens = {
  // Typography
  typography: {
    fontFamily: {
      sans: "var(--font-inter)",
      heading: "var(--font-inter-tight)",
    },
    fontSize: {
      xs: "0.75rem",      // 12px
      sm: "0.875rem",    // 14px
      base: "1rem",      // 16px
      lg: "1.125rem",    // 18px
      xl: "1.25rem",     // 20px
      "2xl": "1.5rem",   // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem",  // 36px
      "5xl": "3rem",     // 48px
      "6xl": "3.75rem",  // 60px
    },
    fontWeight: {
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
    },
    lineHeight: {
      tight: "1.25",
      snug: "1.375",
      normal: "1.5",
      relaxed: "1.625",
      loose: "2",
    },
    letterSpacing: {
      tighter: "-0.05em",
      tight: "-0.025em",
      normal: "0",
      wide: "0.025em",
      wider: "0.05em",
      widest: "0.1em",
    },
  },

  // Spacing (8px base unit - generous, breathing room)
  spacing: {
    xs: "0.25rem",   // 4px
    sm: "0.5rem",    // 8px
    md: "1rem",      // 16px
    lg: "1.5rem",    // 24px
    xl: "2rem",       // 32px
    "2xl": "3rem",   // 48px
    "3xl": "4rem",   // 64px
    "4xl": "6rem",   // 96px
  },

  // Border Radius
  radius: {
    sm: "calc(var(--radius) - 4px)",
    md: "calc(var(--radius) - 2px)",
    lg: "var(--radius)",        // 8px
    xl: "calc(var(--radius) + 4px)",
    "2xl": "calc(var(--radius) + 8px)",
    "3xl": "calc(var(--radius) + 12px)",
    "4xl": "calc(var(--radius) + 16px)",
    full: "9999px",
  },

  // Shadows (professional, subtle)
  shadows: {
    soft: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
    medium: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    strong: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  },

  // Transitions (smooth, purposeful)
  transitions: {
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },

  // Breakpoints (responsive)
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },

  // Z-index scale
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const;

/**
 * Color palette reference (for documentation)
 */
export const colorPalette = {
  primary: {
    light: "oklch(45% 0.15 250)",   // Deep blue
    dark: "oklch(65% 0.15 250)",    // Brighter blue for dark mode
  },
  neutral: {
    white: "oklch(100% 0 0)",
    black: "oklch(0% 0 0)",
    gray50: "oklch(98% 0 0)",
    gray100: "oklch(96% 0 0)",
    gray200: "oklch(92% 0 0)",
    gray300: "oklch(85% 0 0)",
    gray400: "oklch(70% 0 0)",
    gray500: "oklch(55% 0 0)",
    gray600: "oklch(40% 0 0)",
    gray700: "oklch(30% 0 0)",
    gray800: "oklch(20% 0 0)",
    gray900: "oklch(15% 0 0)",
  },
  semantic: {
    success: "oklch(60% 0.15 150)",   // Green
    warning: "oklch(70% 0.2 50)",     // Yellow
    error: "oklch(55% 0.22 25)",      // Red
    info: "oklch(65% 0.2 250)",       // Blue
  },
} as const;


