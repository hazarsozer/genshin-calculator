/**
 * Sacrificer's Staff (4★ polearm, v6.1) — "Untainted Desire" stacking ATK% (B2 batch; added in review).
 *
 * ConditionStacks (weapon_untainted_desire = stack count, ≤3): ATK +8/10/12/14/16% PER STACK. Read via
 * the atk_total ratio full/stripped on Nahida (EM-ascension, no innate ATK% → ratio is exactly
 * 1 + stacks·perStackATK%/100). 0 stacks pins the gate (ratio 1.0); 1 vs 3 stacks pins the per-stack
 * linearity; both refine endpoints pin the scaling. (Sub-stat is CRIT Rate; the per-stack Energy
 * Recharge has no single-hit damage effect → not in this damage delta.)
 *
 * Values 2-witness-confirmed (Amber affix 113434 per-stack ATK 8→16% == GCSim spear/sacrificersstaff
 * atkBuff=0.06+0.02r, buff·stacks, stacks≤3).
 */

import { describe, it, expect } from "vitest";
import { nahida } from "../characters/nahida.js";
import { sacrificersStaff } from "../weapons/sacrificers-staff.js";
import { LEVELS, TALENTS, reconstructSettings, reconstructPort } from "./_reconstruct.js";

const ENEMY = { level: 90, resistance: 10 } as const;
const STAT_BLOCK = { atk_base: 2000 } as const;

function atkRatio(stacks: number, refine: number): number {
  const settings = reconstructSettings({
    charToggles: {}, setToggles: {},
    passiveToggles: stacks > 0 ? { weapon_untainted_desire: stacks } : {},
    constellation: 0, refine,
  });
  const common = {
    char: nahida, weaponStatTable: sacrificersStaff.statTable, statBlock: STAT_BLOCK, settings,
    passiveOn: true, artifactSets: {}, setRegistry: {}, levels: LEVELS, talents: TALENTS, enemy: ENEMY,
  } as const;
  const full = reconstructPort({ ...common, weapon: sacrificersStaff });
  const stripped = reconstructPort({ ...common, weapon: { ...sacrificersStaff, conditions: [] } });
  const atk = (r: typeof full): number => ((r.context.stats as Record<string, number | undefined>)["atk_total"]) ?? 0;
  return atk(full) / atk(stripped);
}

describe("Sacrificer's Staff — Untainted Desire (stacking ATK%)", () => {
  it("0 stacks → no ATK% (ratio 1.0)", () => {
    expect(atkRatio(0, 5)).toBeCloseTo(1.0, 6);
  });
  it("1 stack: ATK +8% (R1) / +16% (R5)", () => {
    expect(atkRatio(1, 1)).toBeCloseTo(1.08, 4);
    expect(atkRatio(1, 5)).toBeCloseTo(1.16, 4);
  });
  it("3 stacks (max): ATK +24% (R1) / +48% (R5) — per-stack linear", () => {
    expect(atkRatio(3, 1)).toBeCloseTo(1.24, 4);
    expect(atkRatio(3, 5)).toBeCloseTo(1.48, 4);
  });
});
