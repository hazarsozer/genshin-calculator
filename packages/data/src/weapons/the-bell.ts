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
 * The raw Bell.js also carries a FeatureShield (bell_shield) which is a display shield value,
 * not a damage proc. DbObjectWeapon.features is `unknown[]` and unresolved by the engine at this
 * phase — omitted here; does not affect damage output.
 *
 * Settings key: `weapon_bell` (boolean toggle)
 * serializeId: 71 (from raw DbObjectWeapon.serializeId)
 *
 * Stat-only passive — no damage proc features.
 */

import type { DbObjectWeapon, ConditionStaticRefine, ConditionBooleanRefine } from "@genshin/types";
import { BellStatTable } from "../generated/weaponStatTables.js";

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

export const theBell: DbObjectWeapon = {
  name: "the_bell",
  serializeId: 71,
  gameId: 12402,
  rarity: 4,
  weapon: "claymore",
  // Reference the generated stat table by key — never re-transcribe values.
  statTable: BellStatTable,
  conditions: [shieldDisplayPassive, togglePassive],
};
