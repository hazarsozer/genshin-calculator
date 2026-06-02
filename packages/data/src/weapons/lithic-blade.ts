/**
 * Lithic Blade — 4★ Claymore (NOVEL hand-port; ConditionLithic + ConditionStacks char-attribute).
 *
 * Passive "Lithic Axiom — Unity":
 *   - ConditionLithic (always-active settings-publisher): injects `weapon_lithic_stacks`
 *     = (wielder is Liyue ? 1 : 0). Rep is Eula (Mondstadt) → publishes 0.
 *   - ConditionStacks keyed `weapon_lithic_stacks` (maxStacks 4): per-stack stats scale
 *     with weapon_refine — ATK%: 7/8/9/10/11 per stack; crit_rate: 3/4/5/6/7 per stack.
 *     With 0 stacks (Eula rep) these are INERT; the stacks condition reads the setting
 *     that ConditionLithic published.
 *
 * The stacks condition uses the special `name: "weapon_lithic_stacks"` which is also the
 * key that ConditionLithic publishes — the downstream consumer of the settings-propagation.
 *
 * Fixture: eula R1 → crit_rate 10 (base, +0 stacks = inert); R5 → crit_rate 10 (same).
 *
 * serializeId: 67.
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Claymore/LithicBlade.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Lithic.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Stacks/Setting.js
 */

import type { DbObjectWeapon } from "@genshin/types";
import { LithicBladeStatTable } from "../generated/weaponStatTables.js";

export const lithicBlade: DbObjectWeapon = {
  name: "lithic_blade",
  serializeId: 67,
  gameId: 12410,
  rarity: 4,
  weapon: "claymore",
  statTable: LithicBladeStatTable,
  conditions: [
    // Always-active publisher: emits weapon_lithic_stacks = (Liyue char ? 1 : 0).
    // Eula (Mondstadt) → publishes 0; gate is INERT for non-Liyue reps.
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
