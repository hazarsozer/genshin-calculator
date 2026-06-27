"use client";

import { useBuildStore } from "@/lib/store";
import { elementAccent, DEFAULT_SKIN } from "@/lib/theme";
import { ALL_CHARACTERS } from "@genshin/data";
import type { CSSProperties } from "react";

/**
 * Applies the active skin + the selected character's element accent to the whole
 * app via CSS variables. Every Cockpit component reads `var(--ck-*)`, so theming
 * is centralized here: change character → element accent flows; switch skin (later)
 * → the surface token set flows.
 */
export function ThemeRoot({ children }: { children: React.ReactNode }) {
  const charKey = useBuildStore((s) => s.form.characterKey);
  const char = ALL_CHARACTERS.find((c) => c.name === charKey);
  const element = char?.element ?? "physical";
  const a = elementAccent(element);

  const style = {
    "--ck-accent": a.accent,
    "--ck-accent2": a.accent2,
    "--ck-glow": a.glow,
    "--ck-art-gradient": a.gradient,
  } as CSSProperties;

  return (
    <div
      data-skin={DEFAULT_SKIN}
      data-element={element}
      style={style}
      className="dark flex min-h-screen flex-col bg-[var(--ck-bg)] text-[var(--ck-text)]"
    >
      {children}
    </div>
  );
}
