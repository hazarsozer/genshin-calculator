/**
 * Defender's Will — 3★/4★ artifact set.
 *
 * goodId: "DefendersWill" (confirmed: manifest key `artifactSets.DefendersWill`).
 * Rep: Itto. setToggles: {} (INERT in fixture — 4pc entirely deferred).
 *
 * 2pc — DEF +30% (BIND: always-on static).
 * 4pc — DEFER ENTIRELY. ConditionDefendersWill emits res_<element>:30 per unique party
 *   element (needs the party-element model). No bonus[4] entry — the engine skips absent tiers.
 *   // 4pc res_<element> deferred to ② (party-element)
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/DefendersWill.js
 *   tests/golden/fixtures/sets-4pc/_manifest.json (DefendersWill entry)
 */

// 4pc res_<element> deferred to ② (party-element)

import type { DbObjectArtifactSet } from "@genshin/types";

export const defendersWill: DbObjectArtifactSet = {
  name: "artifact_set.defenders_will",
  goodId: "DefendersWill",
  bonus: {
    // 2pc — DEF +30% (DefendersWill.js setBonus[2], ConditionStatic). BIND.
    2: {
      conditions: [
        {
          type: "static",
          stats: { def_percent: 30 },
        },
      ],
    },
    // 4pc omitted — ConditionDefendersWill (party-element res_<elem>:30) deferred to ②.
  },
};
