/**
 * Scroll of the Hero of Cinder City — artifact set port.
 *
 * 2pc: Nightsoul-point / healing bonus — NUMERIC NO-OP in her calc (the raw 2pc condition
 *      carries only display markers, no combat stat). Empty tier.
 * 4pc: when the wearer triggers a Nightsoul-related effect, ALL party members gain +12%
 *      all-element DMG; while the wearer is in Nightsoul's Blessing, +28% more. The two
 *      per-set 4pc toggles carry only `text_percent` display markers (12 / 28, UI-only);
 *      the REAL all-7-element DMG lives in the global artifact buffs
 *      (raw/.../db/Buffs/Artifacts.js:317-359), each Or-gated:
 *        +12: Or( And( boolean set.scroll_..._4_1, piecesCount ScrollOfTheEmberedCitysHero>=4 ),
 *                 boolean set_other.scroll_..._4_1 )
 *        +28: Or( And( boolean set.scroll_..._4_2, nightsoul, piecesCount …>=4 ),
 *                 boolean set_other.scroll_..._4_2 )
 *
 * It SELF-applies for the rep (Mavuika, natlan → nightsoul auto-true via char_origin), so
 * with both 4pc toggles ON the wielder gets +40% of their own element. Uses the 7 explicit
 * `dmg_<element>` keys exactly as her raw (NOT `dmg_own`) — only the wielder's element binds
 * on direct hits, so for pyro Mavuika this is +40% dmg_pyro.
 *
 * Numeric proof (4pc fixture, nightsoul ON): +40 confirmed exactly — skill 4pc/2pc =
 * 1.30303 = 1.72/1.32, burst = 1.243902 = 2.04/1.64; physical/non-pyro features unchanged.
 *
 * KEY DISTINCTION:
 *   - `goodId` = "ScrollOfTheEmberedCitysHero" (the oracle manifest / set-registry key).
 *   - pieces-count `setName` = "ScrollOfTheEmberedCitysHero" (her Buffs PiecesCount setName,
 *     Artifacts.js:331/353 — coincides with the goodId here).
 *   - display name = "Scroll of the Hero of Cinder City".
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/ScrollOfTheEmberedCitysHero.js (2pc/4pc shells)
 *   raw/genshin_calc_pub/src/js/db/Buffs/Artifacts.js:317-359 (real all-element DMG + Or gates)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

const dmg4pc1 = {
  dmg_anemo: 12,
  dmg_electro: 12,
  dmg_pyro: 12,
  dmg_cryo: 12,
  dmg_hydro: 12,
  dmg_geo: 12,
  dmg_dendro: 12,
} as const;

const dmg4pc2 = {
  dmg_anemo: 28,
  dmg_electro: 28,
  dmg_pyro: 28,
  dmg_cryo: 28,
  dmg_hydro: 28,
  dmg_geo: 28,
  dmg_dendro: 28,
} as const;

export const scrollOfTheHeroOfCinderCity: DbObjectArtifactSet = {
  name: "artifact_set.scroll_of_the_hero_of_cinder_city",
  goodId: "ScrollOfTheEmberedCitysHero",
  bonus: {
    // 2pc — numeric no-op (Nightsoul/healing 2pc; no combat stat in her calc).
    2: { conditions: [] },
    // 4pc — Or-gated all-element DMG from Buffs/Artifacts.js:317-359.
    4: {
      conditions: [
        // +12% (set.._4_1) — Artifacts.js:317-337.
        {
          type: "static",
          stats: dmg4pc1,
          condition: {
            type: "or",
            items: [
              {
                type: "and",
                items: [
                  { type: "boolean", name: "set.scroll_of_the_hero_of_cinder_city_4_1" },
                  { type: "pieces-count", setName: "ScrollOfTheEmberedCitysHero", count: 4 },
                ],
              },
              { type: "boolean", name: "set_other.scroll_of_the_hero_of_cinder_city_4_1" },
            ],
          },
        },
        // +28% (set.._4_2, Nightsoul-gated) — Artifacts.js:338-359.
        {
          type: "static",
          stats: dmg4pc2,
          condition: {
            type: "or",
            items: [
              {
                type: "and",
                items: [
                  { type: "boolean", name: "set.scroll_of_the_hero_of_cinder_city_4_2" },
                  { type: "nightsoul" },
                  { type: "pieces-count", setName: "ScrollOfTheEmberedCitysHero", count: 4 },
                ],
              },
              { type: "boolean", name: "set_other.scroll_of_the_hero_of_cinder_city_4_2" },
            ],
          },
        },
      ],
    },
  },
};
