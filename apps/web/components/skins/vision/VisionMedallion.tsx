"use client";

import { useReducedMotion, motion } from "framer-motion";

interface Props {
  /** Element name displayed inside the gem (e.g. "Pyro"). */
  elementLabel: string;
  /** Headline feature label (e.g. "Charged Attack — Vaporize"). */
  featureLabel: string;
  /** Formatted average damage string already rendered by the parent count-up. */
  avgDisplay: string | number;
  /** Formatted non-crit string. */
  nonCritDisplay: string | number;
  /** Formatted crit string. */
  critDisplay: string | number;
}

/**
 * Vision-skin signature component — a faceted hexagonal element-gem anchoring
 * the headline damage number, ported from `.D3 .vision` in visual-directions.html.
 *
 * Colours come entirely from CSS vars:
 *   gem fill  → --ck-el-accent / --ck-el-accent2 (element colour, always)
 *   gem glow  → --ck-el-glow
 *   label     → --ck-accent2 (gold in vision skin)
 */
export function VisionMedallion({
  elementLabel,
  featureLabel,
  avgDisplay,
  nonCritDisplay,
  critDisplay,
}: Props) {
  const prefersReduced = useReducedMotion();

  return (
    <div className="mb-4 flex items-center gap-5">
      {/* Hexagonal gem */}
      <motion.div
        initial={prefersReduced ? false : { scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        aria-hidden
        style={{
          width: 82,
          height: 82,
          flexShrink: 0,
          clipPath: "polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
          background:
            "radial-gradient(circle at 40% 30%, var(--ck-el-accent2), var(--ck-el-accent) 55%, color-mix(in srgb, var(--ck-el-accent) 40%, #000))",
          boxShadow: "0 0 26px var(--ck-el-glow), inset 0 0 18px rgba(255,255,255,.28)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Gold filigree frame ring — visual-directions D3 .corner ornament translated */}
        <span
          className="text-[11px] font-bold tracking-widest uppercase"
          style={{
            color: "var(--ck-text)",
            fontFamily: "var(--font-display, serif)",
            textShadow: "0 1px 6px rgba(0,0,0,.6)",
          }}
        >
          {elementLabel}
        </span>
      </motion.div>

      {/* Headline number + sub values */}
      <div className="min-w-0">
        <div
          className="mb-0.5 text-[11px] font-bold uppercase tracking-wider"
          style={{ color: "var(--ck-accent2)" }}
        >
          {featureLabel}
        </div>
        <div
          className="font-[family-name:var(--font-display)] text-6xl leading-none tabular-nums text-white"
          style={{ textShadow: "0 0 34px var(--ck-el-glow)" }}
        >
          {avgDisplay}
        </div>
        <div className="mt-1.5 flex gap-5">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--ck-faint)" }}>
              Non-crit
            </div>
            <div
              className="font-[family-name:var(--font-display)] text-xl tabular-nums"
              style={{ color: "var(--ck-text)" }}
            >
              {nonCritDisplay}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--ck-faint)" }}>
              Crit
            </div>
            <div
              className="font-[family-name:var(--font-display)] text-xl tabular-nums"
              style={{ color: "var(--ck-accent2)" }}
            >
              {critDisplay}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
