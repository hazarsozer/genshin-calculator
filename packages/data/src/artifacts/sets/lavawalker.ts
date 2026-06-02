/**
 * Lavawalker — artifact set port.
 *
 * 2pc: Pyro RES +40% (always-on once 2 pieces are equipped).
 * 4pc: DMG +35% vs Pyro-afflicted enemies (ConditionEnemyStatus gate).
 *
 * The 4pc `dmg_all: 35` is gated by `ConditionEnemyStatus({status: ['pyro']})`.
 * In every v5.8 oracle fixture the enemy status is unset → gate is off → the bonus
 * is inert. The port is faithful; the engine will apply it when the gate fires.
 *
 * goodId: "Lavawalker" (manifest key from tests/golden/fixtures/sets-4pc/_manifest.json).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/Lavawalker.js:16-55
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const lavawalker: DbObjectArtifactSet = {
  name: "artifact_set.lavawalker",
  goodId: "Lavawalker",
  bonus: {
    // 2pc — Pyro RES +40% (Lavawalker.js:16-26).
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.lavawalker_2",
          stats: { res_pyro: 40 },
        },
      ],
    },
    // 4pc — DMG +35% vs Pyro enemies (Lavawalker.js:27-45).
    // Gated by enemy-status (inert in v5.8 oracle; no status set → gate off).
    4: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.lavawalker_4",
          stats: { dmg_all: 35 },
          condition: { type: "enemy-status", statuses: ["pyro"] },
        },
      ],
    },
  },
};
