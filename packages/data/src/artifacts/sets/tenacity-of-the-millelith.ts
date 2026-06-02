/**
 * Tenacity of the Millelith — artifact set port. BIND.
 *
 * 2pc: HP% +20 (always-on static once 2 pieces equipped).
 * 4pc: after the wearer's Skill hits a foe, all party members gain ATK% +20 and
 *      Shield Strength +30 for 3s. The per-set 4pc toggle (`set.tenacity_of_the_millelith_4`)
 *      carries only `text_percent: 30` and `text_percent2: 20` (display markers, numeric
 *      no-ops). The real shield:30 + atk_percent:20 lives in the global artifact-buffs
 *      (raw/.../db/Buffs/Artifacts.js:217-232), gated by:
 *          Or( And( boolean set.tenacity_of_the_millelith_4, piecesCount TenacityofMillelith>=4 ),
 *              boolean set_other.tenacity_of_the_millelith_4 )
 *
 * KEY DISTINCTION:
 *   - `goodId` = "TenacityOfTheMillelith"  (capital O, capital T, capital M — her ArtifactSet.goodId)
 *   - `setName` in pieces-count = "TenacityofMillelith"  (lowercase "of" — her ArtifactSet.name key)
 * Confirmed: raw Buffs/Artifacts.js:226 uses "TenacityofMillelith" for the PiecesCount gate.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/TenacityofMillelith.js (setBonus 2pc/4pc)
 *   raw/genshin_calc_pub/src/js/db/Buffs/Artifacts.js:217-232 (shield:30 + atk_percent:20 + Or gate)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const tenacityOfTheMillelith: DbObjectArtifactSet = {
  name: "artifact_set.tenacity_of_the_millelith",
  goodId: "TenacityofMillelith",
  bonus: {
    // 2pc — HP% +20 (TenacityofMillelith.js:35-44).
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.tenacity_of_the_millelith_2",
          stats: { hp_percent: 20 },
        },
      ],
    },
    // 4pc — Or-gated shield:30 + atk_percent:20 from Buffs/Artifacts.js:217-232.
    // piecesCount setName = "TenacityofMillelith" (lowercase "of" — her ArtifactSet.name),
    // distinct from the goodId "TenacityOfTheMillelith".
    4: {
      conditions: [
        {
          type: "static",
          stats: { shield: 30, atk_percent: 20 },
          condition: {
            type: "or",
            items: [
              {
                type: "and",
                items: [
                  { type: "boolean", name: "set.tenacity_of_the_millelith_4" },
                  { type: "pieces-count", setName: "TenacityofMillelith", count: 4 },
                ],
              },
              { type: "boolean", name: "set_other.tenacity_of_the_millelith_4" },
            ],
          },
        },
      ],
    },
  },
};
