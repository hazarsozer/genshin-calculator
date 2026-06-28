"use client";

import { useReducedMotion, motion } from "framer-motion";
import { drawerVariants } from "@/lib/motion";
import { useIsMobile } from "@/lib/useMediaQuery";

/**
 * Drawer — slides in from the rail on desktop; rises as a bottom sheet on mobile.
 * One open at a time; closes on × click (or backdrop handled by Cockpit).
 * Respects prefers-reduced-motion: opacity-only when reduced.
 */

interface DrawerProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const HEADER = (title: string, onClose: () => void) => (
  <div className="flex items-center gap-3 border-b border-[var(--ck-border)] px-5 py-4">
    <span className="text-[11px] font-extrabold uppercase tracking-[2px] text-[var(--ck-accent2)]">
      {title}
    </span>
    <button
      type="button"
      onClick={onClose}
      className="ml-auto text-lg leading-none text-[var(--ck-faint)] transition-colors hover:text-[var(--ck-muted)]"
      aria-label="Close drawer"
    >
      ×
    </button>
  </div>
);

const BODY_CLASSES = "flex flex-col gap-4 overflow-y-auto p-4";

export function Drawer({ title, onClose, children }: DrawerProps) {
  const prefersReduced = useReducedMotion();
  const isMobile = useIsMobile();

  // Pick animation variant: reduced-motion wins, then mobile vs desktop.
  const v = prefersReduced
    ? drawerVariants.reduced
    : isMobile
      ? drawerVariants.mobileSheet
      : drawerVariants.normal;

  if (isMobile) {
    // Mobile: full-width bottom sheet that slides up from the bottom.
    return (
      <motion.div
        key="drawer"
        initial={v.initial}
        animate={v.animate}
        exit={v.exit}
        transition={v.transition}
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl border border-[var(--ck-border)] overflow-hidden"
        style={{
          maxHeight: "85vh",
          background: "linear-gradient(180deg, var(--ck-surface), var(--ck-bg))",
        }}
      >
        {/* Drag handle affordance */}
        <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
          <div className="h-1 w-10 rounded-full bg-[var(--ck-border)]" />
        </div>
        {HEADER(title, onClose)}
        <div className={BODY_CLASSES}>{children}</div>
      </motion.div>
    );
  }

  // Desktop: slide-over panel from the left rail (unchanged behaviour).
  return (
    <motion.aside
      key="drawer"
      initial={v.initial}
      animate={v.animate}
      exit={v.exit}
      transition={v.transition}
      className="relative z-20 flex flex-col border-r border-[var(--ck-border)] overflow-hidden"
      style={{
        width: 360,
        flexShrink: 0,
        background: "linear-gradient(180deg, var(--ck-surface), var(--ck-bg))",
      }}
    >
      {HEADER(title, onClose)}
      <div className={BODY_CLASSES}>{children}</div>
    </motion.aside>
  );
}
