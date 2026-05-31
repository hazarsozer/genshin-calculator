/**
 * Thundering Fury — artifact set port.
 *
 * 2pc: +15% Electro DMG (always-on once 2 pieces are equipped).
 * 4pc: Overloaded/Electro-Charged/Superconduct/Hyperbloom reaction DMG +40%,
 *      Aggravate/Lunarcharged reaction DMG +20% (all always-on, no toggle).
 *      There is also a skill CD reduction in-game — it is NOT a damage stat and
 *      is absent from the raw stats bag; not ported.
 *
 * Both conditions are ConditionStatic (no toggle required). The 4pc reaction-DMG
 * keys are INERT for solo Keqing (electro only — no multi-element reactions fire),
 * so the fixture binds only on the 2pc electro DMG bonus.
 *
 * CARRY NOTE — dmg_reaction_lunarcharged quirk: in the current buildStats,
 * REACTION_DERIVED_KEYS processes lunarcharged via the un-divided path (raw, not /100),
 * unlike the other dmg_reaction_* keys. This is a latent engine quirk; the value is
 * inert for the Keqing fixture rep (no lunarcharged reaction fires), so it does not
 * affect golden tests. Ported faithfully; flag for resolution in a future engine pass.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/ThunderingFury.js:13-44 (setBonus 2pc/4pc)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const thunderingFury: DbObjectArtifactSet = {
  name: "artifact_set.thundering_fury",
  goodId: "ThunderingFury",
  bonus: {
    // 2pc — Electro DMG +15% (ThunderingFury.js:16-25).
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.thundering_fury_2",
          stats: { dmg_electro: 15 },
        },
      ],
    },
    // 4pc — always-on reaction-DMG bonuses, no toggle (ThunderingFury.js:29-43).
    4: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.thundering_fury_4",
          stats: {
            dmg_reaction_overloaded: 40,
            dmg_reaction_electrocharged: 40,
            dmg_reaction_superconduct: 40,
            dmg_reaction_hyperbloom: 40,
            dmg_reaction_aggravate: 20,
            dmg_reaction_lunarcharged: 20,
          },
        },
      ],
    },
  },
};
