/**
 * Viridescent Venerer — artifact set port.
 *
 * 2pc: +15% Anemo DMG (always-on once 2 pieces are equipped).
 * 4pc: Swirl reaction DMG +60% (always-on static, no toggle), AND a per-element
 *      enemy RES −40% shred to the swirled element selected via a multi-select dropdown.
 *
 * The 4pc carries two raw constructs:
 *   (a) a static +60% dmg_reaction_swirl (ViridescentVenerer.js:35-42): always fires
 *       with 4 pieces, no toggle needed. `dmg_reaction_swirl` is a REACTION_BONUS_PERCENT_KEY
 *       in buildStats → boosts swirl in core's cTransformativeDamage `(1 + … + Σ dmg_reaction_*)`.
 *   (b) the res-shred. The ACTUAL effect lives in the global-buff layer
 *       raw/.../db/Buffs/Artifacts.js:82-99 as four per-element `enemy_res_<el>: -40` conditions,
 *       each gated by OR(self-worn AND anemo, team-buff), and is ported to CHARACTER_CONDITIONS
 *       in characterConditions.ts (setViridescentVenerer4SwirlConditions). The OR gate is
 *       authoritative there — this bonus[4] carries ONLY the +60% swirl bonus.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/ViridescentVenerer.js:19-26 (2pc)
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/ViridescentVenerer.js:35-42 (4pc static swirl)
 *   raw/genshin_calc_pub/src/js/db/Buffs/Artifacts.js:82-99 (res-shred — moved to CHARACTER_CONDITIONS)
 *   packages/data/src/characterConditions.ts (setViridescentVenerer4SwirlConditions)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const viridescentVenerer: DbObjectArtifactSet = {
  name: "artifact_set.viridescent_venerer",
  goodId: "ViridescentVenerer",
  bonus: {
    // 2pc — Anemo DMG +15% (ViridescentVenerer.js:19-26).
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.viridescent_venerer_2",
          stats: { dmg_anemo: 15 },
        },
      ],
    },
    // 4pc — always-on Swirl DMG +60% (ViridescentVenerer.js:35-42).
    // The per-element enemy RES −40% shred lives in characterConditions.ts
    // (setViridescentVenerer4SwirlConditions) as OR(self-worn, team-buff) to prevent
    // double application when both branches are active simultaneously.
    4: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.viridescent_venerer_4",
          stats: { dmg_reaction_swirl: 60 },
        },
      ],
    },
  },
};
