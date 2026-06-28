"use client";

import { useReducedMotion, motion } from "framer-motion";
import { drawerVariants } from "@/lib/motion";

/**
 * Drawer — a ~360px panel that slides in from the rail.
 * One open at a time; closes on × click (or backdrop handled by Cockpit).
 * Respects prefers-reduced-motion: no slide if reduced.
 */

interface DrawerProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Drawer({ title, onClose, children }: DrawerProps) {
  const prefersReduced = useReducedMotion();
  const v = prefersReduced ? drawerVariants.reduced : drawerVariants.normal;

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
      {/* Header */}
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

      {/* Scrollable body */}
      <div className="flex flex-col gap-4 overflow-y-auto p-4">
        {children}
      </div>
    </motion.aside>
  );
}
