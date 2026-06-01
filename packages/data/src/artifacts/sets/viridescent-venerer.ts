/**
 * Viridescent Venerer — artifact set port.
 *
 * 2pc: +15% Anemo DMG (always-on once 2 pieces are equipped).
 * 4pc: Swirl reaction DMG +60% (always-on static, no toggle).
 *      DEFERRED — per-element enemy RES −40% swirl shred (see below).
 *
 * The 4pc carries two conditions in the raw source:
 *   (a) a static +60% dmg_reaction_swirl (ViridescentVenerer.js:35-42): always fires
 *       with 4 pieces, no toggle needed — PORTED here.
 *   (b) a ConditionDropdownElement `set.viridescent_venerer_4` selecting the swirled
 *       element (cryo/electro/hydro/pyro), which feeds the global-buff channel in
 *       raw/genshin_calc_pub/src/js/db/Buffs/Artifacts.js:82-99 to apply
 *       enemy_res_<element>: -40 — DEFERRED.
 *
 * DEFERRED — res-shred (ViridescentVenerer.js:43-72 + Buffs/Artifacts.js:82-99):
 *   Needs a DropdownElement primitive + char_element subCondition + global-buff channel
 *   (the res-shred lives in the Buffs layer, not the setBonus layer). The dropdown
 *   `setToggles` is EMPTY in every v5.8 oracle fixture (no element selected), so this
 *   shred is inert for all current golden tests — safe to defer.
 *
 * With 4 pieces + swirl dropdown unset (all v5.8 fixtures): 2pc(15 anemo) + 4pc-static(60 swirl).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/ViridescentVenerer.js:19-26 (2pc)
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/ViridescentVenerer.js:35-42 (4pc static)
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/ViridescentVenerer.js:43-72 (4pc dropdown — deferred)
 *   raw/genshin_calc_pub/src/js/db/Buffs/Artifacts.js:82-99 (res-shred global-buff — deferred)
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
    // The per-element enemy RES −40% shred (ViridescentVenerer.js:43-72 +
    // Buffs/Artifacts.js:82-99) is DEFERRED: needs DropdownElement + global-buff
    // channel primitives; inert in all v5.8 oracle fixtures (setToggles empty).
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
