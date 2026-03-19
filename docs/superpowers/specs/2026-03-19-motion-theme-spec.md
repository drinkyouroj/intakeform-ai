# IntakeForm.ai — Motion Design Language & Theme System

## Part 1: Motion Design Language

### 1.1 Duration Scale

| Token | Duration | Use |
|-------|----------|-----|
| `--duration-micro` | `120ms` | Button press, toggle, focus ring |
| `--duration-fast` | `200ms` | Tooltip, badge pulse, checkbox |
| `--duration-standard` | `300ms` | Card hover, dropdown, accordion |
| `--duration-emphasis` | `450ms` | Dialog, sheet, skeleton reveal |
| `--duration-page` | `600ms` | Route transitions, stagger sequences |
| `--duration-celebration` | `800ms` | Completion burst, onboarding steps |

### 1.2 Easing Curves

```css
:root {
  --ease-out:       cubic-bezier(0.16, 1, 0.3, 1);      /* enter, reveals */
  --ease-in:        cubic-bezier(0.55, 0, 1, 0.45);      /* exit, dismiss */
  --ease-in-out:    cubic-bezier(0.45, 0, 0.55, 1);      /* move, reorder */
  --ease-bounce:    cubic-bezier(0.34, 1.56, 0.64, 1);   /* playful micro */
  --ease-spring:    cubic-bezier(0.22, 1.2, 0.36, 1);    /* natural settle */
}
```

### 1.3 Spring Configs (Framer Motion)

```ts
export const springs = {
  snappy:  { type: "spring", stiffness: 500, damping: 30, mass: 1 },
  gentle:  { type: "spring", stiffness: 260, damping: 25, mass: 1 },
  bouncy:  { type: "spring", stiffness: 400, damping: 15, mass: 0.8 },
  slow:    { type: "spring", stiffness: 120, damping: 20, mass: 1.2 },
} as const;
```

### 1.4 Motion Categories

**Micro-interactions (< 200ms)**
- Button press: `scale(0.97)` on pointerDown, release to `scale(1)` with `springs.snappy`
- Toggle switch: thumb translates x with `springs.bouncy`, track color crossfades 120ms
- Checkbox: SVG checkmark draws on with `pathLength` 0 to 1 in 200ms ease-out
- Input focus ring: ring opacity 0 to 1 + scale 0.98 to 1 in 150ms ease-out
- Tooltip: fade + y shift (-4px to 0) in 150ms ease-out, exit 100ms ease-in
- Badge pulse: 2-cycle scale pulse (1 to 1.15 to 1) with `springs.gentle`, `repeat: Infinity`, `repeatDelay: 3`

**Component transitions (200-400ms)**
- Card hover: translateY(-2px) + shadow elevation in 200ms ease-out
- Accordion: `AnimatePresence` height auto with `springs.gentle`, content fades in at 60% of expand
- Sheet: slideX from right, 300ms ease-out enter / 200ms ease-in exit
- Dialog: scale 0.95 to 1 + opacity, 250ms ease-out; backdrop opacity 300ms
- Dropdown: scaleY 0.96 to 1 + opacity, origin top, 200ms ease-out
- Tab crossfade: outgoing fades 100ms, incoming fades in 200ms with 4px y offset

**Layout animations (300-600ms)**
- List reorder: `layout` prop with `springs.gentle`, 300ms
- List add: fadeInUp 300ms staggered at 50ms per item
- List remove: fade out + height collapse 200ms ease-in
- Stagger reveals: container triggers children at 60ms stagger, each child fadeInUp 400ms
- Skeleton to content: skeleton pulse stops, crossfade 300ms ease-out to real content

**Page transitions (400-800ms)**
- Route change: outgoing page opacity to 0 + y -8 in 200ms, incoming fadeInUp 400ms
- Onboarding steps: slide left/right based on direction, 500ms ease-out
- Form completion: content scales down slightly, celebration burst overlays

### 1.5 Signature Animation: AI Follow-Up Injection

This is the product's defining interaction. The sequence:

1. **Client submits answer** — answer card settles with a subtle `springs.gentle` compression (scaleY 0.995 to 1), confirming receipt.

2. **AI processing pause (200-800ms)** — After a 200ms minimum delay (to avoid flash), a "thinking" indicator appears: three small dots in the accent color, each fading in staggered at 80ms, then pulsing in a wave pattern (translateY -3px, staggered 120ms apart, looping). The indicator sits flush below the answer, left-aligned with question text.

