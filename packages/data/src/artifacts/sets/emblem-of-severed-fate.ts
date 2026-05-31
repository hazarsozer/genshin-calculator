/**
 * Emblem of Severed Fate — artifact set port.
 *
 * 2pc: Energy Recharge +20% (always-on once 2 pieces equipped).
 * 4pc: Increases Elemental Burst DMG by 25% of Energy Recharge. A maximum of
 *      75% bonus DMG can be obtained in this way. The 4pc `setBonus` entry in raw
 *      carries only `text_percent: 25, text_percent_max: 75` (UI display markers —
 *      numeric no-ops); the REAL ER→Burst-DMG fold lives in a set-level `postEffect`
 *      (`PostEffectStatsRecharge`), which reads `getTotal('recharge')` × 25%, capped
 *      at 75 (raw percent), gated by ConditionBooleanPiecesCount(EmblemOfSeveredFate, 4).
 *
 * SET-LEVEL POSTEFFECT PATH (the calibration's key test):
 *   `postEffects: [{ fromStat: 'recharge', toStat: 'dmg_burst', ratio: 0.25, capValue: 75,
 *     conditions: [{ type: 'pieces-count', setName: 'EmblemOfSeveredFate', count: 4 }] }]`
 *   At canonical-build ER 252 (100 base + 132 weapon/char + 20 from 2pc):
 *     bonus = min(0.25 × 252, 75) = min(63, 75) = 63 → dmg_burst += 63 (raw percent).
 *   buildStats emits dmg_burst as a fraction (÷100), so +0.63 to the Burst DMG fraction.
 *   Verified vs set-4pc/raiden_shogun.json: baal_musou_no_hitotachi_dmg 19071 (4pc) vs
 *   14925 (2pc only) — a ratio that reflects the +63 dmg_burst contribution.
 *
 * The `text_percent` markers are preserved verbatim (present in her data; engine ignores them
 * as they are not in any emitted key list — `text_percent` / `text_percent_max` contribute 0).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/EmblemofSeveredFate.js:8-56
 *   raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/Recharge.js:4-8
 *   raw/genshin_calc_pub/src/js/classes/PostEffect/Stats.js:32-34 (statCap → /100 for percent)
 *   raw/genshin_calc_pub/src/js/classes/ArtifactSet.js:18,100-102 (getPostEffects)
 *   raw/genshin_calc_pub/src/js/classes/Condition/Boolean/PiecesCount.js:10-17
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const emblemOfSeveredFate: DbObjectArtifactSet = {
  name: "artifact_set.emblem_of_severed_fate",
  goodId: "EmblemOfSeveredFate",
  bonus: {
    // 2pc — Energy Recharge +20% (EmblemofSeveredFate.js:19-28).
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.emblem_of_severed_fate_2",
          stats: { recharge: 20 },
        },
      ],
    },
    // 4pc — display markers only; the real DMG bonus is the set-level postEffect below
    // (EmblemofSeveredFate.js:31-42). text_percent / text_percent_max are UI-only,
    // not in any buildStats emit list → numeric no-ops.
    4: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.emblem_of_severed_fate_4",
          stats: {
            text_percent: 25,
            text_percent_max: 75,
          },
        },
      ],
    },
  },
  // Set-level post-effect: Burst DMG += 25% of total Energy Recharge, capped at 75%
  // (EmblemofSeveredFate.js:44-55; PostEffectStatsRecharge.js:4-8).
  // `fromStat: 'recharge'` reads raw.getTotal('recharge') (base + flat additions, e.g. 252).
  // `ratio: 0.25` mirrors her StatTable('dmg_burst', [25]) → getValue(1)=25 → /100=0.25
  //   (PostEffectStats.getTree: isPercent('dmg_burst') → value /= 100, statMaxValue /= 100).
  // `capValue: 75` mirrors her StatTable('', [75]) → getValue(1)=75 → /100=0.75 as a cap
  //   on the fraction, but since our toPostEffect writes RAW percents into the Stats bag and
  //   buildStats emits dmg_burst as fraction (÷100) at emit time, we use capValue: 75 to cap
  //   the RAW percent bonus (matching her engine's `min(0.25×recharge, 0.75)×100` = 75 raw).
  // Gated by ConditionBooleanPiecesCount: active only when pieces >= 4.
  postEffects: [
    {
      fromStat: "recharge",
      toStat: "dmg_burst",
      ratio: 0.25,
      capValue: 75,
      conditions: [
        {
          type: "pieces-count",
          setName: "EmblemOfSeveredFate",
          count: 4,
        },
      ],
    },
  ],
};
