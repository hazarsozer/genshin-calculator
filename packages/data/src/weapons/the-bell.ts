/**
 * The Bell — 4★ Claymore
 *
 * Source: raw/genshin_calc_pub/src/js/db/Weapon/Claymore/Bell.js
 *
 * Passive: "Rebellious Guardian"
 *   Static (refine-scaled, display only): HP shield absorb +20/23/26/29/32% — ConditionStaticRefine
 *     (text_percent_hp is a display stat; the damage engine ignores it — stat-only gate)
 *   Toggle (refine-scaled): all DMG +12/15/18/21/24% — ConditionBooleanRefine
 *
 * The raw Bell.js also carries a FeatureShield (bell_shield) — a non-damage shield OUTPUT
 * (max-HP-scaled, refine-leveled), now modelled via `output: {kind:"shield"}` (P3.5.3). It is
 * the canonical claymore in the oracle build, so every claymore char dumps `weapon.bell_shield`;
 * the outputCoverage harness compiles the equipped weapon's features to reproduce it.
 *
 * Settings key: `weapon_bell` (boolean toggle)
 * serializeId: 71 (from raw DbObjectWeapon.serializeId)
 */

import type {
  DbObjectWeapon,
  ConditionStaticRefine,
  ConditionBooleanRefine,
  Feature,
  TalentTable,
} from "@genshin/types";
import { BellStatTable } from "../generated/weaponStatTables.js";

/** Refine-indexed value table — `getValue(refine)` returns `values[refine-1]` (R1 default). */
function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[refine - 1] ?? values[0]! };
}

// Source: Bell.js:19-25 — ConditionStaticRefine, StatTable('text_percent_hp', [20, 23, 26, 29, 32])
// text_percent_hp is display-only; engine ignores unknown stat keys.
const shieldDisplayPassive: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_rebellious_guardian",
  description: "talent_descr.weapon_rebellious_guardian_passive",
  refinementStats: [
    { text_percent_hp: 20 }, // R1
    { text_percent_hp: 23 }, // R2
    { text_percent_hp: 26 }, // R3
    { text_percent_hp: 29 }, // R4
    { text_percent_hp: 32 }, // R5
  ],
};

// Source: Bell.js:26-32 — ConditionBooleanRefine, StatTable('dmg_all', [12, 15, 18, 21, 24])
const togglePassive: ConditionBooleanRefine = {
  type: "boolean-refine",
  name: "weapon_bell",
  serializeId: 1,
  title: "talent_name.weapon_rebellious_guardian",
  description: "talent_descr.weapon_rebellious_guardian",
  refinementStats: [
    { dmg_all: 12 }, // R1
    { dmg_all: 15 }, // R2
    { dmg_all: 18 }, // R3
    { dmg_all: 21 }, // R4
    { dmg_all: 24 }, // R5
  ],
};

// Source: Bell.js:36-48 — FeatureShield('bell_shield'), FeatureMultiplier scaling 'hp*'
// (max HP total), leveling weapon_refine, values [20,23,26,29,32] (% of max HP). The
// shield-strength bonus (`shield`) multiplies it; add_shield_element is off in the base dump.
const bellShield: Feature = {
  name: "bell_shield",
  category: "weapon",
  output: { kind: "shield" },
  multipliers: [
    { scaling: "hp", leveling: "weapon_refine", values: refineValueTable([20, 23, 26, 29, 32]) },
  ],
};

export const theBell: DbObjectWeapon = {
  name: "the_bell",
  serializeId: 71,
  gameId: 12402,
  rarity: 4,
  weapon: "claymore",
  // Reference the generated stat table by key — never re-transcribe values.
  statTable: BellStatTable,
  conditions: [shieldDisplayPassive, togglePassive],
  features: [bellShield],
};
