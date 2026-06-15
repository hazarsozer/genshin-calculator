/**
 * Serenity's Call (4★ sword, v6.0) — "Solemn Silence" HP% passive (B2 batch; added in review).
 *
 * weapon_solemn_silence (boolean-refine): Max HP +16/20/24/28/32% for 12s after causing a reaction.
 * Read via the hp_total ratio full/stripped on Nahida (EM-ascension, no innate HP% → the ratio is
 * exactly 1 + Σ weapon-HP%/100). Toggle-off pins that the passive is gated (ratio 1.0); both refine
 * endpoints pin the scaling. The Moonsign ×2 (≥MS2) is a deferred team/context effect (not modeled).
 *
 * Values 2-witness-confirmed (Amber affix 111433 "Solemn Silence" HP 16→32% == GCSim
 * sword/serenityscall hppBuff=0.12+0.04r).
 */

import { describe, it, expect } from "vitest";
import { nahida } from "../characters/nahida.js";
import { serenitysCall } from "../weapons/serenitys-call.js";
import { LEVELS, TALENTS, reconstructSettings, reconstructPort } from "./_reconstruct.js";

const ENEMY = { level: 90, resistance: 10 } as const;
const STAT_BLOCK = { atk_base: 2000, hp_base: 10000 } as const;

function hpRatio(toggles: Record<string, boolean>, refine: number): number {
  const settings = reconstructSettings({ charToggles: {}, setToggles: {}, passiveToggles: toggles, constellation: 0, refine });
  const common = {
    char: nahida, weaponStatTable: serenitysCall.statTable, statBlock: STAT_BLOCK, settings,
    passiveOn: true, artifactSets: {}, setRegistry: {}, levels: LEVELS, talents: TALENTS, enemy: ENEMY,
  } as const;
  const full = reconstructPort({ ...common, weapon: serenitysCall });
  const stripped = reconstructPort({ ...common, weapon: { ...serenitysCall, conditions: [] } });
  const hp = (r: typeof full): number => ((r.context.stats as Record<string, number | undefined>)["hp_total"]) ?? 0;
  return hp(full) / hp(stripped);
}

describe("Serenity's Call — Solemn Silence (HP% on reaction)", () => {
  it("toggle off → no HP% (ratio 1.0)", () => {
    expect(hpRatio({}, 5)).toBeCloseTo(1.0, 6);
  });
  it("Max HP +16% (R1) / +32% (R5)", () => {
    expect(hpRatio({ weapon_solemn_silence: true }, 1)).toBeCloseTo(1.16, 4);
    expect(hpRatio({ weapon_solemn_silence: true }, 5)).toBeCloseTo(1.32, 4);
  });
});
