/**
 * Moonweaver's Dawn (4★ sword, v6.0) — energy-cap tier auto-resolution + engine injection.
 *
 * The "Secret Silver's Testament" passive grants Burst DMG in two layers:
 *   - an ALWAYS-ON base: +20/25/30/35/40% (R1..R5), and
 *   - an EXCLUSIVE energy-cap tier keyed on the wielder's burst Energy Capacity
 *     (GCSim `cost := char.EnergyMax`):
 *         cost ≤ 40       → +28/35/42/49/56%   (tier A)
 *         40 < cost ≤ 60  → +16/20/24/28/32%   (tier B)
 *         cost > 60       → +0
 *
 * The tier is resolved automatically from the equipped character's `burst_energy_cost`
 * (a statTable constEntry) which `buildStats` surfaces into the condition EvalContext — there
 * is no player toggle. This test pins that behaviour on three real sword holders whose burst
 * costs span the three tiers, AND is its own ANTI-GAMING proof: were the engine to stop reading
 * burst_energy_cost, all three would collapse to base-only (0.40), so the DIFFERENTIATION
 * (0.96 / 0.72 / 0.40 at R5) is load-bearing on the injection.
 *
 * Values triple-cross-checked: Amber affix 111434 ("Secret Silver's Testament") ↔ GCSim
 * sword/moonweaversdawn/moonweaversdawn.go ↔ docs/.../2026-06-14-b2-datamine.md. Holder burst
 * costs verified vs generated/charTables.ts (Keqing 40, Bennett 60, Xingqiu 80).
 */

import { describe, it, expect } from "vitest";
import { keqing } from "../characters/keqing.js";
import { bennett } from "../characters/bennett.js";
import { xingqiu } from "../characters/xingqiu.js";
import { moonweaversDawn } from "../weapons/moonweavers-dawn.js";
import type { DbObjectChar } from "@genshin/types";
import { LEVELS, TALENTS, reconstructSettings, reconstructPort } from "../reconstruct.js";

const ENEMY = { level: 90, resistance: 10 } as const;
const STAT_BLOCK = { atk_base: 2000 } as const;

/**
 * The dmg_burst (fraction) that Moonweaver's Dawn R5 contributes on `char`, isolated as
 * full − stripped (the same weapon with its passive removed). The delta cancels any innate
 * burst-DMG the holder carries, leaving exactly the weapon's base + auto-resolved tier.
 */
function moonweaverBurstBonus(char: DbObjectChar): number {
  const settings = reconstructSettings({
    charToggles: {},
    setToggles: {},
    passiveToggles: {},
    constellation: 0,
    refine: 5,
  });
  const common = {
    char,
    weaponStatTable: moonweaversDawn.statTable,
    statBlock: STAT_BLOCK,
    settings,
    passiveOn: true,
    artifactSets: {},
    setRegistry: {},
    levels: LEVELS,
    talents: TALENTS,
    enemy: ENEMY,
  } as const;

  const full = reconstructPort({ ...common, weapon: moonweaversDawn });
  const stripped = reconstructPort({ ...common, weapon: { ...moonweaversDawn, conditions: [] } });

  const read = (r: typeof full): number =>
    ((r.context.stats as Record<string, number | undefined>)["dmg_burst"]) ?? 0;
  return read(full) - read(stripped);
}

describe("Moonweaver's Dawn — energy-cap tier auto-resolves from burst_energy_cost (R5)", () => {
  it("Keqing (40 energy → tier A): base 40% + 56% = 96% Burst DMG", () => {
    expect(moonweaverBurstBonus(keqing)).toBeCloseTo(0.96, 6);
  });

  it("Bennett (60 energy → tier B): base 40% + 32% = 72% Burst DMG", () => {
    expect(moonweaverBurstBonus(bennett)).toBeCloseTo(0.72, 6);
  });

  it("Xingqiu (80 energy → no tier): base 40% only", () => {
    expect(moonweaverBurstBonus(xingqiu)).toBeCloseTo(0.4, 6);
  });
});
