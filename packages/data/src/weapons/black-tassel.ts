/**
 * Black Tassel — 3★ Polearm (NOVEL hand-port; ConditionBooleanEnemyType gate).
 *
 * Passive "Bane of the Soft-Winged":
 *   - DMG vs Slimes +40/50/60/70/80% (refine-scaled).
 *   - Gated by `ConditionBooleanEnemyType({types:['slime']})`.
 *   - The oracle NEVER injects `enemy_type` into settings → this gate is ALWAYS INERT
 *     in v5.8 fixtures. The hu_tao rep fixture confirms crit_rate stays at 10 (base).
 *
 * ConditionStaticRefine: always-active (static) if gate passes; gate = enemy-type slime.
 * Since enemy_type is never set, gate never passes → dmg_all bonus is never applied.
 *
 * serializeId: 82.
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Polearm/BlackTassel.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Boolean/EnemyType.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Static/Refine.js
 */

import type { DbObjectWeapon } from "@genshin/types";
import { BlackTasselStatTable } from "../generated/weaponStatTables.js";

export const blackTassel: DbObjectWeapon = {
  name: "black_tassel",
  serializeId: 82,
  gameId: 13303,
  rarity: 3,
  weapon: "polearm",
  statTable: BlackTasselStatTable,
  conditions: [
    // DMG vs Slimes: refine-scaled 40/50/60/70/80%, gated on enemy type = slime.
    // ALWAYS INERT in v5.8 oracle (enemy_type never injected → gate never active).
    {
      type: "refine",
      title: "talent_name.weapon_black_tassel",
      description: "talent_descr.weapon_black_tassel",
      refinementStats: [
        { dmg_all: 40 }, // R1
        { dmg_all: 50 }, // R2
        { dmg_all: 60 }, // R3
        { dmg_all: 70 }, // R4
        { dmg_all: 80 }, // R5
      ],
      condition: {
        type: "enemy-type",
        types: ["slime"],
      },
    },
  ],
};
