"use client";

import { useState, useEffect, useId } from "react";

// ─── FallbackImage ────────────────────────────────────────────────────────────
// Walks the `sources` chain on each <img> onError; when all sources are
// exhausted the element's background (var(--ck-art-gradient)) shows through.
// Mirrors the approach in SplashArt / CharacterDrawer's CharAvatar.

interface FallbackImageProps {
  sources: readonly string[];
  alt: string;
  className?: string;
}

function FallbackImage({ sources, alt, className }: FallbackImageProps) {
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  // Reset when the primary source changes (= different entity).
  const firstSource = sources[0];
  useEffect(() => {
    setIdx(0);
    setFailed(false);
  }, [firstSource]);

  return (
    <div
      className={className}
      style={{ background: "var(--ck-art-gradient)", overflow: "hidden" }}
    >
      {!failed && sources.length > 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sources[idx]}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() =>
            idx + 1 < sources.length ? setIdx(idx + 1) : setFailed(true)
          }
        />
      )}
    </div>
  );
}

// ─── Public types ─────────────────────────────────────────────────────────────

export interface CatalogFilterOption<T> {
  label: string;
  value: string;
  test: (item: T) => boolean;
}

export interface CatalogFilterGroup<T> {
  group: string;
  options: CatalogFilterOption<T>[];
}

export interface CatalogProps<T> {
  items: readonly T[];
  getKey: (item: T) => string;
  /** Human-readable display label shown beneath the tile. */
  getLabel: (item: T) => string;
  /** CDN URL chain — tried left-to-right; exhaustion → gradient tile. */
  getIconSources: (item: T) => readonly string[];
  filters?: CatalogFilterGroup<T>[];
  /** Text used for search matching. Defaults to getLabel. */
  searchText?: (item: T) => string;
  /** Key of the currently-selected item; highlights its tile. */
  activeKey?: string;
  onPick: (item: T) => void;
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

export function Catalog<T>({
  items,
  getKey,
  getLabel,
  getIconSources,
  filters,
  searchText,
  activeKey,
  onPick,
}: CatalogProps<T>) {
  const uid = useId();
  const searchId = `${uid}-search`;

  const [search, setSearch] = useState("");
  // group name → Set of selected option values
  const [activeFilters, setActiveFilters] = useState<
    Record<string, Set<string> | undefined>
  >({});

  const getText = searchText ?? getLabel;

  // AND across groups, OR within each group.
  const filtered = items.filter((item) => {
    if (
      search.trim() !== "" &&
      !getText(item).toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    if (filters) {
      for (const { group, options } of filters) {
        const selected = activeFilters[group];
        if (!selected || selected.size === 0) continue;
        if (!options.some((opt) => selected.has(opt.value) && opt.test(item))) {
          return false;
        }
      }
    }
    return true;
  });

  function toggleChip(group: string, value: string) {
    setActiveFilters((prev) => {
      const existing = prev[group] ?? new Set<string>();
      const next = new Set<string>(existing);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return { ...prev, [group]: next };
    });
  }

  const hasConstraint =
    search.trim() !== "" ||
    Object.values(activeFilters).some((s) => s !== undefined && s.size > 0);

  return (
    <div className="flex flex-col gap-3">
      {/* ── Search ──────────────────────────────────────────────────── */}
      <label htmlFor={searchId} className="block">
        <span className="sr-only">Search</span>
        <input
          id={searchId}
          type="text"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface2)] px-3 py-1.5 text-[13px] text-[var(--ck-text)] placeholder-[var(--ck-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--ck-accent)]"
        />
      </label>

      {/* ── Filter chip rows ─────────────────────────────────────────── */}
      {filters?.map(({ group, options }) => (
        <div key={group} className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--ck-faint)]">
            {group}
          </span>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={group}>
            {options.map((opt) => {
              const isActive = activeFilters[group]?.has(opt.value) ?? false;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => toggleChip(group, opt.value)}
                  className={[
                    "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]",
                    isActive
                      ? "border-[var(--ck-accent)] bg-[var(--ck-accent)] text-[var(--ck-bg)]"
                      : "border-[var(--ck-border)] bg-[var(--ck-surface2)] text-[var(--ck-muted)] hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)]",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* ── Item grid / empty state ──────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-[13px] text-[var(--ck-muted)]">
            {hasConstraint
              ? "No results match your search or filters."
              : "No items available."}
          </p>
        </div>
      ) : (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))" }}
        >
          {filtered.map((item) => {
            const key = getKey(item);
            const label = getLabel(item);
            const isActive = key === activeKey;

            return (
              <button
                key={key}
                type="button"
                aria-current={isActive ? "true" : undefined}
                aria-label={label}
                onClick={() => onPick(item)}
                className={[
                  "flex flex-col items-center gap-1 rounded-xl border p-1.5 text-center transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-accent)]",
                  isActive
                    ? "border-[var(--ck-accent)] bg-[color-mix(in_srgb,var(--ck-accent)_10%,transparent)]"
                    : "border-[var(--ck-border)] bg-[var(--ck-surface)] hover:border-[var(--ck-accent)]",
                ].join(" ")}
              >
                <FallbackImage
                  sources={getIconSources(item)}
                  alt={label}
                  className="h-12 w-12 rounded-lg"
                />
                <span
                  className={[
                    "w-full truncate text-[10px] leading-tight",
                    isActive
                      ? "font-bold text-[var(--ck-accent)]"
                      : "text-[var(--ck-muted)]",
                  ].join(" ")}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
