/**
 * Noblesse Oblige — artifact set port.
 *
 * 2pc: +20% Elemental Burst DMG (always-on once 2 pieces are equipped).
 * 4pc: after the wearer's Burst, the party gains +20% ATK for 12s.
 *
 * RAW SOURCE SPLIT: the per-set `setBonus` 4pc condition (`set.noblesse_oblige_4`)
 * carries only `text_percent: 20`, a UI display marker that contributes NOTHING to
 * damage. The REAL +20% ATK lives ONCE in CHARACTER_CONDITIONS (characterConditions.ts),
 * gated by OR(AND(set.noblesse_oblige_4, piecesCount NoblesseOblige≥4), set_other.noblesse_oblige_4).
 * That single global fires once whether the active char wears the set or a teammate does,
 * preventing the previous double-count bug.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/NoblesseOblige.js:14-41 (setBonus 2pc/4pc)
 *   raw/genshin_calc_pub/src/js/db/Buffs/Artifacts.js:35-49 (the +20% ATK buff + OR gate)
 *   packages/data/src/characterConditions.ts (setOtherNoblesseOblige4 — authoritative OR gate)
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
    // 4pc — display toggle only (text_percent: numeric no-op, NoblesseOblige.js:30-38).
    // The +20% ATK lives in characterConditions.ts (setOtherNoblesseOblige4) — see above.
    4: {
      conditions: [
        {
          type: "boolean",
          name: "set.noblesse_oblige_4",
          title: "set_bonus.noblesse_oblige_4",
          stats: { text_percent: 20 },
        },
      ],
    },
  },
};
