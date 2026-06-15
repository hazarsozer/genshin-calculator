/**
 * Rainbow Serpent's Rain Bow (4★ bow, v6.2) — "Astral Whispers" ATK% passive (B2 batch; added in review).
 *
 * weapon_astral_whispers (boolean-refine): ATK +28/35/42/49/56% for 8s after an off-field hit. Read
 * via the atk_total ratio full/stripped on Nahida (EM-ascension, no innate ATK% → ratio is exactly
 * 1 + weapon-ATK%/100). Toggle-off pins the gate (ratio 1.0); both refine endpoints pin the scaling.
 *
 * Values 2-witness-confirmed (Amber affix 115434 ATK 28→56% == GCSim bow/rainbow m[ATKP]=0.21+0.07r).
 */

import { describe, it, expect } from "vitest";
import { nahida } from "../characters/nahida.js";
import { rainbowSerpentsRainBow } from "../weapons/rainbow-serpents-rain-bow.js";
import { LEVELS, TALENTS, reconstructSettings, reconstructPort } from "./_reconstruct.js";

const ENEMY = { level: 90, resistance: 10 } as const;
const STAT_BLOCK = { atk_base: 2000 } as const;

function atkRatio(toggles: Record<string, boolean>, refine: number): number {
  const settings = reconstructSettings({ charToggles: {}, setToggles: {}, passiveToggles: toggles, constellation: 0, refine });
  const common = {
    char: nahida, weaponStatTable: rainbowSerpentsRainBow.statTable, statBlock: STAT_BLOCK, settings,
    passiveOn: true, artifactSets: {}, setRegistry: {}, levels: LEVELS, talents: TALENTS, enemy: ENEMY,
  } as const;
  const full = reconstructPort({ ...common, weapon: rainbowSerpentsRainBow });
  const stripped = reconstructPort({ ...common, weapon: { ...rainbowSerpentsRainBow, conditions: [] } });
  const atk = (r: typeof full): number => ((r.context.stats as Record<string, number | undefined>)["atk_total"]) ?? 0;
  return atk(full) / atk(stripped);
}

describe("Rainbow Serpent's Rain Bow — Astral Whispers (ATK%)", () => {
  it("toggle off → no ATK% (ratio 1.0)", () => {
    expect(atkRatio({}, 5)).toBeCloseTo(1.0, 6);
  });
  it("ATK +28% (R1) / +56% (R5)", () => {
    expect(atkRatio({ weapon_astral_whispers: true }, 1)).toBeCloseTo(1.28, 4);
    expect(atkRatio({ weapon_astral_whispers: true }, 5)).toBeCloseTo(1.56, 4);
  });
});
