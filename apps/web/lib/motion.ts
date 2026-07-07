import { animate, useMotionValue, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// ─── Shared Variants ─────────────────────────────────────────────────────────

/** Stage section entrance — subtle rise/fade on mount (180ms). */
export const stageEntranceVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export const stageEntranceTransition = {
  duration: 0.18,
  ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number],
};

/**
 * Drawer slide variants.
 * `normal`:      desktop — translates in from the left + fade.
 * `reduced`:     opacity only — no translation (prefers-reduced-motion).
 * `mobileSheet`: mobile — slides up from the bottom + fade.
 */
export const drawerVariants = {
  normal: {
    initial: { x: -14, opacity: 0.4 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -14, opacity: 0.4 },
    transition: { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] },
  },
  reduced: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] },
  },
  mobileSheet: {
    initial: { y: "100%", opacity: 0.9 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0.9 },
    transition: { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] },
  },
} as const;

// ─── useCountUp ──────────────────────────────────────────────────────────────

export const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/**
 * Animates a number from the old value to the new value when it changes.
 * - First render: returns the value directly (no animation; no hydration mismatch).
 * - Subsequent changes: smooth count-up (~350ms ease-out).
 * - prefers-reduced-motion: snaps instantly.
 * Returns a formatted string (comma-separated integer).
 */
export function useCountUp(value: number): string {
  const motionVal = useMotionValue(value);
  const [display, setDisplay] = useState(value);
  const prefersReduced = useReducedMotion();
  const isFirst = useRef(true);

  // Mirror the motion value into React state so renders stay in sync
  useEffect(() => {
    return motionVal.on("change", (v) => setDisplay(v));
  }, [motionVal]);

  useEffect(() => {
    // Skip animation on initial mount — prevents hydration mismatch
    if (isFirst.current) {
      isFirst.current = false;
      motionVal.set(value);
      return;
    }

    if (prefersReduced) {
      motionVal.set(value);
      return;
    }

    if (motionVal.get() === value) return;
    const controls = animate(motionVal, value, {
      duration: 0.35,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [value, motionVal, prefersReduced]);

  return fmt(display);
}
