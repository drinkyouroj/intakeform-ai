/**
 * Framer Motion variants and spring configs from the motion/theme spec.
 * All animations respect prefers-reduced-motion via Framer Motion's
 * built-in useReducedMotion() hook.
 */

import type { Variants, Transition } from 'framer-motion'

// Easing curves from the spec
const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1]
const easeIn: [number, number, number, number] = [0.55, 0, 1, 0.45]
const easeBounce: [number, number, number, number] = [0.34, 1.56, 0.64, 1]

// ---------- Spring configs ----------

export const springs = {
  snappy: { type: "spring" as const, stiffness: 500, damping: 30, mass: 1 },
  gentle: { type: "spring" as const, stiffness: 260, damping: 25, mass: 1 },
  bouncy: { type: "spring" as const, stiffness: 400, damping: 15, mass: 0.8 },
  slow: { type: "spring" as const, stiffness: 120, damping: 20, mass: 1.2 },
} as const

// ---------- General purpose ----------

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3, ease: easeOut } satisfies Transition,
}

// ---------- Stagger lists ----------

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

export const staggerChild: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easeOut },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: easeIn },
  },
}

// ---------- Card hover ----------

export const cardHover: Variants = {
  rest: {
    y: 0,
    transition: { duration: 0.2, ease: easeOut },
  },
  hover: {
    y: -2,
    transition: { duration: 0.2, ease: easeOut },
  },
}

// ---------- Scale on tap ----------

export const tapScale = {
  whileTap: { scale: 0.97 },
  transition: springs.snappy,
}

// ---------- Sheet / panel ----------

export const slideInFromRight: Variants = {
  initial: { x: "100%" },
  animate: {
    x: 0,
    transition: { duration: 0.3, ease: easeOut },
  },
  exit: {
    x: "100%",
    transition: { duration: 0.2, ease: easeIn },
  },
}

// ---------- Dialog / modal ----------

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.25, ease: easeOut },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.15, ease: easeIn },
  },
}

// ---------- AI follow-up (signature) ----------

export const followUpReveal = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: "auto",
    opacity: 1,
    transition: {
      height: springs.gentle,
      opacity: { duration: 0.35, ease: easeOut, delay: 0.1 },
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      opacity: { duration: 0.15, ease: easeIn },
      height: { duration: 0.25, ease: easeIn, delay: 0.05 },
    },
  },
}

export const followUpConnector = {
  initial: { scaleY: 0 },
  animate: {
    scaleY: 1,
    transition: { duration: 0.3, ease: easeOut, delay: 0.05 },
  },
  exit: { scaleY: 0, transition: { duration: 0.15 } },
}

export const thinkingDot = (i: number) => ({
  initial: { opacity: 0, y: 0 },
  animate: {
    opacity: [0, 1, 1],
    y: [0, -3, 0],
    transition: {
      opacity: { duration: 0.15, delay: i * 0.08 },
      y: {
        duration: 0.5,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay: 0.3 + i * 0.12,
      },
    },
  },
  exit: { opacity: 0, transition: { duration: 0.1 } },
})

// ---------- Celebration ----------

export const celebrationBurst = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: [0, 1.15, 1],
    opacity: [0, 1, 1],
    transition: {
      duration: 0.6,
      times: [0, 0.5, 1],
      ease: easeBounce,
    },
  },
}
