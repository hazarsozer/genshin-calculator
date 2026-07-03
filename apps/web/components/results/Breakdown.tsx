"use client";

import { useState } from "react";
import { useResults } from "@/lib/useResults";
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
  const [mode, setMode] = useState<Mode>(2);
  const [tab, setTab] = useState<"damage" | "stats">("damage");

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
                  {nodes.map((node) => (
                    <div key={node.feat.key}>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[13px] font-medium">
                          {node.feat.label}
                        </span>
                        <span
                          className="text-[15px] font-bold tabular-nums"
                          data-testid="result-avg"
                        >
                          {fmt(node.feat.triple[mode])}
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
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
