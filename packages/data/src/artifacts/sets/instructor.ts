/**
 * Instructor — artifact set port. BIND.
 *
 * 2pc: Elemental Mastery +80 (always-on static once 2 pieces equipped).
 * 4pc: after the wearer uses an Elemental Skill, the entire party gains EM +120
 *      for 8s. The per-set 4pc toggle (`set.instructor_4`) carries only
 *      `text_value: 120` (display marker, numeric no-op). The real +120 EM lives ONCE
 *      in CHARACTER_CONDITIONS (characterConditions.ts), gated by
 *      OR(AND(set.instructor_4, piecesCount Instructor≥4), set_other.instructor_4).
 *      Fires once whether self-worn or teammate.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/Instructor.js (setBonus 2pc/4pc)
 *   raw/genshin_calc_pub/src/js/db/Buffs/Artifacts.js:157-171 (the +120 EM buff + OR gate)
 *   packages/data/src/characterConditions.ts (setOtherInstructor4 — authoritative OR gate)
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
    // 4pc — no real stat here; the per-set toggle carries only text_value: 120 (display
    // marker, numeric no-op). The +120 EM lives in characterConditions.ts (setOtherInstructor4).
    4: {},
  },
};
