/**
 * Predator — 4★ Bow (NOVEL hand-port; ConditionBooleanChar + non-refine stacks).
 *
 * Passive:
 *   1. `common.ps_network` boolean toggle (PlayStation-network gate — always INERT in
 *      standard builds unless user manually enables it).
 *   2. +66 ATK (ConditionStatic): active ONLY when char is "aloy" AND ps_network is on.
 *      Ganyu rep (not Aloy) → INERT (ConditionBooleanChar gate fails).
 *   3. `weapon_predator` stacks (max 2): dmg_normal+10, dmg_charged+10 per stack.
 *      NOT refine-scaled — raw uses `StatTable('dmg_normal',[10])` (single value array,
 *      no per-refine expansion). Gated by ps_network; stacks are ACTIVE if ps_network on.
 *      In the oracle Ganyu fixture: ps_network is off → stacks also INERT → crit_rate 10.
 *
 * The `and` gate on the ATK static: [boolean-char(aloy), boolean(ps_network)] — both
 * must be active. For ganyu rep neither fires, confirming INERT behavior.
 *
 * serializeId: 111.
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Bow/Predator.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Boolean/Char.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Stacks.js (no levelSetting → not refine-scaled)
 */

import type { DbObjectWeapon } from "@genshin/types";
import { PredatorStatTable } from "../generated/weaponStatTables.js";

export const predator: DbObjectWeapon = {
  name: "predator",
  serializeId: 111,
  gameId: 15415,
  rarity: 4,
  weapon: "bow",
  statTable: PredatorStatTable,
  conditions: [
    // PlayStation-network gate toggle (common.ps_network). No stats; controls others below.
    {
      type: "boolean",
      name: "common.ps_network",
      serializeId: 1,
      title: "talent_name.ps_network",
      description: "talent_descr.ps_network",
    },
    // +66 ATK: active only when char is Aloy AND ps_network is on.
    // Ganyu rep (not Aloy) → INERT (boolean-char gate fails).
    {
      type: "static",
      title: "weapon_name.predator",
      description: "talent_descr.weapon_predator_1",
      stats: { atk: 66 },
      condition: {
        type: "and",
        items: [
          { type: "boolean-char", chars: ["aloy"] },
          { type: "boolean", name: "common.ps_network" },
        ],
      },
    },
    // Normal/Charged DMG stacks (+10% each, max 2): NOT refine-scaled (single StatTable value).
    // Gated by ps_network; INERT in oracle (ps_network off for ganyu rep).
    {
      type: "stacks",
      name: "weapon_predator",
      serializeId: 2,
      title: "weapon_name.predator",
      description: "talent_descr.weapon_predator_2",
      maxStacks: 2,
      // No refinementStats — per-stack values are NOT refine-scaled (raw: StatTable([10])).
      // Engine reads stats directly when refinementStats is absent.
      stats: { dmg_normal: 10, dmg_charged: 10 },
      condition: {
        type: "boolean",
        name: "common.ps_network",
      },
    },
  ],
};
