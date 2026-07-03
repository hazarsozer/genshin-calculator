"use client";

import { useState } from "react";
import { Pin, PinOff } from "lucide-react";
import { useResults } from "@/lib/useResults";
import { useBuildStore } from "@/lib/store";
import { findCharacter } from "@/lib/catalog";
import { explainFeature, elementFromFeature, type TreeNode } from "@/lib/damageTree";
import type { FeatureResult } from "@/lib/types";
import { StatsSheet } from "./StatsSheet";

type Mode = 0 | 1 | 2; // index into [non-crit, crit, average]
const MODES: { k: Mode; l: string }[] = [
  { k: 0, l: "Non-crit" },
  { k: 2, l: "Average" },
  { k: 1, l: "Crit" },
];
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

// Feature keys are `<category>.<name>`; the category is the section.
const CATEGORY_TITLES: Record<string, string> = {
  attack: "Attack",
  skill: "Elemental Skill",
  burst: "Elemental Burst",
  reaction: "Reactions",
  heal: "Healing",
  shield: "Shield",
};
const CATEGORY_ORDER = [
  "attack",
  "skill",
  "burst",
  "reaction",
  "heal",
  "shield",
];

const catOf = (key: string) => key.split(".")[0];
const nameOf = (key: string) => key.split(".").slice(1).join(".");
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Categories with an inline calc-tree accordion. Reaction/heal/shield rows show
// the % chip but never expand (their outputs aren't a [dmgBonus×def×res×crit]
// damage instance the tree formula models).
const EXPANDABLE_CATEGORIES = new Set(["attack", "skill", "burst"]);

/** Best-effort damageType from category + feature name; null when unclear
 *  (explainFeature treats damageType as optional, so null just omits the
 *  `dmg_<damageType>` bonus term rather than guessing wrong). */
function damageTypeFor(category: string, name: string): string | null {
  if (category === "skill" || category === "burst") return category;
  if (category !== "attack") return null;
  if (/plunge/.test(name)) return "plunge";
  if (/charged|aimed/.test(name)) return "charged";
  if (/normal_hit/.test(name)) return "normal";
  return null;
}

interface Node {
  feat: FeatureResult;
  children: FeatureResult[];
}

/**
 * Group features by category, and nest multi-hit *parts* under their *total*:
 * a feature is a child of a parent when its name is `<parentBase>_<digit>` where
 * parentBase is the parent's name (or its name minus a `_total` suffix). E.g.
 * `charged_hit_1`/`charged_hit_2` nest under `charged_hit_total`, and
 * `charge_level_1_1`/`_1_2` nest under `charge_level_1`.
 */
function groupFeatures(feats: readonly FeatureResult[]): [string, Node[]][] {
  const childToParent = new Map<string, string>();
  for (const child of feats) {
    const cn = nameOf(child.key);
    for (const parent of feats) {
      if (parent.key === child.key || catOf(parent.key) !== catOf(child.key))
        continue;
      const base = nameOf(parent.key).replace(/_total$/, "");
      if (base && new RegExp(`^${esc(base)}_\\d+$`).test(cn)) {
        childToParent.set(child.key, parent.key);
        break;
      }
    }
  }

  const sections = new Map<string, Node[]>();
  for (const f of feats) {
    if (childToParent.has(f.key)) continue; // nested under its parent
    const children = feats.filter((x) => childToParent.get(x.key) === f.key);
    const cat = catOf(f.key);
    if (!sections.has(cat)) sections.set(cat, []);
    sections.get(cat)!.push({ feat: f, children });
  }

  return [...sections.entries()].sort(
    (a, b) =>
      (CATEGORY_ORDER.indexOf(a[0]) + 1 || 99) -
      (CATEGORY_ORDER.indexOf(b[0]) + 1 || 99),
  );
}

const TABS: { k: "damage" | "stats"; l: string }[] = [
  { k: "damage", l: "Damage" },
  { k: "stats", l: "Stats" },
];

