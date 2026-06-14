/**
 * set_other team-buff propagation — Night of the Sky's Unveiling + Silken Moon's Serenade.
 *
 * Verifies that the 4pc Lunar-reaction and EM buffs from these two v6.x sets propagate to
 * TEAMMATES via the `set_other.*` mechanism in CHARACTER_CONDITIONS — the same Noblesse
 * Oblige pattern already tested implicitly by partyBuffsBurndown.
 *
 * Tests:
 *   (A) teammate path — `party.setOther` injects the buff into the recipient via
 *       `set_other.<key>_4` → the OR gate fires the global condition.
 *   (B) self-worn path — equipping the set (setBonuses 4pc + boolean toggle) fires the
 *       self-worn AND arm of the same OR condition → no stats double-counted (set bonus[4]
 *       holds only a display-only `text_percent` placeholder after the refactor).
 *
 * Approach: call `buildStats` directly (no compile step needed — the stats live in
 * context.stats after the condition loop). Compare vs a no-party / no-set baseline.
 */

import { describe, it, expect } from "vitest";
import { buildStats } from "../buildStats.js";
import { flins } from "../characters/flins.js";
import { blackcliffPole } from "../weapons/blackcliff-pole.js";
import { nightOfTheSkysUnveiling } from "../artifacts/sets/night-of-the-skys-unveiling.js";
import { silkenMoonsSerenade } from "../artifacts/sets/silken-moons-serenade.js";
import type { DbObjectArtifactSet } from "@genshin/types";

// Shared build parameters (match v6SetsGate / reconstructPort conventions).
const LEVELS = {
  charLevel: 90,
  ascension: 6,
  weaponLevel: 90,
  weaponAscension: 6,
} as const;

const ENEMY = { level: 100, resistance: 10 } as const;
const TALENTS = { attack: 10, elemental: 10, burst: 10 } as const;
const STAT_BLOCK = { atk_base: 2000 } as const;

/** Build a stats context with an optional party.setOther + optional per-char settings. */
function buildWith(opts: {
  setOther?: string[];
  settings?: Record<string, unknown>;
  setBonuses?: Array<{ setKey: string; pieces: number }>;
  setRegistry?: Record<string, DbObjectArtifactSet>;
}) {
  return buildStats({
    char: flins,
    weaponStatTable: blackcliffPole.statTable,
    statBlock: STAT_BLOCK,
    levels: LEVELS,
    enemy: ENEMY,
    talentLevels: TALENTS,
    settings: opts.settings ?? {},
    setBonuses: opts.setBonuses,
    setRegistry: opts.setRegistry,
    party: opts.setOther !== undefined ? { setOther: opts.setOther } : undefined,
  });
}

// ────────────────────────────────────────────────────────────────────────────
// A. Night of the Sky's Unveiling
// ────────────────────────────────────────────────────────────────────────────

