/**
 * v6.x live weapons — GCSim-free regression lock (weapon analog of v6SetsGate.test.ts).
 *
 * Re-runs OUR PORT (no GCSim binary) for each gated v6.x weapon and asserts it reproduces
 * the frozen `ourRatio` from tools/oracle/_fixtures/<weapon>-gate.json. This is the in-suite
 * CI lock for the weapon PASSIVE itself: the armory fixtures (weapons-r1/r5) lock the stat
 * table on a solo non-reacting holder, so they do NOT exercise the EM-on-reaction passive —
 * this test does. Correctness vs GCSim is the dev-time `gate-live --self-test` gate; this is
 * the cheap golden that catches port/schema drift without the binary.
 *
 * Gate method (matches the gate-reps.mjs `<weapon>-gcsim` entries exactly): an electro holder
 * wears the weapon at R5 (passive ON → +120 EM), driven into a superconduct against a cryo
 * aura; the gated feature is `reaction.superconduct` in absolute mode (transformative: no ATK
 * denominator, so the value is purely the EM-scaled reaction). With the passive OFF the EM
 * drops to 0 and the superconduct falls ~47% — so the frozen value is load-bearing on the EM.
 *
 * Prospector's Shovel is the same shape with a DIFFERENT reaction: it grants a direct +EC DMG%
 * (not EM), so it gates `reaction.electrocharged` (a hydro applier + the electro holder's
 * continuous-electro skill → Electro-Charged) and the frozen value is load-bearing on that
 * bonus (passive off → ÷1.96).
 *
 * Blood-Soaked Ruins is again a direct reaction-DMG% (not EM), but on the LUNAR-CHARGED reaction:
 * Flins wears it R5 (weapon_mournful_tribute → dmg_reaction_lunarcharged +84%) and the gated feature
 * is `reaction.lunarcharged_contrubution` — his isolated lunar contributor, absolute mode, enemy L100
 * to match the rep (lunar reactions are DEF-ignored, so the level is immaterial). The frozen value is
 * load-bearing on that bonus (toggle off → ÷1.58). Its Requiem-of-Ruin crit_dmg channel is out of this
 * gate (crit-neutralized in the GCSim rep) — that channel is covered by bloodSoakedRuins.test.ts.
 *
 * Fixtures: tools/oracle/_fixtures/{snare-hook,master-key,prospectors-shovel,blood-soaked-ruins}-gate.json (frozen by --write).
 * Extend per v6 weapon: add the gate rep, `--write` its fixture, add a case here.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { fischl } from "../characters/fischl.js";
import { razor } from "../characters/razor.js";
import { flins } from "../characters/flins.js";
import { snareHook } from "../weapons/snare-hook.js";
import { masterKey } from "../weapons/masters-key.js";
import { prospectorsShovel } from "../weapons/prospectors-shovel.js";
import { bloodSoakedRuins } from "../weapons/blood-soaked-ruins.js";
import type { DbObjectChar, DbObjectWeapon } from "@genshin/types";
import {
  LEVELS,
  TALENTS,
  reconstructSettings,
  reconstructPort,
} from "./_reconstruct.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(__dirname, "../../../../tools/oracle/_fixtures");

// ── frozen fixture row type (shared with v6SetsGate.test.ts) ─────────────────
interface GateRow {
  rep: string;
  feature: string;
  ourRatio: number;
}

function loadFixture(name: string): GateRow[] {
  return JSON.parse(readFileSync(resolve(FIXTURES, name), "utf8")) as GateRow[];
}

// ── shared rep parameters (matches the gate-reps.mjs <weapon>-gcsim entries) ──
const ENEMY = { level: 90, resistance: 10 } as const;
const STAT_BLOCK = { atk_base: 2000 } as const;

/** Run our port for one weapon (passive ON, R5) and return its features map. */
function runPort(
  char: DbObjectChar,
  weapon: DbObjectWeapon,
  passiveToggleKey: string,
  enemy: { level: number; resistance: number } = ENEMY,
): Record<string, { normal: number }> {
  const settings = reconstructSettings({
    charToggles: {},
    setToggles: {},
    passiveToggles: { [passiveToggleKey]: true },
    constellation: 0,
    refine: 5,
  });

  const { compiled, context } = reconstructPort({
    char,
    weapon,
    weaponStatTable: weapon.statTable,
    statBlock: STAT_BLOCK,
    settings,
    passiveOn: true,
    artifactSets: {},
    setRegistry: {},
    levels: LEVELS,
    talents: TALENTS,
    enemy,
  });

  const features: Record<string, { normal: number }> = {};
  for (const [key, fn] of Object.entries(compiled)) {
    features[key] = fn(context) as { normal: number };
  }
  return features;
}

describe("v6.x weapon gate — port reproduces frozen ourRatio (GCSim-free regression lock)", () => {
  it("snare-hook: reaction.superconduct matches frozen fixture (absolute, R5 passive ON)", () => {
    const [row] = loadFixture("snare-hook-gate.json");
    const features = runPort(fischl, snareHook, "weapon_phantom_flash");
    const got = features[row!.feature]!.normal;
    expect(got).toBeCloseTo(row!.ourRatio, 6);
  });

  it("master-key: reaction.superconduct matches frozen fixture (absolute, R5 passive ON)", () => {
    const [row] = loadFixture("master-key-gate.json");
    const features = runPort(razor, masterKey, "weapon_fall_into_place");
    const got = features[row!.feature]!.normal;
    expect(got).toBeCloseTo(row!.ourRatio, 6);
  });

  // Prospector's Shovel gates a DIFFERENT reaction (Electro-Charged) and a DIRECT +EC DMG% (not EM):
  // Fischl wears it R5 (dmg_reaction_electrocharged +96%) → her EC reaction is 1.96× the unbuffed value.
  // Same GCSim-free reproduction; the frozen value is load-bearing on the +EC% (passive off → ÷1.96 → RED).
  it("prospectors-shovel: reaction.electrocharged matches frozen fixture (absolute, R5 passive ON)", () => {
    const [row] = loadFixture("prospectors-shovel-gate.json");
    const features = runPort(fischl, prospectorsShovel, "weapon_swift_and_sure");
    const got = features[row!.feature]!.normal;
    expect(got).toBeCloseTo(row!.ourRatio, 6);
  });

  // Blood-Soaked Ruins (Flins's signature) gates the Lunar-Charged REACTION + a DIRECT +LC DMG% (not EM):
  // Flins wears it R5 (weapon_mournful_tribute → dmg_reaction_lunarcharged +84%) → his lunarcharged
  // contribution is ~1.58× the unbuffed value (the +0.84 react term). Enemy L100 matches the gate rep
  // (lunar is DEF-ignored, so the level is immaterial, but kept faithful). Only the Mournful Tribute
  // (LC-DMG) toggle is on — the Requiem-of-Ruin crit_dmg channel is out of this gate's scope (crit
  // neutralized in the GCSim rep; the .normal field read here is the non-crit value either way), covered
  // by bloodSoakedRuins.test.ts. Frozen value load-bearing on the +LC% (toggle off → react 0 → ÷1.58 → RED).
  it("blood-soaked-ruins: reaction.lunarcharged_contrubution matches frozen fixture (absolute, R5 passive ON)", () => {
    const [row] = loadFixture("blood-soaked-ruins-gate.json");
    const features = runPort(flins, bloodSoakedRuins, "weapon_mournful_tribute", { level: 100, resistance: 10 });
    const got = features[row!.feature]!.normal;
    expect(got).toBeCloseTo(row!.ourRatio, 6);
  });
});