3. **Follow-up materializes** — The thinking dots fade out (100ms). The follow-up question card animates in:
   - Container: height expands from 0 with `springs.gentle` (acts as a layout push, moving all content below downward smoothly via `layout` animation)
   - Content: fades in (opacity 0 to 1) + translates up (y: 12px to 0) with a 100ms delay after the height begins expanding, using 350ms ease-out
   - A thin accent-colored left border (3px) draws downward from the parent answer, connecting the follow-up visually to its origin. This border animates `scaleY` from 0 to 1, origin top, 300ms ease-out.

4. **Content push** — Subsequent questions use Framer Motion `layout` prop so they animate downward smoothly. Duration matches the container expand spring.

5. **No follow-up (smooth no-op)** — The thinking dots appear for the minimum 200ms, then fade out (150ms ease-in). No height change, no layout shift. A brief 50ms pause, then the next question's progress advance fires as normal.

### 1.6 Framer Motion Variants

```tsx
// ---------- General purpose ----------

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
};

// ---------- Stagger lists ----------

export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

export const staggerChild = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: [0.55, 0, 1, 0.45] } },
};

// ---------- Sheet / panel ----------

export const slideInFromRight = {
  initial: { x: "100%" },
  animate: { x: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  exit: { x: "100%", transition: { duration: 0.2, ease: [0.55, 0, 1, 0.45] } },
};

// ---------- Dialog / modal ----------

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1, scale: 1,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0, scale: 0.97,
    transition: { duration: 0.15, ease: [0.55, 0, 1, 0.45] },
  },
};

// ---------- AI follow-up (signature) ----------

export const followUpReveal = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: "auto",
    opacity: 1,
    transition: {
      height: { type: "spring", stiffness: 260, damping: 25, mass: 1 },
      opacity: { duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.1 },
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      opacity: { duration: 0.15, ease: [0.55, 0, 1, 0.45] },
      height: { duration: 0.25, ease: [0.55, 0, 1, 0.45], delay: 0.05 },
    },
  },
};

export const followUpConnector = {
  initial: { scaleY: 0 },
  animate: {
    scaleY: 1,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.05 },
  },
  exit: { scaleY: 0, transition: { duration: 0.15 } },
};

export const thinkingDot = (i: number) => ({
  initial: { opacity: 0, y: 0 },
  animate: {
    opacity: [0, 1, 1],
    y: [0, -3, 0],
    transition: {
      opacity: { duration: 0.15, delay: i * 0.08 },
      y: { duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 + i * 0.12 },
    },
  },
  exit: { opacity: 0, transition: { duration: 0.1 } },
});

// ---------- Progress bar ----------

export const progressAdvance = {
  transition: {
    duration: 0.5,
    ease: [0.16, 1, 0.3, 1],
  },
  // Animate `width` via style prop: style={{ width: `${percent}%` }}
};

// ---------- Skeleton ----------

export const skeletonPulse = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
  },
};

// ---------- Celebration ----------

export const celebrationBurst = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: [0, 1.15, 1],
    opacity: [0, 1, 1],
    transition: {
      duration: 0.6,
      times: [0, 0.5, 1],
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
};

export const confettiParticle = (i: number) => ({
  initial: { x: 0, y: 0, rotate: 0, opacity: 1 },
  animate: {
    x: Math.cos((i * Math.PI * 2) / 12) * 120,
    y: Math.sin((i * Math.PI * 2) / 12) * -100 + 60,
    rotate: Math.random() * 360,
    opacity: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
});
```

### 1.7 Reduced Motion

All motion respects `prefers-reduced-motion`. Implementation:

```ts
export const useReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// In components: swap spring/tween for instant (duration: 0) when reduced motion is active.
// Framer Motion's `useReducedMotion()` hook handles this automatically for most cases.
```

---

## Part 2: Theme System

### 2.1 Color Architecture

Colors use `oklch` for perceptual uniformity. All values exposed as CSS custom properties, consumed by Tailwind via `hsl()` wrapper or direct reference.

**Dark Theme (Dashboard Default)**

