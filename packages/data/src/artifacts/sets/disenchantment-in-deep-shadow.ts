/**
 * Disenchantment in Deep Shadow — artifact set port (v6.6).
 *
 * 2pc: ATK +18% (always-on once 2 pieces are equipped).
 * 4pc: Superconduct reaction DMG +80% (always-on, no toggle).
 *      CRIT Rate +16% when the `state` condition is ON — QUARANTINED (on-hit
 *      conditional in GO's `total`, not a clean premod stat; no engine primitive;
 *      see tools/port/DISENCHANTMENT-QUARANTINE.md).
 *
 * ⚠ NOTE on `dmg_reaction_superconduct: 80`:
 *   The key lives in REACTION_BONUS_PERCENT_KEYS (/100 at emit — stored as raw 80,
 *   reads as +0.80 factor inside the reaction Σ). HOWEVER, Aspirine's engine has
 *   superconduct's reactionBonusKeys = ["dmg_reaction_overloaded"] (SuperConduct.js:11
 *   pushes the `_overloaded` key, not a `_superconduct` key — see reactions.ts:92).
 *   So this stat is emitted faithfully but no reaction output reads it; it is modeled
 *   but NOT damage-gateable (like enerRech_: correct stat, no damage channel). The
 *   Thundering Fury 4pc has the same situation (thundering-fury.ts:51). The GO gate
 *   validates only the 2pc ATK% +18% in ABSOLUTE matched-build mode.
 *
 * NOT in Aspirine's raw (v6.6 set; oracle frozen at v5.8). goodId = GOOD-format key
 * (GO folder name: DisenchantmentInDeepShadow), used directly as the gate/manifest key.
 *
 * Sources:
 *   /tmp/genshin-optimizer/libs/gi/sheets/src/Artifacts/DisenchantmentInDeepShadow/index.tsx
 *     (set2: greaterEq(artSet,2,0.18,atk_); set4: greaterEq(artSet,4,0.8,superconduct_dmg_);
 *      set4 state cond: equal(condState,'on',0.16,critRate_) in total — QUARANTINED)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const disenchantmentInDeepShadow: DbObjectArtifactSet = {
  name: "artifact_set.disenchantment_in_deep_shadow",
  goodId: "DisenchantmentInDeepShadow",
  bonus: {
    // 2pc — ATK +18% (GO: greaterEq(input.artSet[key], 2, 0.18, { path: 'atk_' })).
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.disenchantment_in_deep_shadow_2",
          stats: { atk_percent: 18 },
        },
      ],
    },
    // 4pc — Superconduct reaction DMG +80% (GO: greaterEq(artSet,4, 0.8, superconduct_dmg_)).
    // NOTE: dmg_reaction_superconduct is emitted (/100) but no reaction reads it — see above.
    // QUARANTINED: CRIT Rate +16% when `state` condition ON — on-hit conditional in `total`,
    // no engine primitive (see tools/port/DISENCHANTMENT-QUARANTINE.md).
    4: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.disenchantment_in_deep_shadow_4",
          stats: { dmg_reaction_superconduct: 80 },
        },
      ],
    },
  },
};
