/**
 * Marechaussee Hunter — artifact set port.
 *
 * 2pc: Normal ATK DMG +15%, Charged ATK DMG +15% (always-on once 2 pieces equipped).
 * 4pc: After the wearer's HP increases/decreases, CRIT Rate +12% for 5s.
 *      Maximum 3 stacks. The stacks condition contributes +12 crit_rate per stack
 *      (scaled by getStackCount); at max 3 stacks: +36% CRIT Rate.
 *
 * The 4pc is a PURE per-set `setBonus` stacks condition — there is no entry in the
 * global Buffs/Artifacts.js for this set. The stacks are a flat per-stack bag
 * (`StatTable('crit_rate', [12, 24, 36])` at level 1 → getValue(1) = 12, × stacksCnt):
 * our `ConditionStacks` with `stats: { crit_rate: 12 }` + `maxStacks: 3` replicates
 * this exactly (conditionStats returns scaleBag({crit_rate:12}, count)).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/MarechausseeHunter.js:15-46
 *   raw/genshin_calc_pub/src/js/classes/Condition/Stacks.js (getStats × stacksCnt)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const marechausseeHunter: DbObjectArtifactSet = {
  name: "artifact_set.marechaussee_hunter",
  goodId: "MarechausseeHunter",
  bonus: {
    // 2pc — Normal ATK DMG +15%, Charged ATK DMG +15% (MarechausseeHunter.js:17-28).
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.marechaussee_hunter_2",
          stats: {
            dmg_normal: 15,
            dmg_charged: 15,
          },
        },
      ],
    },
    // 4pc — CRIT Rate +12% per stack (max 3) on HP change (MarechausseeHunter.js:31-44).
    // StatTable('crit_rate', [12, 24, 36]): getValue(level=1) = 12 → 12 per stack.
    4: {
      conditions: [
        {
          type: "stacks",
          name: "set.marechaussee_hunter_4",
          title: "set_bonus.marechaussee_hunter_4",
          maxStacks: 3,
          // Flat per-stack bag (×getStackCount): her StatTable('crit_rate', [12]).
          stats: { crit_rate: 12 },
        },
      ],
    },
  },
};
