/**
 * Gilded Dreams — artifact set port.
 *
 * 2pc: +80 Elemental Mastery (always-on once 2 pieces are equipped).
 * 4pc: DEFERRED — see below.
 *
 * DEFERRED — party-element scaling (GildedDreams.js:32-74):
 *   The 4pc is gated by `set.gilded_dreams_4` boolean and then applies per-party-member
 *   element-counting bonuses (within 8s of triggering a reaction):
 *     - +14% ATK per party member sharing the character's element (max 3, via
 *       ConditionStaticLevel with levelSetting:'party_elements_same').
 *     - +50 EM per party member with a different element (max 3, via
 *       ConditionStaticLevel with levelSetting:'party_elements_different').
 *   These are gated by ConditionCalcElements (reads party element counts) +
 *   ConditionStaticLevel + boolean `party_elements_same`/`party_elements_different`
 *   settings. In every v5.8 oracle fixture the character is solo / no party-element
 *   settings are present, so all party-element levels resolve to 0 → inert.
 *   Needs: ConditionCalcElements + ConditionStaticLevel + party-element model primitives.
 *
 * With 4 pieces + no party (all v5.8 fixtures): only the 2pc EM bonus applies.
 * bonus[4] is omitted (it is optional per the type); the engine only processes tiers
 * present in the record.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/GildedDreams.js:20-28 (2pc)
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/GildedDreams.js:32-74 (4pc — deferred)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const gildedDreams: DbObjectArtifactSet = {
  name: "artifact_set.gilded_dreams",
  goodId: "GildedDreams",
  bonus: {
    // 2pc — Elemental Mastery +80 (GildedDreams.js:20-28).
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.gilded_dreams_2",
          stats: { mastery: 80 },
        },
      ],
    },
    // 4pc — DEFERRED (GildedDreams.js:32-74):
    //   +14% ATK per same-element party member (max 3) + +50 EM per diff-element member (max 3).
    //   Needs: ConditionCalcElements + ConditionStaticLevel + party-element model primitives.
    //   Inert in all v5.8 oracle fixtures (solo character; party_elements_* settings absent).
    //   bonus[4] is omitted; the engine only processes tiers present in the record.
  },
};