```css
[data-theme="dark"] {
  /* Backgrounds */
  --background:           oklch(0.145 0.005 285);     /* near-black with cool tint */
  --card:                 oklch(0.178 0.006 285);     /* elevated surface */
  --card-elevated:        oklch(0.210 0.007 285);     /* popover, dropdown */
  --muted:                oklch(0.220 0.006 285);     /* subtle bg: hover, stripe */

  /* Borders */
  --border:               oklch(0.280 0.006 285);     /* default divider */
  --border-subtle:        oklch(0.230 0.005 285);     /* card edges */
  --border-strong:        oklch(0.400 0.008 285);     /* focus, selected */

  /* Text */
  --foreground:           oklch(0.950 0.005 285);     /* primary text */
  --foreground-muted:     oklch(0.640 0.010 285);     /* secondary labels */
  --foreground-subtle:    oklch(0.450 0.008 285);     /* placeholders, disabled */

  /* Primary accent */
  --primary:              oklch(0.680 0.170 250);     /* blue-indigo */
  --primary-foreground:   oklch(0.985 0.005 285);     /* text on primary */
  --primary-hover:        oklch(0.720 0.180 250);
  --ring:                 oklch(0.680 0.170 250 / 0.4);

  /* Semantic */
  --success:              oklch(0.650 0.170 155);
  --success-foreground:   oklch(0.985 0.005 155);
  --warning:              oklch(0.750 0.160 75);
  --warning-foreground:   oklch(0.200 0.020 75);
  --error:                oklch(0.630 0.200 25);
  --error-foreground:     oklch(0.985 0.005 25);
  --info:                 oklch(0.650 0.140 240);
  --info-foreground:      oklch(0.985 0.005 240);

  /* AI-specific */
  --ai-accent:            oklch(0.700 0.160 280);     /* purple — follow-up accent */
  --ai-accent-foreground: oklch(0.985 0.005 280);
  --ai-connector:         oklch(0.700 0.160 280 / 0.5);
  --ai-thinking:          oklch(0.700 0.160 280);
  --brief-section:        oklch(0.600 0.120 280);     /* brief headings */

  /* Shadows (dark mode: lighter glow approach) */
  --shadow-subtle:        0 1px 2px oklch(0 0 0 / 0.3);
  --shadow-default:       0 2px 8px oklch(0 0 0 / 0.4);
  --shadow-elevated:      0 8px 24px oklch(0 0 0 / 0.5);
  --shadow-dramatic:      0 16px 48px oklch(0 0 0 / 0.6);
}
```

**Light Theme (Intake Form Default)**

```css
[data-theme="light"] {
  /* Backgrounds — warm white, not sterile */
  --background:           oklch(0.985 0.004 80);      /* warm off-white */
  --card:                 oklch(1.000 0.000 0);        /* true white cards */
  --card-elevated:        oklch(1.000 0.000 0);
  --muted:                oklch(0.960 0.005 80);       /* soft cream stripe */

  /* Borders */
  --border:               oklch(0.880 0.006 80);
  --border-subtle:        oklch(0.920 0.004 80);
  --border-strong:        oklch(0.700 0.010 80);

  /* Text */
  --foreground:           oklch(0.180 0.010 285);      /* near-black, warm */
  --foreground-muted:     oklch(0.440 0.010 285);
  --foreground-subtle:    oklch(0.600 0.008 285);

  /* Primary accent — slightly warmer than dark theme */
  --primary:              oklch(0.550 0.180 255);      /* deeper blue */
  --primary-foreground:   oklch(0.985 0.005 255);
  --primary-hover:        oklch(0.500 0.190 255);
  --ring:                 oklch(0.550 0.180 255 / 0.3);

  /* Semantic */
  --success:              oklch(0.520 0.170 155);
  --success-foreground:   oklch(0.985 0.005 155);
  --warning:              oklch(0.680 0.160 75);
  --warning-foreground:   oklch(0.200 0.020 75);
  --error:                oklch(0.550 0.200 25);
  --error-foreground:     oklch(0.985 0.005 25);
  --info:                 oklch(0.540 0.140 240);
  --info-foreground:      oklch(0.985 0.005 240);

  /* AI-specific */
  --ai-accent:            oklch(0.560 0.170 280);
  --ai-accent-foreground: oklch(0.985 0.005 280);
  --ai-connector:         oklch(0.560 0.170 280 / 0.35);
  --ai-thinking:          oklch(0.560 0.170 280);
  --brief-section:        oklch(0.480 0.130 280);

  /* Shadows (light mode: traditional depth) */
  --shadow-subtle:        0 1px 2px oklch(0 0 0 / 0.05);
  --shadow-default:       0 2px 8px oklch(0 0 0 / 0.08);
  --shadow-elevated:      0 8px 24px oklch(0 0 0 / 0.12);
  --shadow-dramatic:      0 16px 48px oklch(0 0 0 / 0.16);
}
```

