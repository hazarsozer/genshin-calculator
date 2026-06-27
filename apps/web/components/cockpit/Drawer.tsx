"use client";

import { useReducedMotion, motion } from "framer-motion";

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

  return (
    <motion.aside
      key="drawer"
      initial={prefersReduced ? { opacity: 0 } : { x: -14, opacity: 0.4 }}
      animate={{ x: 0, opacity: 1 }}
      exit={prefersReduced ? { opacity: 0 } : { x: -14, opacity: 0.4 }}
      transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
      className="relative z-20 flex flex-col border-r border-[var(--ck-border)] overflow-hidden"
      style={{
        width: 360,
        flexShrink: 0,
        background: "linear-gradient(180deg, #140d0c, #0e0a0b)",
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
