/**
 * Tenacity of the Millelith — artifact set port. BIND.
 *
 * 2pc: HP% +20 (always-on static once 2 pieces equipped).
 * 4pc: after the wearer's Skill hits a foe, all party members gain ATK% +20 and
 *      Shield Strength +30 for 3s. The per-set 4pc toggle carries only `text_percent: 30`
 *      and `text_percent2: 20` (display markers, numeric no-ops). The real atk_percent:20
 *      lives ONCE in CHARACTER_CONDITIONS (characterConditions.ts), gated by
 *      OR(AND(set.tenacity_of_the_millelith_4, piecesCount TenacityofMillelith≥4),
 *         set_other.tenacity_of_the_millelith_4). Fires once.
 *
 * KEY DISTINCTION:
 *   - `goodId` = "TenacityofMillelith"  (lowercase "of" — her ArtifactSet.name key)
 *   - This matches the piecesCount setName in characterConditions.ts.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/TenacityofMillelith.js (setBonus 2pc/4pc)
 *   raw/genshin_calc_pub/src/js/db/Buffs/Artifacts.js:217-232 (atk_percent:20 + OR gate)
 *   packages/data/src/characterConditions.ts (setOtherTenacityOfTheMillelith4 — authoritative OR gate)
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
    // 4pc — no real stat here; the per-set toggle carries only display markers (numeric
    // no-ops). The +20% ATK lives in characterConditions.ts (setOtherTenacityOfTheMillelith4).
    4: {},
  },
};
