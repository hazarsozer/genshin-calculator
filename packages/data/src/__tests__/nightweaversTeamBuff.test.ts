/**
 * Nightweaver's Looking Glass — off-field TEAM propagation (weapon_other.weapon_millennial_hymn).
 *
 * The "Millennial Hymn" combined buff raises ALL nearby party members' Bloom/Hyperbloom/Burgeon/
 * Lunar-Bloom DMG (even while the wielder is off-field), so it propagates to TEAMMATES through the
 * `weapon_other.*` channel in CHARACTER_CONDITIONS — the same off-field pattern as Wolf's Gravestone.
 * GCSim-free regression lock (the v6SetsGate / setOtherTeamBuffs approach): drive `buildStats` with a
 * teammate publishing the gate at a refine level, and read the recipient's emitted reaction-DMG stats.
 *
 * Tests:
 *   (A) teammate path — `party.weaponOther` publishes `weapon_other.weapon_millennial_hymn` at the
 *       teammate's refine → the recipient gains all four reaction-DMG bonuses (R5 and R1 endpoints).
 *   (guard) the NOT(weapon_millennial_hymn) arm suppresses the team copy when the active char is the
 *       wielder (then the self toggle carries it — "cannot stack" → no double-count).
 *
 * Values 2-witness-confirmed (Amber affix 114520 == GCSim nightweavers.go reactBuff=0.3+0.1r ×3/×2/×1);
 * the recipient char is arbitrary (the bonuses are flat reaction-DMG stats, char-independent). The
 * reaction DMG itself is not single-rep GCSim-gateable (delayed Dendro-Core / lunar contributor — the
 * blackmarrow precedent); this test locks the PROPAGATION + the no-double-count guard.
 */

import { describe, it, expect } from "vitest";
import { buildStats } from "../buildStats.js";
import { flins } from "../characters/flins.js";
import { blackcliffPole } from "../weapons/blackcliff-pole.js";

const LEVELS = { charLevel: 90, ascension: 6, weaponLevel: 90, weaponAscension: 6 } as const;
const ENEMY = { level: 100, resistance: 10 } as const;
const TALENTS = { attack: 10, elemental: 10, burst: 10 } as const;
const STAT_BLOCK = { atk_base: 2000 } as const;

const KEYS = [
  "dmg_reaction_bloom",
  "dmg_reaction_hyperbloom",
  "dmg_reaction_burgeon",
  "dmg_reaction_lunarbloom",
] as const;

/** Build a recipient's stats with an optional teammate weapon_other publication + extra settings. */
function buildWith(opts: {
  weaponOther?: Record<string, number>;
  settings?: Record<string, unknown>;
}) {
  return buildStats({
    char: flins,
    weaponStatTable: blackcliffPole.statTable,
    statBlock: STAT_BLOCK,
    levels: LEVELS,
    enemy: ENEMY,
    talentLevels: TALENTS,
    settings: opts.settings ?? {},
    ...(opts.weaponOther !== undefined ? { party: { weaponOther: opts.weaponOther } } : {}),
  });
}

function delta(buffed: ReturnType<typeof buildWith>, baseline: ReturnType<typeof buildWith>, key: string): number {
  return (buffed.context.stats[key] ?? 0) - (baseline.context.stats[key] ?? 0);
}

describe("Nightweaver's Looking Glass — off-field team propagation (weapon_other.weapon_millennial_hymn)", () => {
  it("(A-teammate R5) recipient gains Bloom +2.4, Hyperbloom/Burgeon +1.6, Lunar-Bloom +0.8", () => {
    const baseline = buildWith({});
    const buffed = buildWith({ weaponOther: { "weapon_other.weapon_millennial_hymn": 5 } });
    expect(delta(buffed, baseline, "dmg_reaction_bloom")).toBeCloseTo(2.4, 6);
    expect(delta(buffed, baseline, "dmg_reaction_hyperbloom")).toBeCloseTo(1.6, 6);
    expect(delta(buffed, baseline, "dmg_reaction_burgeon")).toBeCloseTo(1.6, 6);
    expect(delta(buffed, baseline, "dmg_reaction_lunarbloom")).toBeCloseTo(0.8, 6);
  });

  it("(A-teammate R1) refine scales the bonuses: Bloom +1.2, Hyperbloom/Burgeon +0.8, Lunar-Bloom +0.4", () => {
    const baseline = buildWith({});
    const buffed = buildWith({ weaponOther: { "weapon_other.weapon_millennial_hymn": 1 } });
    expect(delta(buffed, baseline, "dmg_reaction_bloom")).toBeCloseTo(1.2, 6);
    expect(delta(buffed, baseline, "dmg_reaction_hyperbloom")).toBeCloseTo(0.8, 6);
    expect(delta(buffed, baseline, "dmg_reaction_burgeon")).toBeCloseTo(0.8, 6);
    expect(delta(buffed, baseline, "dmg_reaction_lunarbloom")).toBeCloseTo(0.4, 6);
  });

  it("(guard) the active char wielding Nightweaver's (self toggle ON) suppresses the team copy", () => {
    // The wielder receives the buff via the self toggle weapon_millennial_hymn (tested in
    // nightweaversLookingGlass.test.ts); the NOT-self guard keeps the team copy from stacking on top.
    const baseline = buildWith({});
    const guarded = buildWith({
      weaponOther: { "weapon_other.weapon_millennial_hymn": 5 },
      settings: { weapon_millennial_hymn: true },
    });
    for (const k of KEYS) {
      expect(delta(guarded, baseline, k)).toBeCloseTo(0, 6);
    }
  });
});
