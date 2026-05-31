/**
 * Noblesse Oblige — artifact set port.
 *
 * 2pc: +20% Elemental Burst DMG (always-on once 2 pieces are equipped).
 * 4pc: after the wearer's Burst, the party gains +20% ATK for 12s.
 *
 * RAW SOURCE SPLIT (load-bearing): the per-set `setBonus` array
 * (raw/.../db/Artifacts/Set/NoblesseOblige.js) carries ONLY the numeric 2pc
 * (`dmg_burst: 20`); its 4pc condition (`set.noblesse_oblige_4`) carries just
 * `text_percent: 20`, a UI DISPLAY marker (Stats.format label) that contributes
 * NOTHING to damage. The REAL +20% ATK lives in the global artifact-buffs object
 * (raw/.../db/Buffs/Artifacts.js:35-49), gated by:
 *     Or( And( boolean set.noblesse_oblige_4, piecesCount NoblesseOblige>=4 ),
 *         boolean set_other.noblesse_oblige_4 )
 * i.e. it applies when the wearer has the 4pc and toggles it, OR a teammate runs it.
 * We fold that buff into this set's 4pc tier so the port is self-contained and the
 * oracle `set-4pc` fixture (which sets `set.noblesse_oblige_4` + 4 equipped pieces)
 * matches: Bennett's ATK rises ×1.38/1.18 (verified to 5 dp against bennett.json).
 *
 * The `text_percent: 20` markers are preserved verbatim so the data is a faithful
 * port and the toggle exists; `text_percent` is not in any buildStats emit list, so
 * it is a numeric no-op (exactly her behaviour).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/NoblesseOblige.js:14-41 (setBonus 2pc/4pc)
 *   raw/genshin_calc_pub/src/js/db/Buffs/Artifacts.js:35-49 (the +20% ATK buff + self/team gate)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const noblesseOblige: DbObjectArtifactSet = {
  name: "artifact_set.noblesse_oblige",
  goodId: "NoblesseOblige",
  bonus: {
    // 2pc — Elemental Burst DMG +20% (NoblesseOblige.js:16-26).
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.noblesse_oblige_2",
          stats: { dmg_burst: 20 },
        },
      ],
    },
    // 4pc — two conditions, mirroring her two raw sources:
    //   (a) the per-set toggle's display marker (text_percent, numeric no-op);
    //   (b) the global Buffs +20% ATK, gated self-4pc OR team.
    4: {
      conditions: [
        {
          type: "boolean",
          name: "set.noblesse_oblige_4",
          title: "set_bonus.noblesse_oblige_4",
          stats: { text_percent: 20 },
        },
        {
          type: "static",
          stats: { atk_percent: 20 },
          condition: {
            type: "or",
            items: [
              {
                type: "and",
                items: [
                  { type: "boolean", name: "set.noblesse_oblige_4" },
                  { type: "pieces-count", setName: "NoblesseOblige", count: 4 },
                ],
              },
              { type: "boolean", name: "set_other.noblesse_oblige_4" },
            ],
          },
        },
      ],
    },
  },
};
