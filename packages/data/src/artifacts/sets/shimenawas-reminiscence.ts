/**
 * Shimenawa's Reminiscence — artifact set port.
 *
 * 2pc: ATK +18% (always-on once 2 pieces are equipped).
 * 4pc: when the wearer consumes energy to use an Elemental Skill, Normal/Charged/Plunge
 *      Attack DMG +50% for 10s (toggle `set.shimenawas_reminiscence_4`).
 *
 * The 4pc `setBonus` entry in raw carries `text_percent: 50` alongside the real stat
 * keys `dmg_normal: 50, dmg_charged: 50, dmg_plunge: 50`. `text_percent` is a UI display
 * marker (Stats.format label) — it is not in any buildStats emit list and contributes
 * nothing to damage. It is dropped here, matching the convention across all other ported
 * sets that omit display-only markers (golden-troupe.ts, emblem-of-severed-fate.ts, etc.).
 *
 * With 4 pieces + toggle ON:
 *   Normal/Charged/Plunge hits: +18% ATK (2pc) + +50% DMG (4pc toggle).
 *   Skill/Burst hits: +18% ATK only.
 *
 * Verified against the oracle set-4pc/hu_tao.json fixture (Hu Tao, BlackcliffPole weapon,
 * set.shimenawas_reminiscence_4=true): normal/charged hits reflect the +50% DMG bonus on
 * top of the 2pc ATK boost.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/ShimenawasReminiscence.js:14-45 (setBonus 2pc/4pc)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const shimenawasReminiscence: DbObjectArtifactSet = {
  name: "artifact_set.shimenawas_reminiscence",
  goodId: "ShimenawasReminiscence",
  bonus: {
    // 2pc — ATK +18% (ShimenawasReminiscence.js:17-24).
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.shimenawas_reminiscence_2",
          stats: { atk_percent: 18 },
        },
      ],
    },
    // 4pc — Normal/Charged/Plunge ATK DMG +50% when toggle is active
    // (ShimenawasReminiscence.js:29-43). `text_percent: 50` dropped (UI-only, numeric no-op).
    4: {
      conditions: [
        {
          type: "boolean",
          name: "set.shimenawas_reminiscence_4",
          title: "set_bonus.shimenawas_reminiscence_4",
          stats: { dmg_normal: 50, dmg_charged: 50, dmg_plunge: 50 },
        },
      ],
    },
  },
};
