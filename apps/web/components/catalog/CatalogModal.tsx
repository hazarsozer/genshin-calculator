"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

// ─── CatalogModal ─────────────────────────────────────────────────────────────
//
// Thin shell wrapping any <Catalog> in a native <dialog> overlay.
//
// Native <dialog showModal()> provides for free:
//   • Focus-trap (Tab cycles within the dialog)
//   • Focus restoration to the trigger on close
//   • ESC key handling (mapped to onClose via the "cancel" event)
//   • ::backdrop pseudo-element for the dim layer
//
// framer-motion handles the panel's fade+scale animation with reduced-motion
// awareness (opacity-only when prefers-reduced-motion is set).
//
// Additional accessibility:
//   • Body scroll is locked while open; restored on close or unmount.
//   • Clicking the backdrop (outside the panel) calls onClose.

interface CatalogModalProps {
  /** Whether the modal is open. */
  open: boolean;
  /** Called when user closes via ESC, backdrop click, or × button. */
  onClose: () => void;
  /** Panel header title (upper-case label style). */
  title: string;
  children: ReactNode;
}

export function CatalogModal({ open, onClose, title, children }: CatalogModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  // `rendered` drives AnimatePresence — true while open, false once exit starts.
  const [rendered, setRendered] = useState(false);

  // Open/close the native dialog in sync with the `open` prop.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
      setRendered(true);
      document.body.style.overflow = "hidden";
    } else {
      // Start exit animation, close native dialog after it finishes (~200ms).
      setRendered(false);
      const t = window.setTimeout(() => {
        if (dialog.open) dialog.close();
        document.body.style.overflow = "";
      }, 220);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  // Safety: always restore scroll lock on unmount.
  useEffect(() => () => { document.body.style.overflow = ""; }, []);

  // Map the native ESC "cancel" event → our onClose callback so parent state
  // stays in sync (prevents default so the dialog doesn't close on its own).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    function onCancel(e: Event) {
      e.preventDefault();
      onClose();
    }
    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  }, [onClose]);

  // Backdrop click: any mousedown outside the panel → close.
  function handleMouseDown(e: React.MouseEvent<HTMLDialogElement>) {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      onClose();
    }
  }

  const variants = prefersReduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.96 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.96 },
      };

  return (
    <dialog
      ref={dialogRef}
      onMouseDown={handleMouseDown}
      // Fill the viewport; ::backdrop dims the page behind.
      className="border-none bg-transparent p-0 [&::backdrop]:bg-black/60 [&::backdrop]:backdrop-blur-sm"
      style={{ margin: 0, width: "100vw", height: "100vh", maxWidth: "100vw", maxHeight: "100vh" }}
    >
      {/* Center the panel in the transparent dialog overlay.
          Mobile: no padding → full-screen panel. sm+: centred with rounded corners. */}
      <div className="flex h-full items-center justify-center p-0 sm:p-4">
        <AnimatePresence>
          {rendered && (
            <motion.div
              ref={panelRef}
              key="modal-panel"
              initial={variants.initial}
              animate={variants.animate}
              exit={variants.exit}
              transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] }}
              className="flex h-full w-full flex-col overflow-hidden border border-[var(--ck-border)] shadow-2xl sm:h-auto sm:max-h-[85vh] sm:max-w-2xl sm:rounded-2xl"
              style={{ background: "linear-gradient(180deg, var(--ck-surface), var(--ck-bg))" }}
            >
              {/* Header */}
              <div className="flex flex-none items-center border-b border-[var(--ck-border)] px-5 py-4">
                <span className="text-[11px] font-extrabold uppercase tracking-[2px] text-[var(--ck-accent2)]">
                  {title}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="ml-auto text-lg leading-none text-[var(--ck-faint)] transition-colors hover:text-[var(--ck-muted)]"
                >
                  ×
                </button>
              </div>

              {/* Scrollable catalog body */}
              <div className="flex-1 overflow-y-auto p-4">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </dialog>
  );
}
