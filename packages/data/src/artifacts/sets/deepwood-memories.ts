/**
 * Deepwood Memories — artifact set port.
 *
 * 2pc: +15% Dendro DMG (always-on once 2 pieces are equipped).
 * 4pc: after Dendro attacks/skills hit, the target's Dendro RES is reduced by 30%
 *      for 8s.
 *
 * RAW SOURCE SPLIT: the per-set 4pc condition carries only `text_percent: 30`
 * (UI display marker). The REAL `-30%` Dendro RES shred lives ONCE in CHARACTER_CONDITIONS
 * (characterConditions.ts), gated by OR(AND(set.deepwood_memories_4, piecesCount DeepwoodMemories≥4),
 * set_other.deepwood_memories_4). That single global fires once whether the active char
 * wears the set or a teammate does.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/DeepwoodMemories.js:14-42 (setBonus 2pc/4pc)
 *   raw/genshin_calc_pub/src/js/db/Buffs/Artifacts.js:247-261 (the -30% dendro RES + OR gate)
 *   packages/data/src/characterConditions.ts (setOtherDeepwoodMemories4 — authoritative OR gate)
 *   wiki/game/mechanics/res-multiplier.md (piecewise resistance, negative branch)
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
    // 4pc — display toggle only (text_percent: numeric no-op, DeepwoodMemories.js:30-39).
    // The -30% Dendro RES shred lives in characterConditions.ts (setOtherDeepwoodMemories4).
    4: {
      conditions: [
        {
          type: "boolean",
          name: "set.deepwood_memories_4",
          title: "set_bonus.deepwood_memories_4",
          stats: { text_percent: 30 },
        },
      ],
    },
  },
};
