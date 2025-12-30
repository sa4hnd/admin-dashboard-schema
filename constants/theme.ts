// BLOOM ADMIN - Premium Monochromatic Design System
// Aesthetic: Swiss-inspired minimalism with refined warmth
// Typography: Clean, hierarchical, purposeful
// Color: Sophisticated grayscale with strategic accent touches

export const colors = {
  // Core backgrounds - Deep, layered blacks with subtle warmth
  bg: {
    primary: "#09090B",      // Near-black with hint of blue
    secondary: "#111113",    // Elevated surface
    tertiary: "#18181B",     // Cards and containers
    elevated: "#1F1F23",     // Hover states, interactive
    hover: "#27272A",        // Active states
    accent: "#FAFAFA",       // Inverted accent background
  },

  // Border system - Subtle depth without distraction
  border: {
    subtle: "rgba(255, 255, 255, 0.06)",    // Hairline borders
    default: "rgba(255, 255, 255, 0.10)",   // Standard borders
    strong: "rgba(255, 255, 255, 0.15)",    // Emphasized borders
    focus: "rgba(255, 255, 255, 0.25)",     // Focus rings
  },

  // Text hierarchy - Clear, accessible, beautiful
  text: {
    primary: "#FAFAFA",      // Primary content
    secondary: "#A1A1AA",    // Supporting text
    tertiary: "#71717A",     // Subtle labels
    muted: "#52525B",        // Disabled/placeholder
    inverse: "#09090B",      // On light backgrounds
  },

  // Accent colors - Minimal, purposeful pops of color
  accent: {
    primary: "#FAFAFA",      // Primary interactive
    secondary: "#D4D4D8",    // Secondary interactive
    // Strategic color accents for status and meaning
    emerald: "#34D399",      // Success, positive, active
    amber: "#FBBF24",        // Warning, attention
    rose: "#FB7185",         // Error, destructive, negative
    sky: "#38BDF8",          // Info, links, neutral action
    violet: "#A78BFA",       // Premium, special features
  },

  // Status colors - Clear, intuitive feedback
  status: {
    success: "#34D399",
    warning: "#FBBF24",
    error: "#FB7185",
    info: "#38BDF8",
    active: "#34D399",
    inactive: "#52525B",
  },

  // Gradient overlays for depth
  gradient: {
    card: "rgba(255, 255, 255, 0.02)",
    shimmer: "rgba(255, 255, 255, 0.05)",
  },
};

// Spacing scale - 4px base, generous whitespace
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  massive: 64,
};

// Border radius - Consistent, modern roundness
export const radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 9999,
};

// Typography system - Beautiful hierarchy
export const typography = {
  // Display - Hero text, large headers
  display: {
    fontSize: 36,
    fontWeight: "700" as const,
    letterSpacing: -1,
    lineHeight: 40,
  },
  // H1 - Page titles
  h1: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  // H2 - Section headers
  h2: {
    fontSize: 20,
    fontWeight: "600" as const,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  // H3 - Card titles, subsections
  h3: {
    fontSize: 16,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  // Body - Primary content
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
    letterSpacing: 0,
    lineHeight: 22,
  },
  // Body Medium - Emphasized body
  bodyMedium: {
    fontSize: 15,
    fontWeight: "500" as const,
    letterSpacing: 0,
    lineHeight: 22,
  },
  // Caption - Supporting text
  caption: {
    fontSize: 13,
    fontWeight: "400" as const,
    letterSpacing: 0.1,
    lineHeight: 18,
  },
  // Caption Medium - Labels
  captionMedium: {
    fontSize: 13,
    fontWeight: "500" as const,
    letterSpacing: 0.1,
    lineHeight: 18,
  },
  // Small - Badges, tags
  small: {
    fontSize: 11,
    fontWeight: "500" as const,
    letterSpacing: 0.3,
    lineHeight: 14,
  },
  // Overline - Section labels
  overline: {
    fontSize: 10,
    fontWeight: "600" as const,
    letterSpacing: 1.2,
    lineHeight: 14,
    textTransform: "uppercase" as const,
  },
  // Mono - Code, IDs
  mono: {
    fontSize: 12,
    fontWeight: "500" as const,
    fontFamily: "monospace",
    letterSpacing: -0.2,
    lineHeight: 16,
  },
  // Large number display
  metric: {
    fontSize: 32,
    fontWeight: "600" as const,
    letterSpacing: -1,
    lineHeight: 38,
  },
};

// Shadow system - Subtle depth
export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
  },
  glow: {
    shadowColor: colors.accent.emerald,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 3,
  },
};

// Animation timing
export const timing = {
  fast: 150,
  normal: 250,
  slow: 400,
};