### 2.2 Shared Design Tokens

```css
:root {
  /* Border radius */
  --radius-sm:    4px;
  --radius-md:    8px;
  --radius-lg:    12px;
  --radius-xl:    16px;
  --radius-full:  9999px;

  /* Spacing (maps to Tailwind's default scale) */
  --space-0:  0;
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Z-index scale */
  --z-base:      0;
  --z-dropdown:  50;
  --z-sticky:    100;
  --z-overlay:   200;
  --z-modal:     300;
  --z-popover:   400;
  --z-toast:     500;
  --z-tooltip:   600;
}
```

### 2.3 Typography Scale

All values assume `1rem = 16px`. Font stack: `"Geist Sans", system-ui, sans-serif`. Mono: `"Geist Mono", ui-monospace, monospace`.

| Token | Size | Line-height | Letter-spacing | Weight | Use |
|-------|------|------------|----------------|--------|-----|
| `--text-display` | `2.25rem` (36px) | `1.2` | `-0.025em` | `700` | Page hero, form title |
| `--text-h1` | `1.875rem` (30px) | `1.25` | `-0.02em` | `700` | Section heading |
| `--text-h2` | `1.5rem` (24px) | `1.3` | `-0.015em` | `600` | Card title, brief sections |
| `--text-h3` | `1.25rem` (20px) | `1.4` | `-0.01em` | `600` | Sub-section |
| `--text-h4` | `1.125rem` (18px) | `1.4` | `-0.005em` | `600` | Label, small heading |
| `--text-body-lg` | `1.0625rem` (17px) | `1.6` | `0` | `400` | Form questions |
| `--text-body` | `1rem` (16px) | `1.6` | `0` | `400` | Default prose |
| `--text-body-sm` | `0.875rem` (14px) | `1.5` | `0` | `400` | Secondary info, metadata |
| `--text-caption` | `0.75rem` (12px) | `1.5` | `0.01em` | `500` | Timestamps, labels |
| `--text-mono` | `0.875rem` (14px) | `1.5` | `0` | `400` | Metrics, IDs, code |

### 2.4 Component Token Mapping

**Button**

| Variant | Background | Text | Border | Hover BG |
|---------|-----------|------|--------|----------|
| Primary | `--primary` | `--primary-foreground` | none | `--primary-hover` |
| Secondary | `--muted` | `--foreground` | `--border` | `--card-elevated` |
| Ghost | transparent | `--foreground-muted` | none | `--muted` |
| Destructive | `--error` | `--error-foreground` | none | `--error` at 90% L |
| AI | `--ai-accent` | `--ai-accent-foreground` | none | `--ai-accent` at +5% L |

**Card**

| Token | Value |
|-------|-------|
| Background | `--card` |
| Border | `--border-subtle` |
| Shadow | `--shadow-subtle` (rest), `--shadow-default` (hover) |
| Radius | `--radius-lg` |

**Input**

| State | Background | Border | Ring |
|-------|-----------|--------|------|
| Rest | `--background` | `--border` | none |
| Hover | `--background` | `--border-strong` | none |
| Focus | `--background` | `--primary` | `--ring` 2px offset-2 |
| Error | `--background` | `--error` | `--error` at 40% opacity |
| Placeholder | — | — | color: `--foreground-subtle` |

**Badge**

| Variant | Background | Text |
|---------|-----------|------|
| Default | `--muted` | `--foreground-muted` |
| Success | `--success` at 15% opacity | `--success` |
| Warning | `--warning` at 15% opacity | `--warning` |
| Error | `--error` at 15% opacity | `--error` |
| AI | `--ai-accent` at 15% opacity | `--ai-accent` |

### 2.5 Theme Implementation

Theme switching via `next-themes` with `attribute="data-theme"`:

```tsx
// app/layout.tsx
import { ThemeProvider } from "next-themes";

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          themes={["light", "dark"]}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Dashboard layout defaults to `"dark"`, intake form layout defaults to `"light"`, both with a toggle in the corner for user override.

### 2.6 Accessibility Requirements

- All color combinations meet WCAG 2.1 AA contrast (4.5:1 for text, 3:1 for UI elements)
- Focus rings visible in both themes: 2px ring, offset 2px, using `--ring`
- Motion respects `prefers-reduced-motion: reduce`
- Theme respects `prefers-color-scheme` as system default
- All interactive elements have minimum 44x44px touch target (mobile intake form)
