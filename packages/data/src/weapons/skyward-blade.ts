/**
 * Skyward Blade — 5★ Sword (hand-port; weapon FeatureDamage).
 *
 * Passive "Sky-Piercing Fang":
 *   - Always-on: CRIT Rate +4/5/6/7/8% (ConditionStaticRefine, refine-scaled).
 *   - Toggle (ConditionBooleanRefine "weapon_skyward_blade"): ATK Speed Normal +10%,
 *     Move Speed +10% (both constant across refines; single-element StatTable).
 *     The third stat `text_percent` [20,25,30,35,40] is a UI marker → dropped.
 *     The boolean is user-toggled (default OFF in the golden fixture); included here
 *     so the UI can expose it — the engine gates it on ctx.weapon_skyward_blade.
 *   - Proc: Physical AoE normal hits = 20/25/30/35/40% of ATK (REFINE-SCALED).
 *     Raw StatTable key: 'skyward_blade_dmg'. Fixture: weapon.skyward_blade_dmg.
 *     r1 normal=199.0, r5 normal=398.0 → scaled (2× at R5 vs R1).
 *     NOTE: the proc's condition in raw is COMMENTED OUT:
 *       // condition: new ConditionBooleanRefine({name: 'weapon_skyward_blade'})
 *     → the proc fires unconditionally (always-on in the engine), not toggle-gated.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Sword/SkywardBlade.js
 *   tests/golden/fixtures/weapons-r1/skyward_blade.json
 *   tests/golden/fixtures/weapons-r5/skyward_blade.json
 */

import type {
  ConditionBooleanRefine,
  ConditionStaticRefine,
  DbObjectWeapon,
  Feature,
  TalentTable,
} from "@genshin/types";
import { SkywardBladeStatTable } from "../generated/weaponStatTables.js";

function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[Math.min(refine, values.length) - 1] ?? 0 };
}

// Always-on: CRIT Rate +4/5/6/7/8% (SkywardBlade.js:16-21).
const critRatePassive: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_skyward_blade",
  description: "talent_descr.bonus_crit_rate",
  refinementStats: [
    { crit_rate: 4 }, // R1
    { crit_rate: 5 }, // R2
    { crit_rate: 6 }, // R3
    { crit_rate: 7 }, // R4
    { crit_rate: 8 }, // R5
  ],
};

// Toggle: ATK Speed Normal +10%, Move Speed +10% (constant at all refines).
// text_percent [20,25,30,35,40] is UI-only → omitted (brief: drop text_* stats).
const togglePassive: ConditionBooleanRefine = {
  type: "boolean-refine",
  name: "weapon_skyward_blade",
  serializeId: 1,
  title: "talent_name.weapon_skyward_blade",
  description: "talent_descr.weapon_skyward_blade",
  refinementStats: [
    { atk_speed_normal: 10, move_speed: 10 }, // R1
    { atk_speed_normal: 10, move_speed: 10 }, // R2
    { atk_speed_normal: 10, move_speed: 10 }, // R3
    { atk_speed_normal: 10, move_speed: 10 }, // R4
    { atk_speed_normal: 10, move_speed: 10 }, // R5
  ],
};

// Physical normal-hit proc: 20/25/30/35/40% of ATK, REFINE-SCALED.
// Proc is unconditional (condition was commented out in raw source).
// Fixture: weapon.skyward_blade_dmg, r1 normal=199.0, r5 normal=398.0.
const hitProc: Feature = {
  name: "skyward_blade_dmg",
  category: "weapon",
  element: "physical",
  multipliers: [
    {
      leveling: "weapon_refine",
      values: refineValueTable([20, 25, 30, 35, 40]),
    },
  ],
};

export const skywardBlade: DbObjectWeapon = {
  name: "skyward_blade",
  serializeId: 19,
  gameId: 11502,
  rarity: 5,
  weapon: "sword",
  statTable: SkywardBladeStatTable,
  conditions: [critRatePassive, togglePassive],
  features: [hitProc],
};
