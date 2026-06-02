/**
 * Instructor — artifact set port. BIND.
 *
 * 2pc: Elemental Mastery +80 (always-on static once 2 pieces equipped).
 * 4pc: after the wearer uses an Elemental Skill, the entire party gains EM +120
 *      for 8s. The per-set 4pc toggle (`set.instructor_4`) carries only
 *      `text_value: 120` (display marker, numeric no-op). The real +120 EM lives in
 *      the global artifact-buffs object (raw/.../db/Buffs/Artifacts.js:157-171),
 *      gated by:
 *          Or( And( boolean set.instructor_4, piecesCount Instructor>=4 ),
 *              boolean set_other.instructor_4 )
 *      We fold that buff into this set's 4pc tier. The `goodId` "Instructor" == her
 *      ArtifactSet.goodId AND the piecesCount setName (confirmed in raw + Buffs).
 *
 * NOTE: the per-set boolean toggle's `text_value: 120` is a display-only marker
 * (Stats.format label). It is NOT in any buildStats emit list and contributes
 * nothing to damage. The real mastery:120 comes from the Or-gated static below.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/Instructor.js (setBonus 2pc/4pc)
 *   raw/genshin_calc_pub/src/js/db/Buffs/Artifacts.js:157-171 (the +120 EM buff + Or gate)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const instructor: DbObjectArtifactSet = {
  name: "artifact_set.instructor",
  goodId: "Instructor",
  bonus: {
    // 2pc — Elemental Mastery +80 (Instructor.js:35-42).
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.instructor_2",
          stats: { mastery: 80 },
        },
      ],
    },
    // 4pc — Or-gated +120 EM from Buffs/Artifacts.js:157-171.
    // The mastery:120 is the real damage-relevant stat; the Or gate handles
    // both the self-4pc path and the team buff path.
    4: {
      conditions: [
        {
          type: "static",
          stats: { mastery: 120 },
          condition: {
            type: "or",
            items: [
              {
                type: "and",
                items: [
                  { type: "boolean", name: "set.instructor_4" },
                  { type: "pieces-count", setName: "Instructor", count: 4 },
                ],
              },
              { type: "boolean", name: "set_other.instructor_4" },
            ],
          },
        },
      ],
    },
  },
};
