/**
 * Scroll of the Hero of Cinder City — 4★/5★ artifact set.
 *
 * goodId: "ScrollOfTheEmberedCitysHero" — CONFIRMED against manifest key
 *   `artifactSets.ScrollOfTheEmberedCitysHero` (the raw file is ScrollOfTheEmberedCitysHero.js
 *   and raw goodId is "ScrollOfTheHeroOfCinderCity"; the manifest key is authoritative).
 * Rep: Mavuika. setToggles: { "set.scroll_of_the_hero_of_cinder_city_4_1": true,
 *   "set.scroll_of_the_hero_of_cinder_city_4_2": true }. INERT: element DMG deferred.
 *
 * 2pc — no real stats (display only in raw). Stats: {}.
 * 4pc — two toggles, element DMG lives in the global Buffs channel → DEFER (stats: {}).
 *   toggle_1: always accessible (no extra gate).
 *   toggle_2: gated by nightsoul (Natlan chars only).
 *   // +12%/+28% all-element DMG deferred to global Buffs channel
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/ScrollOfTheEmberedCitysHero.js
 *   tests/golden/fixtures/sets-4pc/_manifest.json (ScrollOfTheEmberedCitysHero entry)
 */

// +12%/+28% all-element DMG deferred to global Buffs channel

import type { DbObjectArtifactSet } from "@genshin/types";

export const scrollOfTheHeroOfCinderCity: DbObjectArtifactSet = {
  name: "artifact_set.scroll_of_the_hero_of_cinder_city",
  goodId: "ScrollOfTheEmberedCitysHero",
  bonus: {
    // 2pc — raw 2pc ConditionStatic has no real stats (display only). Stats: {}.
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.scroll_of_the_hero_of_cinder_city_2",
          stats: {},
        },
      ],
    },
    // 4pc — two inert toggles (ScrollOfTheEmberedCitysHero.js setBonus[4]).
    // The +12%/+28% all-element DMG bonuses are in the global Buffs channel, not here.
    4: {
      conditions: [
        {
          type: "boolean",
          name: "set.scroll_of_the_hero_of_cinder_city_4_1",
          serializeId: 43,
          title: "set_bonus.scroll_of_the_hero_of_cinder_city_4",
          stats: {},
        },
        {
          type: "boolean",
          name: "set.scroll_of_the_hero_of_cinder_city_4_2",
          serializeId: 44,
          title: "set_bonus.scroll_of_the_hero_of_cinder_city_4",
          stats: {},
          condition: { type: "nightsoul" },
        },
      ],
    },
  },
};