describe("set_other team-buff: Night of the Sky's Unveiling 4pc", () => {
  it("(A-teammate) setOther injects +10% lunarcharged DMG to recipient", () => {
    const baseline = buildWith({});
    const buffed = buildWith({
      setOther: ["night_of_the_skys_unveiling_4"],
    });

    // dmg_reaction_lunarcharged is stored as a fraction in context.stats (10% → 0.10).
    const base = baseline.context.stats["dmg_reaction_lunarcharged"] ?? 0;
    const got = buffed.context.stats["dmg_reaction_lunarcharged"] ?? 0;
    expect(got).toBeCloseTo(base + 0.10, 6);
  });

  it("(A-teammate) setOther injects +10% lunarbloom DMG to recipient", () => {
    const baseline = buildWith({});
    const buffed = buildWith({
      setOther: ["night_of_the_skys_unveiling_4"],
    });

    const base = baseline.context.stats["dmg_reaction_lunarbloom"] ?? 0;
    const got = buffed.context.stats["dmg_reaction_lunarbloom"] ?? 0;
    expect(got).toBeCloseTo(base + 0.10, 6);
  });

  it("(B-self-worn) wearer gets same +10% via the self-worn OR arm (no double-count)", () => {
    const setRegistry: Record<string, DbObjectArtifactSet> = {
      NightOfTheSkysUnveiling: nightOfTheSkysUnveiling,
    };
    const baseline = buildWith({});
    const selfWorn = buildWith({
      settings: { "set.night_of_the_skys_unveiling_4": true },
      setBonuses: [{ setKey: "NightOfTheSkysUnveiling", pieces: 4 }],
      setRegistry,
    });

    const base = baseline.context.stats["dmg_reaction_lunarcharged"] ?? 0;
    const got = selfWorn.context.stats["dmg_reaction_lunarcharged"] ?? 0;
    // Exactly +10% (not +20% which would indicate double-count).
    expect(got).toBeCloseTo(base + 0.10, 6);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// B. Silken Moon's Serenade
// ────────────────────────────────────────────────────────────────────────────

describe("set_other team-buff: Silken Moon's Serenade 4pc", () => {
  it("(A-teammate-ms1) setOther + moonsign_1 → +10% react AND +60 EM", () => {
    const baseline = buildWith({});
    const buffed = buildWith({
      setOther: ["silken_moons_serenade_4"],
      settings: { moonsign_1: true },
    });

    const baseReact = baseline.context.stats["dmg_reaction_lunarcharged"] ?? 0;
    const gotReact = buffed.context.stats["dmg_reaction_lunarcharged"] ?? 0;
    expect(gotReact).toBeCloseTo(baseReact + 0.10, 6);

    const baseEM = baseline.context.stats["mastery_total"] ?? 0;
    const gotEM = buffed.context.stats["mastery_total"] ?? 0;
    expect(gotEM).toBeCloseTo(baseEM + 60, 1);
  });

  it("(A-teammate-ms2) setOther + moonsign_2 (implies ms1) → +10% react AND +120 EM", () => {
    // Baseline must share the same moonsign settings so flins's personal moonsign_2
    // character condition (A1: +20 dmg_reaction_lunarcharged) doesn't skew the diff.
    const baseline = buildWith({ settings: { moonsign_1: true, moonsign_2: true } });
    const buffed = buildWith({
      setOther: ["silken_moons_serenade_4"],
      settings: { moonsign_1: true, moonsign_2: true },
    });

    const baseReact = baseline.context.stats["dmg_reaction_lunarcharged"] ?? 0;
    const gotReact = buffed.context.stats["dmg_reaction_lunarcharged"] ?? 0;
    expect(gotReact).toBeCloseTo(baseReact + 0.10, 6);

    const baseEM = baseline.context.stats["mastery_total"] ?? 0;
    const gotEM = buffed.context.stats["mastery_total"] ?? 0;
    // +60 (ms1 tier) + +60 (ms2 increment) = +120 total.
    expect(gotEM).toBeCloseTo(baseEM + 120, 1);
  });

  it("(A-teammate-ms0) setOther WITHOUT any moonsign → NO buff (case-0 floor)", () => {
    const baseline = buildWith({});
    const buffed = buildWith({
      setOther: ["silken_moons_serenade_4"],
      // No moonsign keys → Moonsign 0.
    });

    const baseReact = baseline.context.stats["dmg_reaction_lunarcharged"] ?? 0;
    const gotReact = buffed.context.stats["dmg_reaction_lunarcharged"] ?? 0;
    expect(gotReact).toBeCloseTo(baseReact, 6); // unchanged

    const baseEM = baseline.context.stats["mastery_total"] ?? 0;
    const gotEM = buffed.context.stats["mastery_total"] ?? 0;
    expect(gotEM).toBeCloseTo(baseEM, 1); // unchanged
  });

  it("(B-self-worn-ms2) wearer at ms2 gets +10% react AND +120 EM via self-worn OR arm", () => {
    const setRegistry: Record<string, DbObjectArtifactSet> = {
      SilkenMoonsSerenade: silkenMoonsSerenade,
    };
    // Baseline shares moonsign flags so flins's personal A1 condition (+20 lunarcharged)
    // is already accounted for in both arms of the diff.
    const baseline = buildWith({ settings: { moonsign_1: true, moonsign_2: true } });
    const selfWorn = buildWith({
      settings: {
        "set.silken_moons_serenade_4": true,
        moonsign_1: true,
        moonsign_2: true,
      },
      setBonuses: [{ setKey: "SilkenMoonsSerenade", pieces: 4 }],
      setRegistry,
    });

    const baseReact = baseline.context.stats["dmg_reaction_lunarcharged"] ?? 0;
    const gotReact = selfWorn.context.stats["dmg_reaction_lunarcharged"] ?? 0;
    // Exactly +10% (no double-count from old bonus[4]).
    expect(gotReact).toBeCloseTo(baseReact + 0.10, 6);

    const baseEM = baseline.context.stats["mastery_total"] ?? 0;
    const gotEM = selfWorn.context.stats["mastery_total"] ?? 0;
    // Exactly +120 (no double-count from old bonus[4]).
    expect(gotEM).toBeCloseTo(baseEM + 120, 1);
  });
});
