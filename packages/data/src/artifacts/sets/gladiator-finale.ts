/**
 * Gladiator's Finale — artifact set port.
 *
 * 2pc: ATK +18% (always-on once 2 pieces are equipped).
 * 4pc: Normal Attack DMG +35% — gated by weapon type (sword, claymore, polearm only).
 *
 * Both bonuses are ENTIRELY in the per-set `setBonus` array — there is no global
 * Buffs/Artifacts.js entry for Gladiator's Finale.
 *
 * The 4pc carries a single static condition that is only active when the wearer
 * uses a sword, claymore, or polearm (GladiatorFinale.js:36-44): the raw
 * `subConditions: [ConditionBooleanWeaponType({types:['sword','claymore','polearm']})]`
 * is modelled here as a `.condition` gate (the port pattern).
 *
 * With pieces=4 + claymore (e.g. Itto): 2pc(+18% ATK) + 4pc(+35% Normal DMG).
 * With pieces=4 + bow or catalyst: 2pc(+18% ATK) only — 4pc gate fails.
 *
 * Note: `goodId` is "GladiatorFinale" (matching the oracle manifest and
 * build-configs.mjs `equipSet` field). The raw source uses "GladiatorsFinale"
 * (with a trailing 's') — same divergence pattern as HeartofDepth/CrimsonWitch.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/GladiatorFinale.js:18-44 (setBonus 2pc/4pc)
 *   raw/genshin_calc_pub/src/js/classes/Condition/Boolean/WeaponType.js (weapon-type gate)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const gladiatorFinale: DbObjectArtifactSet = {
  name: "artifact_set.gladiators_finale",
  goodId: "GladiatorFinale",
  bonus: {
    // 2pc — ATK +18% (GladiatorFinale.js:18-25).
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.gladiators_finale_2",
          stats: { atk_percent: 18 },
        },
      ],
    },
    // 4pc — Normal Attack DMG +35%, weapon-type gated (GladiatorFinale.js:27-44).
    // The raw subConditions is modelled as `.condition` (the port pattern).
    4: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.gladiators_finale_4",
          stats: { dmg_normal: 35 },
          condition: {
            type: "weapon-type",
            types: ["sword", "claymore", "polearm"],
          },
        },
      ],
    },
  },
};
