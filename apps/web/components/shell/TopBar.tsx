"use client";

import { useSkinStore } from "@/lib/store";
import type { Skin } from "@/lib/theme";

const HUB_TABS = ["Calculator", "Database", "Guides", "Tier List", "Lore"] as const;
const MODES = ["Calculator", "Optimizer", "Compare"] as const;
const SKIN_OPTIONS: { value: Skin; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "vision", label: "Vision" },
];

/** Hub nav + tool-mode switch + skin switcher. Only Calculator is live; the rest are doors. */
export function TopBar() {
  const { skin, setSkin } = useSkinStore();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-6 border-b border-[var(--ck-border)] bg-[rgba(10,8,9,0.86)] px-6 backdrop-blur">
      <div className="flex items-center gap-2 font-bold">
        <span
          className="h-5 w-5 rounded-md shadow-[0_0_12px_var(--ck-glow)]"
          style={{ background: "conic-gradient(from 200deg, var(--ck-accent), var(--ck-accent2), var(--ck-accent))" }}
        />
        <span className="text-sm">
          NAME<span className="font-medium text-[var(--ck-faint)]">·calc</span>
        </span>
      </div>

      <nav className="hidden gap-4 text-[13px] md:flex">
        {HUB_TABS.map((t) => {
          const active = t === "Calculator";
          return (
            <span
              key={t}
              aria-disabled={!active}
              className={
                active
                  ? "relative font-semibold text-[var(--ck-text)] after:absolute after:-bottom-[18px] after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-[var(--ck-accent)]"
                  : "cursor-not-allowed text-[var(--ck-faint)] opacity-50"
              }
            >
              {t}
            </span>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-4">
        {/* Skin switcher */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-[0.15em] text-[var(--ck-faint)]">SKIN</span>
          <div
            className="flex gap-1 rounded-[10px] border border-[var(--ck-border)] bg-[var(--ck-surface)] p-[3px]"
            role="group"
            aria-label="Theme skin"
          >
            {SKIN_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSkin(value)}
                aria-pressed={skin === value}
                className={
                  skin === value
                    ? "rounded-md bg-[var(--ck-accent)] px-3 py-1.5 text-xs font-semibold text-black"
                    : "rounded-md px-3 py-1.5 text-xs font-medium text-[var(--ck-muted)] hover:text-[var(--ck-text)] transition-colors"
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Mode switch */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-[0.15em] text-[var(--ck-faint)]">MODE</span>
          <div className="flex gap-1 rounded-[10px] border border-[var(--ck-border)] bg-[var(--ck-surface)] p-[3px]">
            {MODES.map((m) => {
              const active = m === "Calculator";
              return (
                <button
                  key={m}
                  disabled={!active}
                  className={
                    active
                      ? "rounded-md bg-[var(--ck-accent)] px-3 py-1.5 text-xs font-semibold text-black"
                      : "flex cursor-not-allowed items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-[var(--ck-muted)] opacity-60"
                  }
                >
                  {m}
                  {!active && (
                    <span className="rounded bg-white/5 px-1 py-px text-[8px] font-bold tracking-wider text-[var(--ck-faint)]">
                      SOON
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
