/**
 * Nightweaver's Looking Glass (5★ catalyst, v6.0, Lauma's signature) — "Millennial Hymn" self layer.
 *
 * Three boolean-refine self-toggles feeding existing golden-tested emit channels:
 *   - weapon_prayer_of_the_far_north → mastery +60/75/90/105/120 (EM after a Hydro/Dendro Skill, 4.5s)
 *   - weapon_new_moon_verse          → mastery +60/75/90/105/120 (EM after a Lunar-Bloom trigger, 10s)
 *   - weapon_millennial_hymn         → the combined reaction-DMG buff (active only when BOTH EM buffs
 *       are up in-game): dmg_reaction_bloom +120-240%, _hyperbloom/_burgeon +80-160%, _lunarbloom +40-80%.
 * The two EM toggles are independent and STACK (Dawning Frost precedent) → up to +240 EM when both up.
 *
 * This test pins the SELF layer (the wielder's own stats). Each toggle is isolated as full − stripped
 * (same weapon, conditions removed); both refine endpoints (R1, R5) are pinned. The off-field TEAM
 * propagation (a teammate's Nightweaver's buffing the active char) is a SEPARATE channel — see the
 * weapon_other.weapon_millennial_hymn buff in characterConditions.ts + its party-aware test.
 *
 * Values 2-witness-confirmed (no single source): Amber affix 114520 "Millennial Hymn" (EM 60→120;
 * Bloom 120→240, Hyperbloom/Burgeon 80→160, Lunar-Bloom 40→80) ↔ GCSim
 * catalyst/nightweavers/nightweavers.go (m[EM]=45+15r; reactBuff=0.3+0.1r, Bloom ×3 / Hyper+Burgeon ×2 /
 * DirectLunarBloom ×1).
 */

import { describe, it, expect } from "vitest";
import { lauma } from "../characters/lauma.js";
import { nightweaversLookingGlass } from "../weapons/nightweavers-looking-glass.js";
import { LEVELS, TALENTS, reconstructSettings, reconstructPort } from "../reconstruct.js";

const ENEMY = { level: 90, resistance: 10 } as const;
const STAT_BLOCK = { atk_base: 2000 } as const;

/**
 * Nightweaver's contribution to `key` with the given passive toggles enabled, isolated as
 * full − stripped (the same weapon with its conditions removed) so the holder's innate value cancels.
 */
function delta(toggles: Record<string, boolean>, key: string, refine: number): number {
  const settings = reconstructSettings({
    charToggles: {},
    setToggles: {},
    passiveToggles: toggles,
    constellation: 0,
    refine,
  });
  const common = {
    char: lauma,
    weaponStatTable: nightweaversLookingGlass.statTable,
    statBlock: STAT_BLOCK,
    settings,
    passiveOn: true,
    artifactSets: {},
    setRegistry: {},
    levels: LEVELS,
    talents: TALENTS,
    enemy: ENEMY,
  } as const;

  const full = reconstructPort({ ...common, weapon: nightweaversLookingGlass });
  const stripped = reconstructPort({ ...common, weapon: { ...nightweaversLookingGlass, conditions: [] } });

  const read = (r: typeof full): number =>
    ((r.context.stats as Record<string, number | undefined>)[key]) ?? 0;
  return read(full) - read(stripped);
}

const PRAYER = { weapon_prayer_of_the_far_north: true };
const NEW_MOON = { weapon_new_moon_verse: true };
const BOTH_EM = { weapon_prayer_of_the_far_north: true, weapon_new_moon_verse: true };
const HYMN = { weapon_millennial_hymn: true };

describe("Nightweaver's Looking Glass — Millennial Hymn self layer", () => {
  it("Prayer of the Far North: EM +60 (R1) / +120 (R5)", () => {
    expect(delta(PRAYER, "mastery", 1)).toBeCloseTo(60, 6);
    expect(delta(PRAYER, "mastery", 5)).toBeCloseTo(120, 6);
  });

  it("New Moon Verse: EM +60 (R1) / +120 (R5)", () => {
    expect(delta(NEW_MOON, "mastery", 1)).toBeCloseTo(60, 6);
    expect(delta(NEW_MOON, "mastery", 5)).toBeCloseTo(120, 6);
  });

  it("the two EM buffs stack: +120 (R1) / +240 (R5)", () => {
    expect(delta(BOTH_EM, "mastery", 1)).toBeCloseTo(120, 6);
    expect(delta(BOTH_EM, "mastery", 5)).toBeCloseTo(240, 6);
  });

  it("Millennial Hymn combined reaction-DMG (R5)", () => {
    expect(delta(HYMN, "dmg_reaction_bloom", 5)).toBeCloseTo(2.4, 6);
    expect(delta(HYMN, "dmg_reaction_hyperbloom", 5)).toBeCloseTo(1.6, 6);
    expect(delta(HYMN, "dmg_reaction_burgeon", 5)).toBeCloseTo(1.6, 6);
    expect(delta(HYMN, "dmg_reaction_lunarbloom", 5)).toBeCloseTo(0.8, 6);
  });

  it("Millennial Hymn combined reaction-DMG (R1)", () => {
    expect(delta(HYMN, "dmg_reaction_bloom", 1)).toBeCloseTo(1.2, 6);
    expect(delta(HYMN, "dmg_reaction_hyperbloom", 1)).toBeCloseTo(0.8, 6);
    expect(delta(HYMN, "dmg_reaction_burgeon", 1)).toBeCloseTo(0.8, 6);
    expect(delta(HYMN, "dmg_reaction_lunarbloom", 1)).toBeCloseTo(0.4, 6);
  });
});
