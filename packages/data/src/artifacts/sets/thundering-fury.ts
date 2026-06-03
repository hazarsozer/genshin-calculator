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
 * dmg_reaction_lunarcharged: this 4pc emits it as a RAW percent (20) via a
 * condition. As of Phase 3 ④ M3, buildStats classifies it under
 * REACTION_BONUS_PERCENT_KEYS (/100 like every sibling dmg_reaction_* key), so it
 * reads as +0.20 inside the reaction's (1 + emBonus + Σ) term. (Previously it sat
 * in the un-divided REACTION_DERIVED_KEYS path and read as +2000% — inert for the
 * Keqing fixture rep, where no lunarcharged reaction fires, but desynced for a
 * Lunar-Charged rep; see constantRetirement.test.ts thundering_lunarcharged.)
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
