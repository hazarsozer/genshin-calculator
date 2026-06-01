/**
 * Deepwood Memories — artifact set port.
 *
 * 2pc: +15% Dendro DMG (always-on once 2 pieces are equipped).
 * 4pc: after Dendro attacks/skills hit, the target's Dendro RES is reduced by 30%
 *      for 8s.
 *
 * RAW SOURCE SPLIT (same shape as Noblesse): the per-set 4pc condition
 * (raw/.../db/Artifacts/Set/DeepwoodMemories.js) carries only `text_percent: 30`
 * (a UI display marker). The REAL `-30%` Dendro RES shred lives in the global
 * artifact-buffs object (raw/.../db/Buffs/Artifacts.js:247-261), gated by:
 *     Or( And( boolean set.deepwood_memories_4, piecesCount DeepwoodMemories>=4 ),
 *         boolean set_other.deepwood_memories_4 )
 * We fold it into this set's 4pc tier. The shred is a RAW negative percent
 * (`enemy_res_dendro: -30`); buildStats folds it into the base enemy resistance, and
 * the engine's piecewise resistance multiplier handles the now-negative RES. Verified
 * to 5 dp against the oracle set-4pc fixture (nahida.json: Dendro hits ×1.10/0.90 from
 * the shred alone, reaction.rupture ×1.2222).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/DeepwoodMemories.js:14-42 (setBonus 2pc/4pc)
 *   raw/genshin_calc_pub/src/js/db/Buffs/Artifacts.js:233-261 (the -30% dendro RES + self/team gate)
 *   wiki/concepts/res-multiplier.md (piecewise resistance, negative branch)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const deepwoodMemories: DbObjectArtifactSet = {
  name: "artifact_set.deepwood_memories",
  goodId: "DeepwoodMemories",
  bonus: {
    // 2pc — Dendro DMG +15% (DeepwoodMemories.js:16-26).
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.deepwood_memories_2",
          stats: { dmg_dendro: 15 },
        },
      ],
    },
    // 4pc — the per-set toggle's display marker (numeric no-op) + the global Buffs
    // -30% Dendro RES shred, gated self-4pc OR team.
    4: {
      conditions: [
        {
          type: "boolean",
          name: "set.deepwood_memories_4",
          title: "set_bonus.deepwood_memories_4",
          stats: { text_percent: 30 },
        },
        {
          type: "static",
          stats: { enemy_res_dendro: -30 },
          condition: {
            type: "or",
            items: [
              {
                type: "and",
                items: [
                  { type: "boolean", name: "set.deepwood_memories_4" },
                  { type: "pieces-count", setName: "DeepwoodMemories", count: 4 },
                ],
              },
              { type: "boolean", name: "set_other.deepwood_memories_4" },
            ],
          },
        },
      ],
    },
  },
};
