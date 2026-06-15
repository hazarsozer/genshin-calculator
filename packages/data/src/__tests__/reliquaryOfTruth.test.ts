/**
 * Reliquary of Truth (5★ catalyst, v6.1, Nefer's signature) — "Essence of Falsity", SELF-only.
 *
 * Unlike Nightweaver's Looking Glass (B4 #1, an off-field TEAM buff), every Reliquary effect lands
 * on the WIELDER only — GCSim adds all stat mods to `char` with no c.Player.Chars() loop, and Secret
 * of Lies even guards on the equipper being on-field (reliquary.go:57). So this is the self-only
 * model: no weapon_other propagation, no party-aware test.
 *
 * Four conditions, all feeding existing golden-tested emit channels (PURE DATA port, no engine change):
 *   - CR passive (always-on ConditionStaticRefine): crit_rate +8/10/12/14/16% → crit_rate_total (/100).
 *   - weapon_secret_of_lies (boolean-refine, EM on Elemental Skill): mastery +80/100/120/140/160.
 *   - weapon_moon_of_truth  (boolean-refine, CD on Lunar-Bloom DMG): crit_dmg +24/30/36/42/48% → crit_dmg_total (/100).
 *   - Resonance (and-gated ConditionStaticRefine): when BOTH toggles are on, both effects gain +50%.
 *     Modeled as the EXTRA half (mastery +40-80, crit_dmg +12-24) auto-applied via
 *     condition: and[boolean weapon_secret_of_lies, boolean weapon_moon_of_truth]. This mirrors
 *     GCSim's AUTOMATIC ×1.5 (reliquary.go:65-67,93-95) — the synergy is not a user toggle.
 *
 * Each effect is isolated as full − stripped (the same weapon with its conditions removed) so the
 * holder's innate stats cancel. Both refine endpoints (R1, R5) are pinned, so the refine scaling AND
 * the /100 emit scale are load-bearing. The both-active case (EM 240 = 160 base + 80 synergy;
 * CRIT DMG 0.72 = 0.48 + 0.24) vs the single-toggle cases (base only) proves the synergy auto-gate.
 *
 * Values 2-witness-confirmed (no single source; see CLAUDE.md § Source-of-truth discipline):
 *   Project Amber (pinned): tools/port/_fixtures/ambr/weapon/14521.json
 *     affix["114521"] "Essence of Falsity": CR 8→16%, EM 80→160, CRIT DMG 24→48%, both ×1.5 (R1→R5).
 *   GCSim (cross-check): /tmp/gcsim/internal/weapons/catalyst/reliquary/reliquary.go
 *     m[CR]=0.06+0.02r; emBuff=60+20r (×1.5 if Moon active); cdBuff=0.18+0.06r (×1.5 if Secret active).
 */

import { describe, it, expect } from "vitest";
import { nahida } from "../characters/nahida.js";
import { reliquaryOfTruth } from "../weapons/reliquary-of-truth.js";
import { LEVELS, TALENTS, reconstructSettings, reconstructPort } from "./_reconstruct.js";

const ENEMY = { level: 90, resistance: 10 } as const;
const STAT_BLOCK = { atk_base: 2000 } as const;

/**
 * Reliquary's contribution to `key` with the given passive toggles enabled, isolated as
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
    char: nahida,
    weaponStatTable: reliquaryOfTruth.statTable,
    statBlock: STAT_BLOCK,
    settings,
    passiveOn: true,
    artifactSets: {},
    setRegistry: {},
    levels: LEVELS,
    talents: TALENTS,
    enemy: ENEMY,
  } as const;

  const full = reconstructPort({ ...common, weapon: reliquaryOfTruth });
  const stripped = reconstructPort({ ...common, weapon: { ...reliquaryOfTruth, conditions: [] } });

  const read = (r: typeof full): number =>
    ((r.context.stats as Record<string, number | undefined>)[key]) ?? 0;
  return read(full) - read(stripped);
}

const NONE = {};
const SECRET = { weapon_secret_of_lies: true };
const MOON = { weapon_moon_of_truth: true };
const BOTH = { weapon_secret_of_lies: true, weapon_moon_of_truth: true };

describe("Reliquary of Truth — Essence of Falsity (self-only)", () => {
  it("CR passive (always-on): CRIT Rate +8% (R1) / +16% (R5)", () => {
    expect(delta(NONE, "crit_rate_total", 1)).toBeCloseTo(0.08, 6);
    expect(delta(NONE, "crit_rate_total", 5)).toBeCloseTo(0.16, 6);
  });

  it("no toggles → no EM, no CRIT DMG, no synergy (only the always-on CR fires)", () => {
    // Pins that both boolean-refine toggles are OFF by default and the and-gated synergy stays
    // dark when neither is set — a toggle accidentally made always-on, or the synergy left ungated,
    // would surface here as a non-zero delta (most sensitive at R5).
    expect(delta(NONE, "mastery", 5)).toBeCloseTo(0, 6);
    expect(delta(NONE, "crit_dmg_total", 5)).toBeCloseTo(0, 6);
  });

  it("Secret of Lies (Elemental Skill): EM +80 (R1) / +160 (R5)", () => {
    expect(delta(SECRET, "mastery", 1)).toBeCloseTo(80, 6);
    expect(delta(SECRET, "mastery", 5)).toBeCloseTo(160, 6);
  });

  it("Moon of Truth (Lunar-Bloom DMG): CRIT DMG +24% (R1) / +48% (R5)", () => {
    expect(delta(MOON, "crit_dmg_total", 1)).toBeCloseTo(0.24, 6);
    expect(delta(MOON, "crit_dmg_total", 5)).toBeCloseTo(0.48, 6);
  });

  it("both active → both effects ×1.5, auto-gated: EM 120/240, CRIT DMG 36%/72%", () => {
    expect(delta(BOTH, "mastery", 1)).toBeCloseTo(120, 6);
    expect(delta(BOTH, "mastery", 5)).toBeCloseTo(240, 6);
    expect(delta(BOTH, "crit_dmg_total", 1)).toBeCloseTo(0.36, 6);
    expect(delta(BOTH, "crit_dmg_total", 5)).toBeCloseTo(0.72, 6);
  });
});
