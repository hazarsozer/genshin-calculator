/**
 * Nocturne's Curtain Call (5★ catalyst, v6.2, Columbina's signature) — "Ballad of the Crossroads",
 * SELF-only.
 *
 * Like Reliquary of Truth (B4 #2) and unlike Nightweaver's (B4 #1), every effect lands on the WIELDER:
 * GCSim adds all stat mods to `char`, no c.Player.Chars() loop; the affix's "off-field" clause means
 * the equipper can trigger/receive the buff while off-field, NOT that teammates are buffed.
 *
 * Two conditions:
 *   - always-on Max HP +10/12/14/16/18% (ConditionStaticRefine → hp_percent, folds into hp_total).
 *   - weapon_sacred_wine (boolean-refine; "Bountiful Sea's Sacred Wine", 12s after a Lunar reaction):
 *       Max HP +14/16/18/20/22% (hp_percent) AND CRIT DMG from Lunar Reaction DMG +60/80/100/120/140%
 *       (crit_dmg_lunar → crit_dmg_lunar_total, /100; the reaction-scoped crit channel added in
 *       compileReaction — buffs lunar reactions ONLY, proven in lunarReactionCritDmg.test.ts).
 *   Energy 14-18 (once/18s, off-field) = energy-gen, not a damage output → out of scope.
 *
 * This file pins the SELF stat emit. HP% is read via the hp_total ratio full/stripped (Nahida has no
 * innate HP%, so the ratio is exactly 1 + Σ weapon-HP%/100); crit_dmg_lunar_total via full−stripped
 * delta (the same isolation the Reliquary/Blood-Soaked tests use).
 *
 * Values 2-witness-confirmed (no single source; see CLAUDE.md § Source-of-truth discipline):
 *   Project Amber (pinned): tools/port/_fixtures/ambr/weapon/14522.json
 *     affix["114522"] "Ballad of the Crossroads": HP 10→18% base, +14→22% wine, lunar CRIT DMG 60→140%.
 *   GCSim (cross-check): /tmp/gcsim/internal/weapons/catalyst/nocturnes/nocturnes.go
 *     m[HPP]=0.08+0.02r (0.10→0.18); hpBuff[HPP]=0.12+0.02r (0.14→0.22); critBuff[CD]=0.4+0.2r (0.60→1.40).
 */

import { describe, it, expect } from "vitest";
import { nahida } from "../characters/nahida.js";
import { nocturnesCurtainCall } from "../weapons/nocturnes-curtain-call.js";
import { LEVELS, TALENTS, reconstructSettings, reconstructPort } from "../reconstruct.js";

const ENEMY = { level: 90, resistance: 10 } as const;
const STAT_BLOCK = { atk_base: 2000, hp_base: 10000 } as const;

function build(toggles: Record<string, boolean>, refine: number) {
  const settings = reconstructSettings({
    charToggles: {},
    setToggles: {},
    passiveToggles: toggles,
    constellation: 0,
    refine,
  });
  const common = {
    char: nahida,
    weaponStatTable: nocturnesCurtainCall.statTable,
    statBlock: STAT_BLOCK,
    settings,
    passiveOn: true,
    artifactSets: {},
    setRegistry: {},
    levels: LEVELS,
    talents: TALENTS,
    enemy: ENEMY,
  } as const;
  const full = reconstructPort({ ...common, weapon: nocturnesCurtainCall });
  const stripped = reconstructPort({ ...common, weapon: { ...nocturnesCurtainCall, conditions: [] } });
  return { full, stripped };
}

const stat = (r: ReturnType<typeof reconstructPort>, key: string): number =>
  ((r.context.stats as Record<string, number | undefined>)[key]) ?? 0;

const NONE = {};
const WINE = { weapon_sacred_wine: true };

describe("Nocturne's Curtain Call — Ballad of the Crossroads (self stat emit)", () => {
  it("always-on Max HP +10% (R1) / +18% (R5)", () => {
    const r1 = build(NONE, 1);
    const r5 = build(NONE, 5);
    expect(stat(r1.full, "hp_total") / stat(r1.stripped, "hp_total")).toBeCloseTo(1.1, 4);
    expect(stat(r5.full, "hp_total") / stat(r5.stripped, "hp_total")).toBeCloseTo(1.18, 4);
  });

  it("Sacred Wine: Max HP +14% (R1) / +22% (R5) on top of base → ×1.24 / ×1.40", () => {
    const r1 = build(WINE, 1);
    const r5 = build(WINE, 5);
    expect(stat(r1.full, "hp_total") / stat(r1.stripped, "hp_total")).toBeCloseTo(1.24, 4);
    expect(stat(r5.full, "hp_total") / stat(r5.stripped, "hp_total")).toBeCloseTo(1.4, 4);
  });

  it("Sacred Wine: CRIT DMG for Lunar Reaction DMG +60% (R1) / +140% (R5)", () => {
    const r1 = build(WINE, 1);
    const r5 = build(WINE, 5);
    expect(stat(r1.full, "crit_dmg_lunar_total") - stat(r1.stripped, "crit_dmg_lunar_total")).toBeCloseTo(0.6, 6);
    expect(stat(r5.full, "crit_dmg_lunar_total") - stat(r5.stripped, "crit_dmg_lunar_total")).toBeCloseTo(1.4, 6);
  });

  it("no Sacred Wine → no lunar CRIT DMG, base HP only (the wine layer is off)", () => {
    const r5 = build(NONE, 5);
    expect(stat(r5.full, "crit_dmg_lunar_total") - stat(r5.stripped, "crit_dmg_lunar_total")).toBeCloseTo(0, 6);
    expect(stat(r5.full, "hp_total") / stat(r5.stripped, "hp_total")).toBeCloseTo(1.18, 4);
  });
});
