/**
 * Blood-Soaked Ruins (5★ polearm, v6.0) — "Mournful Tribute" two-channel passive.
 *
 * Two independent boolean-refine toggles (different in-game triggers; the FracturedHalo two-toggle
 * shape) feed two existing, golden-tested emit channels:
 *   - weapon_mournful_tribute (3.5s after an Elemental Burst): Lunar-Charged DMG +36/48/60/72/84%
 *       → dmg_reaction_lunarcharged (the FracturedHalo channel; REACTION_BONUS_PERCENT_KEYS → /100).
 *   - weapon_requiem_of_ruin (6s after triggering Lunar-Charged): CRIT DMG +28/35/42/49/56%
 *       → crit_dmg (the A Thousand Blazing Suns channel; FRACTION_TOTAL_STATS → /100).
 * The energy restore (12-16, once / 14s) is not a damage output — out of the port's scope.
 *
 * Each channel is isolated as full − stripped (the same weapon with its conditions removed) so the
 * holder's innate crit_dmg / lunarcharged bonus cancels, leaving exactly the weapon's contribution.
 * Both refine endpoints (R1, R5) are pinned, so the refine scaling AND the /100 emit scale are
 * load-bearing — drop either condition and the matching assertion collapses to 0.
 *
 * Values 2-witness-confirmed (no single source; see § Source-of-truth discipline):
 *   Project Amber (pinned): tools/port/_fixtures/ambr/weapon/13516.json
 *     affix["113516"] "Mournful Tribute": LC DMG 36%→84%, CRIT DMG 28%→56% (R1→R5).
 *   GCSim (cross-check): /tmp/gcsim/internal/weapons/spear/bloodsoakedruins/bloodsoakedruins.go
 *     lcBonus = 0.24 + 0.12*r (0.36→0.84); mCrit[CD] = 0.21 + 0.07*r (0.28→0.56).
 * Channel 1 (LC DMG) is additionally GCSim-live-gated on Flins; see v6WeaponsGate.test.ts.
 */

import { describe, it, expect } from "vitest";
import { keqing } from "../characters/keqing.js";
import { bloodSoakedRuins } from "../weapons/blood-soaked-ruins.js";
import type { DbObjectChar } from "@genshin/types";
import { LEVELS, TALENTS, reconstructSettings, reconstructPort } from "../reconstruct.js";

const ENEMY = { level: 90, resistance: 10 } as const;
const STAT_BLOCK = { atk_base: 2000 } as const;

/**
 * Blood-Soaked Ruins' contribution to `key` on `char`, isolated as full − stripped (the same
 * weapon with its passive conditions removed). The delta cancels any innate crit_dmg /
 * lunarcharged bonus the holder carries, leaving exactly the weapon's toggled bonus.
 */
function bonus(char: DbObjectChar, key: string, refine: number): number {
  const settings = reconstructSettings({
    charToggles: {},
    setToggles: {},
    passiveToggles: { weapon_mournful_tribute: true, weapon_requiem_of_ruin: true },
    constellation: 0,
    refine,
  });
  const common = {
    char,
    weaponStatTable: bloodSoakedRuins.statTable,
    statBlock: STAT_BLOCK,
    settings,
    passiveOn: true,
    artifactSets: {},
    setRegistry: {},
    levels: LEVELS,
    talents: TALENTS,
    enemy: ENEMY,
  } as const;

  const full = reconstructPort({ ...common, weapon: bloodSoakedRuins });
  const stripped = reconstructPort({ ...common, weapon: { ...bloodSoakedRuins, conditions: [] } });

  const read = (r: typeof full): number =>
    ((r.context.stats as Record<string, number | undefined>)[key]) ?? 0;
  return read(full) - read(stripped);
}

describe("Blood-Soaked Ruins — Mournful Tribute two-channel passive (R1 + R5)", () => {
  // CRIT DMG is emitted as the fraction `crit_dmg_total` (buildStats FRACTION_TOTAL_STATS →
  // `out["crit_dmg_total"] = raw.getTotal("crit_dmg")/100`), so the weapon's raw crit_dmg flows there.
  it("R1: Lunar-Charged DMG +36% and CRIT DMG +28%", () => {
    expect(bonus(keqing, "dmg_reaction_lunarcharged", 1)).toBeCloseTo(0.36, 6);
    expect(bonus(keqing, "crit_dmg_total", 1)).toBeCloseTo(0.28, 6);
  });

  it("R5: Lunar-Charged DMG +84% and CRIT DMG +56%", () => {
    expect(bonus(keqing, "dmg_reaction_lunarcharged", 5)).toBeCloseTo(0.84, 6);
    expect(bonus(keqing, "crit_dmg_total", 5)).toBeCloseTo(0.56, 6);
  });
});
