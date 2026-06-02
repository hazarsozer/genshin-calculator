/**
 * Archaic Petra — 4★/5★ artifact set.
 *
 * goodId: "ArchaicPetra" (confirmed: manifest key `artifactSets.ArchaicPetra`).
 * Rep: Itto (Geo, claymore). setToggles: {} (INERT in fixture).
 *
 * 2pc — Geo DMG +15% (BIND: always-on static).
 * 4pc — ConditionDropdownElement selecting an element; the +35% dmg_<elem> lives in the
 *   global Buffs channel, NOT in setBonus[4]. INERT here: dropdown has empty option stats
 *   so the selection key exists without contributing to buildStats.
 *   // +35% dmg_<elem> deferred to global Buffs channel
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/ArchaicPetra.js
 *   tests/golden/fixtures/sets-4pc/_manifest.json (ArchaicPetra entry)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const archaicPetra: DbObjectArtifactSet = {
  name: "artifact_set.archaic_petra",
  goodId: "ArchaicPetra",
  bonus: {
    // 2pc — Geo DMG +15% (ArchaicPetra.js setBonus[2], ConditionStatic). BIND.
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.archaic_petra_2",
          stats: { dmg_geo: 15 },
        },
      ],
    },
    // 4pc — Element selector dropdown. The +35% dmg_<elem> bonus lives in the global
    // Buffs channel, NOT here. INERT: options carry no stats so no buildStats change.
    // +35% dmg_<elem> deferred to global Buffs channel
    4: {
      conditions: [
        {
          type: "dropdown",
          name: "set_bonus.archaic_petra_4",
          options: [[{}], [{}], [{}], [{}]],
        },
      ],
    },
  },
};
