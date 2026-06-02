/**
 * Finale of the Deep Galleries — 4★/5★ artifact set.
 *
 * goodId: "FinaleOfTheDeepGalleries" (confirmed: manifest key `artifactSets.FinaleOfTheDeepGalleries`).
 * Rep: Escoffier (polearm). setToggles: { "set.finale_of_the_deep_galleries_4_1": true,
 *   "set.finale_of_the_deep_galleries_4_2": true }. BIND.
 *
 * 2pc — Cryo DMG +15% (BIND: always-on static).
 * 4pc — two boolean toggles (raw `text_percent:60` static is display-only → OMIT):
 *   toggle_1: Normal Attack DMG +60% (BIND when set.finale_of_the_deep_galleries_4_1 on).
 *   toggle_2: Burst DMG +60%, BUT gated by Not(toggle_1) — mutually exclusive with toggle_1.
 *   Fixture toggles both ON → toggle_1 fires (dmg_normal:60 active); toggle_2 gated off by
 *   Not(toggle_1) so it does NOT apply. Net 4pc contribution: dmg_normal:60.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/FinaleOfTheDeepGalleries.js
 *   tests/golden/fixtures/sets-4pc/_manifest.json (FinaleOfTheDeepGalleries entry)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const finaleOfTheDeepGalleries: DbObjectArtifactSet = {
  name: "artifact_set.finale_of_the_deep_galleries",
  goodId: "FinaleOfTheDeepGalleries",
  bonus: {
    // 2pc — Cryo DMG +15% (FinaleOfTheDeepGalleries.js setBonus[2]). BIND.
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.finale_of_the_deep_galleries_2",
          stats: { dmg_cryo: 15 },
        },
      ],
    },
    // 4pc — mutually exclusive toggles (FinaleOfTheDeepGalleries.js setBonus[4]).
    // The raw ConditionStatic with text_percent:60 is display-only → omitted.
    // toggle_1: Normal Attack DMG +60%.
    // toggle_2: Burst DMG +60%, gated off when toggle_1 is active (ConditionNot).
    4: {
      conditions: [
        {
          type: "boolean",
          name: "set.finale_of_the_deep_galleries_4_1",
          serializeId: 46,
          title: "set_bonus.finale_of_the_deep_galleries_4_1",
          stats: { dmg_normal: 60 },
        },
        {
          type: "boolean",
          name: "set.finale_of_the_deep_galleries_4_2",
          serializeId: 47,
          title: "set_bonus.finale_of_the_deep_galleries_4_2",
          stats: { dmg_burst: 60 },
          condition: {
            type: "not",
            items: [
              { type: "boolean", name: "set.finale_of_the_deep_galleries_4_1" },
            ],
          },
        },
      ],
    },
  },
};
