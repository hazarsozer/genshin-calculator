/**
 * Thundersoother — artifact set port.
 *
 * 2pc: Electro RES +40% (always-on once 2 pieces are equipped).
 * 4pc: DMG +35% vs Electro-afflicted enemies (ConditionEnemyStatus gate).
 *
 * The 4pc `dmg_all: 35` is gated by `ConditionEnemyStatus({status: ['electro']})`.
 * In every v5.8 oracle fixture the enemy status is unset → gate is off → the bonus
 * is inert. The port is faithful; the engine will apply it when the gate fires.
 *
 * goodId: "Thundersoother" (manifest key from tests/golden/fixtures/sets-4pc/_manifest.json).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/Thundersoother.js:16-53
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const thundersoother: DbObjectArtifactSet = {
  name: "artifact_set.thundersoother",
  goodId: "Thundersoother",
  bonus: {
    // 2pc — Electro RES +40% (Thundersoother.js:16-25).
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.thundersoother_2",
          stats: { res_electro: 40 },
        },
      ],
    },
    // 4pc — DMG +35% vs Electro enemies (Thundersoother.js:27-44).
    // Gated by enemy-status (inert in v5.8 oracle; no status set → gate off).
    4: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.thundersoother_4",
          stats: { dmg_all: 35 },
          condition: { type: "enemy-status", statuses: ["electro"] },
        },
      ],
    },
  },
};
