/**
 * Lithic Spear — 4★ Polearm (NOVEL hand-port; ConditionLithic + ConditionStacks char-attribute).
 *
 * Passive "Lithic Axiom — Unity":
 *   - ConditionLithic (always-active settings-publisher): injects `weapon_lithic_stacks`
 *     = (wielder is Liyue ? 1 : 0). Rep is Hu Tao (Liyue) → publishes 1.
 *   - ConditionStacks keyed `weapon_lithic_stacks` (maxStacks 4): per-stack stats scale
 *     with weapon_refine — ATK%: 7/8/9/10/11 per stack; crit_rate: 3/4/5/6/7 per stack.
 *     With 1 stack (hu_tao Liyue rep) at R1: ATK%+7, crit_rate+3 → oracle crit_rate = 13.
 *     At R5: 1 stack × 7 = crit_rate+7 → oracle crit_rate = 17.
 *
 * Identical conditions to Lithic Blade; only weapon/serializeId/gameId differ.
 *
 * Fixture: hu_tao R1 → crit_rate 13 (10+3), R5 → crit_rate 17 (10+7). ACTIVE (1 stack).
 *
 * serializeId: 81.
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Polearm/LithicSpear.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Lithic.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Stacks/Setting.js
 */

import type { DbObjectWeapon } from "@genshin/types";
import { LithicSpearStatTable } from "../generated/weaponStatTables.js";

export const lithicSpear: DbObjectWeapon = {
  name: "lithic_spear",
  serializeId: 81,
  gameId: 13406,
  rarity: 4,
  weapon: "polearm",
  statTable: LithicSpearStatTable,
  conditions: [
    // Always-active publisher: emits weapon_lithic_stacks = (Liyue char ? 1 : 0).
    // Hu Tao (Liyue) → publishes 1 → 1 active stack.
    {
      type: "lithic",
    },
    // Stack consumer: reads weapon_lithic_stacks from settings (published above).
    // Per-stack stats scale with refine: ATK% 7/8/9/10/11, crit_rate 3/4/5/6/7.
    {
      type: "stacks",
      name: "weapon_lithic_stacks",
      serializeId: 1,
      title: "talent_name.weapon_lithic_axiome",
      description: "talent_descr.weapon_lithic_axiome",
      maxStacks: 4,
      refinementStats: [
        { atk_percent: 7, crit_rate: 3 }, // R1 per stack
        { atk_percent: 8, crit_rate: 4 }, // R2 per stack
        { atk_percent: 9, crit_rate: 5 }, // R3 per stack
        { atk_percent: 10, crit_rate: 6 }, // R4 per stack
        { atk_percent: 11, crit_rate: 7 }, // R5 per stack
      ],
    },
  ],
};
