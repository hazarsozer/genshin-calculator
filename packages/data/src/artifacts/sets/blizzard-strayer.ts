/**
 * Blizzard Strayer — artifact set port.
 *
 * 2pc: +15% Cryo DMG (always-on once 2 pieces are equipped).
 * 4pc: Two stacking crit_rate_enemy tiers (BlizzardStrayer.js:36-64).
 *
 * Tier 1 — crit_rate_enemy +20 when enemy has Cryo status:
 *   ConditionEnemyStatus({status: ['cryo']})  (BlizzardStrayer.js:44-48)
 *
 * Tier 2 — crit_rate_enemy +20 additionally when enemy is Frozen:
 *   ConditionEnemyStatus({status: ['cryo']}) AND ConditionBoolean({name: 'enemy_frozen'})
 *   (BlizzardStrayer.js:57-63)
 *   Frozen implies Cryo in her engine; both tiers fire → total +40 on frozen enemy.
 *
 * Oracle mapping:
 *   blizzard-strayer-cryo   → enemyStatus:"cryo", no enemy_frozen → only tier 1 fires (+20)
 *   blizzard-strayer-frozen → enemyStatus:"cryo" + settings:{enemy_frozen:1} → both fire (+40)
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/BlizzardStrayer.js:18-27 (2pc)
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/BlizzardStrayer.js:36-64 (4pc)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const blizzardStrayer: DbObjectArtifactSet = {
  name: "artifact_set.blizzard_strayer",
  goodId: "BlizzardStrayer",
  bonus: {
    // 2pc — Cryo DMG +15% (BlizzardStrayer.js:18-27).
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.blizzard_strayer_2",
          stats: { dmg_cryo: 15 },
        },
      ],
    },
    // 4pc — two stacking crit_rate_enemy tiers (BlizzardStrayer.js:36-64).
    4: {
      conditions: [
        // Tier 1: cryo-aura → +20 crit_rate_enemy (BlizzardStrayer.js:36-48).
        {
          type: "static",
          title: "set_bonus.blizzard_strayer_4",
          stats: { crit_rate_enemy: 20 },
          condition: { type: "enemy-status", statuses: ["cryo"] },
        },
        // Tier 2: frozen (cryo + frozen) → additional +20 crit_rate_enemy (BlizzardStrayer.js:49-64).
        {
          type: "static",
          title: "set_bonus.blizzard_strayer_4",
          stats: { crit_rate_enemy: 20 },
          condition: {
            type: "and",
            items: [
              { type: "enemy-status", statuses: ["cryo"] },
              { type: "boolean", name: "enemy_frozen" },
            ],
          },
        },
      ],
    },
  },
};