export function Breakdown() {
  const result = useResults();
  const pinnedFeature = useBuildStore((s) => s.form.pinnedFeature);
  const setForm = useBuildStore((s) => s.setForm);
  const characterKey = useBuildStore((s) => s.form.characterKey);
  const infusion = useBuildStore((s) => s.form.conditions.infusion);
  const charLevel = useBuildStore((s) => s.form.charLevel);
  const enemy = useBuildStore((s) => s.form.enemy);
  const [mode, setMode] = useState<Mode>(2);
  const [tab, setTab] = useState<"damage" | "stats">("damage");
  const [expanded, setExpanded] = useState<string | null>(null);

  if (result.error)
    return <p className="text-sm text-red-400">{result.error}</p>;
  if (!result.features.length)
    return (
      <p className="text-sm text-[var(--ck-muted)]">
        Pick a character to see the damage breakdown.
      </p>
    );

  const sections = groupFeatures(result.features);
  const max = Math.max(1, ...result.features.map((f) => f.triple[mode]));
  // % chips are always against the AVERAGE (mode-independent), summed across
  // every top-level node in every category (matches on-screen totals, not
  // nested multi-hit parts).
  const totalAvg = sections
    .flatMap(([, nodes]) => nodes)
    .reduce((sum, n) => sum + n.feat.triple[2], 0);

  function calcTreeFor(
    feat: FeatureResult,
    category: string
  ): { nodes: TreeNode[]; residual: number | null } | null {
    if (!result.stats || !EXPANDABLE_CATEGORIES.has(category)) return null;
    const explained = explainFeature({
      avg: feat.triple[2],
      noncrit: feat.triple[0],
      element: elementFromFeature(findCharacter(characterKey), feat.key, infusion),
      damageType: damageTypeFor(category, nameOf(feat.key)),
      stats: result.stats,
      enemy,
      charLevel,
    });
    return explained;
  }

  return (
    <div>
      <div className="mb-4 inline-flex rounded-lg border border-[var(--ck-border)] bg-[var(--ck-bg)] p-[3px] text-xs">
        {TABS.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            data-testid={t.k === "stats" ? "results-tab-stats" : undefined}
            className="rounded-md px-3 py-1 font-semibold"
            style={
              tab === t.k
                ? {
                    background:
                      "color-mix(in srgb, var(--ck-accent) 16%, transparent)",
                    color: "var(--ck-accent2)",
                  }
                : { color: "var(--ck-muted)", fontWeight: 500 }
            }
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === "stats" ? (
        <StatsSheet stats={result.stats} />
      ) : (
        <>
          <div className="mb-4 inline-flex rounded-lg border border-[var(--ck-border)] bg-[var(--ck-bg)] p-[3px] text-xs">
            {MODES.map((m) => (
              <button
                key={m.k}
                onClick={() => setMode(m.k)}
                className="rounded-md px-3 py-1 font-semibold"
                style={
                  mode === m.k
                    ? {
                        background:
                          "color-mix(in srgb, var(--ck-accent) 16%, transparent)",
                        color: "var(--ck-accent2)",
                      }
                    : { color: "var(--ck-muted)", fontWeight: 500 }
                }
              >
                {m.l}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-5">
            {sections.map(([category, nodes]) => (
              <div key={category}>
                <div className="mb-2.5 flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.15em] text-[var(--ck-faint)]">
                  {CATEGORY_TITLES[category] ?? category}
                  <span className="h-px flex-1 bg-[var(--ck-border)]" />
                </div>

                <div className="flex flex-col gap-2.5">
                  {nodes.map((node) => {
                    const pinned = pinnedFeature === node.feat.key;
                    const pct = Math.round((node.feat.triple[2] / totalAvg) * 100);
                    const tree = calcTreeFor(node.feat, category);
                    const isOpen = expanded === node.feat.key;
                    return (
                    <div key={node.feat.key}>
                      <div
                        className="flex items-baseline justify-between"
                        style={tree ? { cursor: "pointer" } : undefined}
                        onClick={() => {
                          if (!tree) return;
                          setExpanded(isOpen ? null : node.feat.key);
                        }}
                      >
                        <span className="flex items-center gap-1.5 text-[13px] font-medium">
                          <button
                            type="button"
                            aria-pressed={pinned}
                            aria-label={pinned ? "Unpin from headline" : "Pin as headline"}
                            data-testid={`pin-${node.feat.key}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setForm({ pinnedFeature: pinned ? undefined : node.feat.key });
                            }}
                            className="text-[var(--ck-faint)] transition-colors hover:text-[var(--ck-accent2)]"
                            style={pinned ? { color: "var(--ck-accent2)" } : undefined}
                          >
                            {pinned ? <PinOff size={13} /> : <Pin size={13} />}
                          </button>
                          {node.feat.label}
                        </span>
                        <span className="flex items-center gap-2">
                          <span
                            className="text-[10.5px] font-semibold tabular-nums text-[var(--ck-faint)]"
                            data-testid={`pct-${node.feat.key}`}
                          >
                            {Number.isFinite(pct) ? pct : 0}%
                          </span>
                          <span
                            className="text-[15px] font-bold tabular-nums"
                            data-testid="result-avg"
                          >
                            {fmt(node.feat.triple[mode])}
                          </span>
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded bg-[#1a1311]">
                        <div
                          className="h-full rounded transition-[width] duration-500 motion-reduce:transition-none"
                          style={{
                            width: `${Math.max(2, (node.feat.triple[mode] / max) * 100)}%`,
                            background:
                              "linear-gradient(90deg, var(--ck-accent), var(--ck-accent2))",
                            boxShadow: "0 0 12px var(--ck-glow)",
                          }}
                        />
                      </div>

                      {isOpen && tree && (
                        <div className="mt-1.5 ml-3 flex flex-col gap-0.5 border-l border-[var(--ck-border)] pl-3 text-[11.5px] text-[var(--ck-muted)]">
                          {tree.nodes.map((n, i) => (
                            <div key={n.label} className="flex items-baseline justify-between">
                              <span>
                                {i === 0 ? "=" : "×"} {n.label}
                              </span>
                              <span className="tabular-nums">{n.factor.toFixed(4)}</span>
                            </div>
                          ))}
                          {tree.residual !== null && (
                            <div className="flex items-baseline justify-between">
                              <span>× special terms</span>
                              <span className="tabular-nums">{tree.residual.toFixed(3)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {node.children.length > 0 && (
                        <div className="mt-1.5 ml-3 flex flex-col gap-1 border-l border-[var(--ck-border)] pl-3">
                          {node.children.map((c) => (
                            <div
                              key={c.key}
                              className="flex items-baseline justify-between text-[var(--ck-muted)]"
                            >
                              <span className="text-[11.5px]">{c.label}</span>
                              <span className="text-[12px] tabular-nums">
                                {fmt(c.triple[mode])}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
