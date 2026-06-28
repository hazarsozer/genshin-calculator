"use client";

/**
 * Rail — the 64px left icon rail.
 * 5 interactive buttons (Character · Weapon · Artifacts · Buffs & Team · Enemy),
 * a divider, then a dimmed non-interactive Optimizer.
 * Ported from the .rail / .ri markup in cockpit-scale-hifi.html.
 */

export type DrawerId =
  | "character"
  | "weapon"
  | "artifacts"
  | "buffs"
  | "enemy"
  | null;

interface RailItem {
  id: Exclude<DrawerId, null>;
  label: string;
  icon: React.ReactNode;
}

const ITEMS: RailItem[] = [
  {
    id: "character",
    label: "Build",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    id: "weapon",
    label: "Weapon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 19l11-11" />
        <path d="M14 4l6 6-1.5 1.5L13 5.5z" />
        <path d="M5 14l-1 5 5-1" />
      </svg>
    ),
  },
  {
    id: "artifacts",
    label: "Equip",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L7 7H3l3 4-4 2 4 2-3 4h4l5 3 5-3h4l-3-4 4-2-4-2 3-4h-4z" />
      </svg>
    ),
  },
  {
    id: "buffs",
    label: "Buffs",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round">
        <path d="M12 3l1.9 4.8L19 9.5l-5.1 1.7L12 16l-1.9-4.8L5 9.5l5.1-1.7z" />
      </svg>
    ),
  },
  {
    id: "enemy",
    label: "Enemy",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3.4" />
      </svg>
    ),
  },
];

interface RailProps {
  active: DrawerId;
  onOpen: (id: DrawerId) => void;
}

/** Fixed bottom tab bar — shown on small screens instead of the left rail. */
export function MobileTabBar({ active, onOpen }: RailProps) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 flex lg:hidden border-t border-[var(--ck-border)]"
      style={{ background: "#0e0a0a" }}
    >
      {ITEMS.map((item) => {
        const isOn = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpen(isOn ? null : item.id)}
            aria-label={item.label}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors"
            style={{
              color: isOn ? "var(--ck-accent2)" : "var(--ck-faint)",
              background: isOn
                ? "color-mix(in srgb, var(--ck-accent) 10%, transparent)"
                : "transparent",
            }}
          >
            <span className="h-[18px] w-[18px]">{item.icon}</span>
            <span className="text-[8px] font-bold uppercase tracking-wide">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function Rail({ active, onOpen }: RailProps) {
  return (
    <nav className="relative z-30 hidden flex-col items-center gap-1 border-r border-[var(--ck-border)] bg-[#0e0a0a] py-3 lg:flex" style={{ width: 64, flexShrink: 0 }}>
      {ITEMS.map((item) => {
        const isOn = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpen(isOn ? null : item.id)}
            aria-label={item.label}
            className="flex h-11 w-11 flex-col items-center justify-center gap-1 rounded-xl border transition-colors"
            style={{
              color: isOn ? "var(--ck-accent2)" : "var(--ck-faint)",
              background: isOn
                ? "color-mix(in srgb, var(--ck-accent) 12%, transparent)"
                : "transparent",
              borderColor: isOn
                ? "color-mix(in srgb, var(--ck-accent) 32%, transparent)"
                : "transparent",
            }}
          >
            <span className="h-[19px] w-[19px]">{item.icon}</span>
            <span className="text-[7.5px] font-bold uppercase tracking-[0.3px]">
              {item.label}
            </span>
          </button>
        );
      })}

      {/* divider */}
      <div className="mx-auto my-1.5 h-px w-[30px] bg-[var(--ck-border)]" />

      {/* Optimizer (dimmed, non-interactive) */}
      <div
        className="flex h-11 w-11 flex-col items-center justify-center gap-1 rounded-xl"
        style={{ opacity: 0.34, color: "var(--ck-faint)" }}
        aria-hidden
      >
        <span className="h-[19px] w-[19px]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
            <path d="M5 19l8-8" />
            <path d="M14 5.5l1.3 3 3 1.3-3 1.3L14 15l-1.3-3.1-3-1.3 3-1.3z" />
          </svg>
        </span>
        <span className="text-[7.5px] font-bold uppercase tracking-[0.3px]">Optim.</span>
      </div>
    </nav>
  );
}
