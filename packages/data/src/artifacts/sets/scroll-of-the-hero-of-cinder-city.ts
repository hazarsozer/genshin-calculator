/**
 * Scroll of the Hero of Cinder City — artifact set port.
 *
 * 2pc: Nightsoul-point / healing bonus — NUMERIC NO-OP in her calc (the raw 2pc condition
 *      carries only display markers, no combat stat). Empty tier.
 * 4pc: when the wearer triggers a Nightsoul-related effect, ALL party members gain +12%
 *      all-element DMG; while the wearer is in Nightsoul's Blessing, +28% more. The two
 *      per-set 4pc toggles carry only `text_percent` display markers (12 / 28, UI-only).
 *
 * The REAL all-7-element DMG lives ONCE in CHARACTER_CONDITIONS (characterConditions.ts),
 * each OR-gated:
 *   +12: OR(AND(set.scroll_..._4_1, piecesCount ScrollOfTheEmberedCitysHero≥4),
 *            set_other.scroll_..._4_1)
 *   +28: OR(AND(set.scroll_..._4_2, nightsoul, piecesCount≥4),
 *            set_other.scroll_..._4_2)
 * Each fires once whether self-worn or teammate.
 *
 * KEY DISTINCTION:
 *   - `goodId` = "ScrollOfTheEmberedCitysHero" (the oracle manifest / set-registry key).
 *   - pieces-count `setName` = "ScrollOfTheEmberedCitysHero" (her Buffs PiecesCount setName).
 *   - display name = "Scroll of the Hero of Cinder City".
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/ScrollOfTheEmberedCitysHero.js (2pc/4pc shells)
 *   raw/genshin_calc_pub/src/js/db/Buffs/Artifacts.js:317-359 (real all-element DMG + OR gates)
 *   packages/data/src/characterConditions.ts (setOtherScrollCinderCity4Tier1/Tier2 — authoritative OR gates)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const scrollOfTheHeroOfCinderCity: DbObjectArtifactSet = {
  name: "artifact_set.scroll_of_the_hero_of_cinder_city",
  goodId: "ScrollOfTheEmberedCitysHero",
  bonus: {
    // 2pc — numeric no-op (Nightsoul/healing 2pc; no combat stat in her calc).
    2: { conditions: [] },
    // 4pc — no real stat here; the per-set toggles carry only display markers (numeric
    // no-ops). The all-element DMG lives in characterConditions.ts (setOtherScrollCinderCity4Tier1/Tier2).
    4: {},
  },
};
