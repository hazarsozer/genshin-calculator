/**
 * A Day Carved from Rising Winds — artifact set port (v6.3).
 *
 * 2pc: ATK +18% (always-on once 2 pieces are equipped).
 * 4pc: ATK +25% when the toggle `set4` is ON (count≥4). Additionally, CRIT Rate +20%
 *      when `set4` is ON AND the holder isHexerei — QUARANTINED (isHexerei has no
 *      engine primitive; see tools/port/A-DAY-CARVED-QUARANTINE.md).
 *
 * With 4pc + toggle ON: 2pc(+18%) + 4pc(+25%) = +43% ATK total.
 *
 * NOT in Aspirine's raw (v6.3 set; oracle frozen at v5.8). goodId = GOOD-format key
 * (GO folder name: ADayCarvedFromRisingWinds), used directly as the gate/manifest key.
 *
 * Sources:
 *   /tmp/genshin-optimizer/libs/gi/sheets/src/Artifacts/ADayCarvedFromRisingWinds/index.tsx
 *     (set2: greaterEq(artSet,2,0.18,atk_); condSet4 → set4Cond 0.25 atk_; set4Hex isHexerei 0.2 crit_)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const aDayCarvedFromRisingWinds: DbObjectArtifactSet = {
  name: "artifact_set.a_day_carved_from_rising_winds",
  goodId: "ADayCarvedFromRisingWinds",
  bonus: {
    // 2pc — ATK +18% (GO: greaterEq(input.artSet[key], 2, 0.18, { path: 'atk_' })).
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.a_day_carved_from_rising_winds_2",
          stats: { atk_percent: 18 },
        },
      ],
    },
    // 4pc — ATK +25% when toggle ON (GO: equal(condSet4, 'on', 0.25, { path: 'atk_' })).
    // QUARANTINED: CRIT Rate +20% when toggle ON AND isHexerei (no engine primitive for
    // isHexerei; never ship code for it — see tools/port/A-DAY-CARVED-QUARANTINE.md).
    4: {
      conditions: [
        {
          type: "boolean",
          name: "set.a_day_carved_4",
          title: "set_bonus.a_day_carved_from_rising_winds_4",
          stats: { atk_percent: 25 },
        },
      ],
    },
  },
};
