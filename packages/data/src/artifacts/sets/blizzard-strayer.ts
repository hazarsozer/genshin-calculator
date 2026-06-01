/**
 * Blizzard Strayer — artifact set port.
 *
 * 2pc: +15% Cryo DMG (always-on once 2 pieces are equipped).
 * 4pc: DEFERRED — see below.
 *
 * DEFERRED — enemy-status crit bonus (BlizzardStrayer.js:36-64):
 *   The 4pc grants crit_rate_enemy +20% when the enemy has Cryo status, plus an
 *   additional +20% if the enemy is Frozen. Both conditions are gated by
 *   ConditionEnemyStatus({status:['cryo']}) — the `common.enemy_status` setting.
 *   In every v5.8 oracle fixture the enemy status is not set (`setToggles:{}` /
 *   `common.enemy_status` absent), so both +20% bonuses are inert for all current
 *   golden tests — safe to defer.
 *   Needs: ConditionEnemyStatus primitive + enemy_frozen boolean in the engine.
 *
 * With 4 pieces + no enemy status (all v5.8 fixtures): only the 2pc Cryo DMG applies.
 * The 4pc tier is omitted from the bonus record (bonus[4] is optional per the type); the
 * engine only concats tiers present in the record, so omitting it is equivalent to an
 * empty conditions list and is the cleaner representation.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/BlizzardStrayer.js:18-27 (2pc)
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/BlizzardStrayer.js:36-64 (4pc — deferred)
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
    // 4pc — DEFERRED (BlizzardStrayer.js:36-64):
    //   crit_rate_enemy +20% when enemy has Cryo status (ConditionEnemyStatus),
    //   plus another +20% if enemy is Frozen (enemy_frozen boolean).
    //   Needs: ConditionEnemyStatus + enemy_frozen engine primitives.
    //   Inert in all v5.8 oracle fixtures (common.enemy_status not set in any fixture).
    //   bonus[4] is omitted; the engine only processes tiers present in the record.
  },
};
