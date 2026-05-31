/**
 * Heart of Depth — artifact set port.
 *
 * 2pc: +15% Hydro DMG (always-on once 2 pieces are equipped).
 * 4pc: after using an Elemental Skill, Normal and Charged Attack DMG +30% for 15s.
 *
 * Both bonuses are ENTIRELY in the per-set `setBonus` array — there is no global
 * Buffs/Artifacts.js entry for Heart of Depth (unlike Noblesse/Deepwood).
 *
 * The 4pc carries a single boolean condition gated on `set.heart_of_depth_4`
 * (HeartofDepth.js:29-39): fires only when the post-skill buff toggle is active,
 * granting +30% Normal Attack DMG and +30% Charged Attack DMG simultaneously.
 *
 * With pieces=2 (no toggle): +15% Hydro DMG only.
 * With pieces=4 + toggle ON: +15% Hydro DMG (2pc) + +30% Normal + +30% Charged (4pc).
 *
 * Note: `goodId` uses "HeartofDepth" (lowercase 'o') to match the oracle's registry key
 * and build-configs.mjs `equipSet` field; the raw source has `goodId: 'HeartOfDepth'`
 * (capital O) but the oracle manifest and all fixture config files use "HeartofDepth".
 *
 * Verified against:
 *   - set-4pc/tartaglia.json (pieces=4, toggle=true): normal/charged hits scale by
 *     +30% normal+charged vs set-2pc baseline; hydro skill/burst unchanged.
 *   - set-2pc/tartaglia.json (pieces=2, NO toggle): only the 2pc hydro bonus applies;
 *     skill.activation_dmg and burst.burst_dmg identical in both fixtures, proving
 *     the 4pc tier is gated out at 2 pieces.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/HeartofDepth.js:5-43 (setBonus 2pc/4pc)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const heartOfDepth: DbObjectArtifactSet = {
  name: "artifact_set.heart_of_depth",
  goodId: "HeartofDepth",
  bonus: {
    // 2pc — Hydro DMG +15% (HeartofDepth.js:17-24).
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.heart_of_depth_2",
          stats: { dmg_hydro: 15 },
        },
      ],
    },
    // 4pc — after Elemental Skill: Normal DMG +30% + Charged DMG +30%
    // gated on boolean toggle (HeartofDepth.js:29-39).
    4: {
      conditions: [
        {
          type: "boolean",
          name: "set.heart_of_depth_4",
          title: "set_bonus.heart_of_depth_4",
          stats: { dmg_normal: 30, dmg_charged: 30 },
        },
      ],
    },
  },
};
