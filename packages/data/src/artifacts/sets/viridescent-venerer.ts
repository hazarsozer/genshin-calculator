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
 *   (b) the res-shred. Her selector widget is a `ConditionDropdownElement`
 *       `set.viridescent_venerer_4` (multi-select cryo;electro;hydro;pyro, anemo-gated —
 *       ViridescentVenerer.js:43-72); it is UI/suggester metadata. The ACTUAL effect lives
 *       in the global-buff layer raw/.../db/Buffs/Artifacts.js:82-99 as four per-element
 *       `enemy_res_<el>: -40` conditions, each gated by
 *         OR( AND( DropdownValue('set.viridescent_venerer_4', el), CharElement(anemo),
 *                  PiecesCount('ViridescentVenerer', 4) ),
 *             DropdownValue('set_other.viridescent_venerer_4', el) ).
 *
 * THIS PORT wires the SELF-WORN branch (the first AND): four `static` conditions emitting
 * `enemy_res_<el>: -40`, gated by AND(dropdownElement, char-element[anemo]), placed in
 * `bonus[4]` (so the `set_pieces.VV >= 4` requirement is implicit — these only apply with
 * 4 pieces equipped). The `enemy_res_<el>` fold in buildStats (~lines 716-727) folds the
 * raw negative percent into the base enemy resistance (the Escoffier A4 precedent), lowering
 * `r` for that element → raises Kazuha's swirl + downstream reaction damage of it.
 *
 * The `set_other.viridescent_venerer_4` team-buff branch (second OR arm — a teammate wearing
 * VV shredding for a DPS who does NOT) is a SEPARATE Phase 3 ② task (set_other family); it
 * does not route through `bonus[4]`, so it is intentionally NOT wired here. These self-worn
 * shred conditions are nonetheless the reusable building block for it.
 *
 * Inert when no element is selected: every v5.8 NON-party fixture (armory, goldenConfig)
 * leaves `set.viridescent_venerer_4` unset → `dropdownElement` is inactive → no shred. So
 * the solo armory 2pc/4pc numbers are unmoved; only the party fixtures (which pass
 * `set.viridescent_venerer_4` = the swirled element on anemo Kazuha) see the shred.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/ViridescentVenerer.js:19-26 (2pc)
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/ViridescentVenerer.js:35-42 (4pc static swirl)
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/ViridescentVenerer.js:43-72 (4pc element selector widget)
 *   raw/genshin_calc_pub/src/js/db/Buffs/Artifacts.js:82-99 (per-element res-shred — wired self-worn branch)
 *   packages/data/src/buildStats.ts:716-727 (enemy_res_<el> fold — Escoffier precedent)
 */

import type { Condition, DbObjectArtifactSet } from "@genshin/types";

/**
 * The swirlable elements VV shreds (Buffs/Artifacts.js:82). Anemo/Geo/Dendro cannot be
 * swirled, so the shred only covers these four.
 */
const SWIRL_ELEMENTS = ["pyro", "hydro", "electro", "cryo"] as const;

/**
 * Self-worn per-element res-shred conditions for the 4pc: for each swirlable element, a
 * `static` condition emitting `enemy_res_<el>: -40`, active when that element is selected in
 * the `set.viridescent_venerer_4` multi-select AND the wielder is Anemo. The `set_pieces`
 * gate is implicit (these live in `bonus[4]`). Mirrors Buffs/Artifacts.js:82-99 (self-worn arm).
 */
const swirlResShredConditions: readonly Condition[] = SWIRL_ELEMENTS.map((el) => ({
  type: "static",
  title: "set_bonus.viridescent_venerer_4",
  stats: { [`enemy_res_${el}`]: -40 },
  condition: {
    type: "and",
    items: [
      { type: "dropdownElement", name: "set.viridescent_venerer_4", element: el },
      { type: "char-element", elements: ["anemo"] },
    ],
  },
}));

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
    // 4pc — always-on Swirl DMG +60% (ViridescentVenerer.js:35-42) PLUS the per-element
    // enemy RES −40% shred to the swirled element (Buffs/Artifacts.js:82-99, self-worn arm).
    // The shred is inert until an element is selected via `set.viridescent_venerer_4`
    // (unset in every solo/armory fixture → no movement there).
    4: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.viridescent_venerer_4",
          stats: { dmg_reaction_swirl: 60 },
        },
        ...swirlResShredConditions,
      ],
    },
  },
};
