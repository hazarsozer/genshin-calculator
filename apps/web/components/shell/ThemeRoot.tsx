"use client";

import { useEffect } from "react";
import { useBuildStore, useSkinStore, readStoredSkin } from "@/lib/store";
import { elementAccent } from "@/lib/theme";
import { ALL_CHARACTERS } from "@genshin/data";
import type { CSSProperties } from "react";

/**
 * Applies the active skin + the selected character's element accent to the whole
 * app via CSS variables. Every Cockpit component reads `var(--ck-*)`, so theming
 * is centralized here.
 *
 * - Dark skin: element accent flows to `--ck-accent` / `--ck-accent2` / `--ck-glow`.
 * - Vision skin: gold filigree flows to `--ck-accent` / `--ck-accent2` / `--ck-glow`;
 *   element accent flows to `--ck-el-accent` / `--ck-el-accent2` / `--ck-el-glow` so
 *   VisionMedallion can colour the gem independently.
 */
export function ThemeRoot({ children }: { children: React.ReactNode }) {
  const charKey = useBuildStore((s) => s.form.characterKey);
  const { skin, setSkin } = useSkinStore();
  const char = ALL_CHARACTERS.find((c) => c.name === charKey);
  const element = char?.element ?? "physical";
  const a = elementAccent(element);

  // Hydrate skin from localStorage after first mount (avoids SSR mismatch).
  useEffect(() => {
    const stored = readStoredSkin();
    if (stored !== skin) setSkin(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // In vision skin: gold UI chrome, element accent isolated to gem tokens.
  const isVision = skin === "vision";
  const style = {
    // Element gem tokens — always element-coloured (used by VisionMedallion).
    "--ck-el-accent": a.accent,
    "--ck-el-accent2": a.accent2,
    "--ck-el-glow": a.glow,
    "--ck-el-gradient": a.gradient,
    // Main accent tokens — element in dark, gold in vision.
    "--ck-accent": isVision ? "#c9a456" : a.accent,
    "--ck-accent2": isVision ? "#e8c977" : a.accent2,
    "--ck-glow": isVision ? "rgba(201,164,86,.35)" : a.glow,
    // Art gradient always uses element colour so splash art bg stays themed.
    "--ck-art-gradient": a.gradient,
  } as CSSProperties;

  return (
    <div
      data-skin={skin}
      data-element={element}
      style={style}
      className="dark flex min-h-screen flex-col bg-[var(--ck-bg)] text-[var(--ck-text)]"
    >
      {children}
    </div>
  );
}
