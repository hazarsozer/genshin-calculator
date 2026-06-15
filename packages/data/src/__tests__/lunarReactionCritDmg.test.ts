/**
 * Lunar-reaction crit DMG channel — engine extension for Nocturne's Curtain Call.
 *
 * compileReaction appends `crit_dmg_lunar_total` to the LUNAR reaction variants' (lunarcharged /
 * lunardirect) crit DMG keys only. This test proves the channel is reaction-SCOPED: injecting
 * crit_dmg_lunar raises the CRIT of Flins's lunar reactions (lunardirect `flins_burst_mid` +
 * lunarcharged `lunarcharged_contrubution`) by exactly that fraction, while leaving his NON-lunar
 * electro burst (`flins_burst_initial`) — and every reaction's `normal` column — untouched. A global
 * crit_dmg would fail the non-lunar assertion; an unwired channel would fail the lunar ones.
 *
 * Flins is the vehicle: ATK-scaling (no HP confound) with both lunar and non-lunar critting features.
 * crit_dmg_lunar is injected via the stat block to isolate the ENGINE channel from the weapon (the
 * weapon's own emit of crit_dmg_lunar_total is covered by nocturnesCurtainCall.test.ts). The crit
 * column equals `normal × (1 + Σ critDMG)`, so `(crit_with − crit_without) / normal` is exactly the
 * added lunar crit-DMG fraction, independent of the build's other crit DMG and crit rate.
 *
 * Base-inert: with crit_dmg_lunar absent the channel reads 0 → every existing lunar reaction is
 * byte-identical (the 58k goldens compare feature damage and never set this key).
 */

import { describe, it, expect } from "vitest";
import { buildStats } from "../buildStats.js";
import { compileCharacter } from "../loader.js";
import { flins } from "../characters/flins.js";
import { nahida } from "../characters/nahida.js";
import { blackcliffPoleStatTable, SolarPearlStatTable } from "../generated/weaponStatTables.js";

const STAT_BLOCK = { atk_base: 871, crit_dmg_base: 50, crit_rate_base: 5, mastery_base: 200 } as const;
const LEVELS = { charLevel: 90, ascension: 6, weaponLevel: 90, weaponAscension: 6 } as const;
const ENEMY = { level: 90, resistance: 10 } as const;
const TALENTS = { attack: 10, elemental: 10, burst: 10 } as const;

function flinsEval(extra: Record<string, number>): (key: string) => { normal: number; crit: number } {
  const { context } = buildStats({
    char: flins,
    weaponStatTable: blackcliffPoleStatTable,
    statBlock: { ...STAT_BLOCK, ...extra },
    levels: LEVELS,
    enemy: ENEMY,
    settings: {},
  });
  const compiled = compileCharacter(flins, {
    charElement: flins.element,
    talentLevels: TALENTS,
    settings: {},
    charLevel: LEVELS.charLevel,
  });
  return (key: string) => compiled[key]!(context);
}

/**
 * Nahida @ C2 — "The Root of All Fullness" makes her Bloom/Rupture + Burning TRANSFORMATIVE reactions
 * crit (crit_rate_bloom / crit_dmg_bloom). These route through compileReaction's `transformative`
 * branch (plain critDmg, never lunarCritDmg), so crit_dmg_lunar must NOT reach them — the most
 * dangerous leak path (a critting non-lunar reaction), guarded here so a future refactor of the
 * transformative branch can't silently start reading the lunar channel.
 */
function nahidaEval(extra: Record<string, number>): (key: string) => { normal: number; crit: number } {
  const settings = { char_constellation: 2 };
  const { context } = buildStats({
    char: nahida,
    weaponStatTable: SolarPearlStatTable,
    statBlock: { ...STAT_BLOCK, ...extra },
    levels: LEVELS,
    enemy: ENEMY,
    settings,
  });
  const compiled = compileCharacter(nahida, {
    charElement: nahida.element,
    talentLevels: TALENTS,
    settings,
    charLevel: LEVELS.charLevel,
  });
  return (key: string) => compiled[key]!(context);
}

const LUNAR_DIRECT = "burst.flins_burst_mid";
const LUNAR_CHARGED = "reaction.lunarcharged_contrubution";
const NON_LUNAR = "burst.flins_burst_initial";

const base = flinsEval({});
const wine = flinsEval({ crit_dmg_lunar: 140 }); // R5 Sacred Wine: +140% lunar CRIT DMG → 1.40

describe("lunar-reaction crit DMG channel (crit_dmg_lunar_total)", () => {
  it("raises a lunardirect reaction's crit by exactly the lunar crit-DMG fraction; normal unchanged", () => {
    const b = base(LUNAR_DIRECT);
    const w = wine(LUNAR_DIRECT);
    expect(w.normal).toBeCloseTo(b.normal, 6);
    expect((w.crit - b.crit) / b.normal).toBeCloseTo(1.4, 6);
  });

  it("raises a lunarcharged reaction's crit by the lunar crit-DMG fraction; normal unchanged", () => {
    const b = base(LUNAR_CHARGED);
    const w = wine(LUNAR_CHARGED);
    expect(w.normal).toBeCloseTo(b.normal, 6);
    expect((w.crit - b.crit) / b.normal).toBeCloseTo(1.4, 6);
  });

  it("does NOT touch a non-lunar electro burst's crit (reaction-scoped)", () => {
    const b = base(NON_LUNAR);
    const w = wine(NON_LUNAR);
    expect(w.crit).toBeCloseTo(b.crit, 6);
    expect(w.normal).toBeCloseTo(b.normal, 6);
  });

  it("does NOT touch a critting TRANSFORMATIVE reaction (Nahida C2 rupture uses plain critDmg)", () => {
    const b = nahidaEval({})("reaction.rupture");
    const w = nahidaEval({ crit_dmg_lunar: 140 })("reaction.rupture");
    expect(b.crit).toBeGreaterThan(b.normal); // C2 makes rupture actually crit → the assertion bites
    expect(w.crit).toBeCloseTo(b.crit, 6); // crit_dmg_lunar must NOT leak into the transformative path
    expect(w.normal).toBeCloseTo(b.normal, 6);
  });
});
