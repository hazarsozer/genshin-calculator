/**
 * Gilded Dreams — artifact set port.
 *
 * 2pc: +80 Elemental Mastery (always-on once 2 pieces are equipped).
 * 4pc: within 8s of triggering a reaction:
 *   - +14%/28%/42% ATK for 1/2/3 party members sharing the character's element
 *     (ConditionStaticLevel, levelSetting: "party_elements_same", fromZero: true,
 *      table: [0, 14, 28, 42] → GildedDreams.js:51)
 *   - +50/100/150 EM for 1/2/3 party members with a different element
 *     (ConditionStaticLevel, levelSetting: "party_elements_different", fromZero: true,
 *      table: [0, 50, 100, 150] → GildedDreams.js:65)
 *   Both are gated on set.gilded_dreams_4 AND party_elements_same/different truthy
 *   (her subConditions — our `.condition` AND gate).
 *   ConditionCalcElements in her source is NOT needed here: Phase A (buildPartyContext)
 *   already computes party_elements_same / party_elements_different in the context.
 *   The text_percent / text_value / text_value2 StatTable entries are display-only
 *   and are NOT emitted.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/GildedDreams.js:20-28 (2pc)
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/GildedDreams.js:32-74 (4pc)
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
    // 4pc — party-element scaling (GildedDreams.js:32-74).
    // The ConditionBoolean gate is included as the top-level toggle (display stats skipped).
    // Each ConditionStaticLevel is gated via .condition (AND of the boolean gate + presence key).
    4: {
      conditions: [
        // Top-level toggle: set.gilded_dreams_4 (GildedDreams.js:33-41).
        // No stats from the boolean itself (text_percent/text_value are display-only).
        {
          type: "boolean",
          name: "set.gilded_dreams_4",
          title: "set_bonus.gilded_dreams_4",
          description: "set_descr.gilded_dreams_4_1",
        },
        // Same-element path: +14%/28%/42% ATK for 1/2/3 same-element party members.
        // GildedDreams.js:44-58 — subConditions: [set.gilded_dreams_4, party_elements_same]
        // table (excluding text_percent display entry): atk_percent: [0, 14, 28, 42]
        {
          type: "staticLevel",
          levelSetting: "party_elements_same",
          fromZero: true,
          levelStats: { atk_percent: [0, 14, 28, 42] },
          title: "set_bonus.gilded_dreams_4",
          description: "set_descr.gilded_dreams_4_2",
          condition: {
            type: "and",
            items: [
              { type: "boolean", name: "set.gilded_dreams_4" },
              { type: "boolean", name: "party_elements_same" },
            ],
          },
        },
        // Different-element path: +50/100/150 EM for 1/2/3 different-element party members.
        // GildedDreams.js:59-73 — subConditions: [set.gilded_dreams_4, party_elements_different]
        // table (excluding text_value/text_value2 display entries): mastery: [0, 50, 100, 150]
        {
          type: "staticLevel",
          levelSetting: "party_elements_different",
          fromZero: true,
          levelStats: { mastery: [0, 50, 100, 150] },
          title: "set_bonus.gilded_dreams_4",
          description: "set_descr.gilded_dreams_4_3",
          condition: {
            type: "and",
            items: [
              { type: "boolean", name: "set.gilded_dreams_4" },
              { type: "boolean", name: "party_elements_different" },
            ],
          },
        },
      ],
    },
  },
};
