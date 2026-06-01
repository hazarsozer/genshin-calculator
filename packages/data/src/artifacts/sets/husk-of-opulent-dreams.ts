/**
 * Husk of Opulent Dreams — artifact set port.
 *
 * 2pc: DEF +30% (always-on once 2 pieces equipped).
 * 4pc: Two stacks conditions, each up to 4 stacks:
 *   - set.husk_of_opulent_dreams_4_def: DEF% +6 per stack (max 4 → +24%)
 *   - set.husk_of_opulent_dreams_4_geo: Geo DMG% +6 per stack (max 4 → +24%)
 *
 * The raw source has a bare ConditionStatic named 'set.husk_of_opulent_dreams_4'
 * with no stats (it is a marker/tooltip-only node). It is OMITTED here — it
 * contributes zero stat change and the typed schema carries no no-stat conditions.
 *
 * Linear-table → per-stack derivation:
 *   Aspirine's StatTable('def_percent', [6, 12, 18, 24]) gives cumulative values
 *   at 1/2/3/4 stacks. The sequence is exactly 6×n (linear), so the per-stack
 *   increment is 6. The engine's conditionStats resolver multiplies the per-stack
 *   bag by getStackCount → at 4 stacks: 6×4 = 24. Same logic applies to dmg_geo.
 *
 * Note on goodId: Aspirine's raw source uses 'HuskOfOpulentDreams' (capital O),
 * but the oracle manifest key is 'HuskofOpulentDreams' (lowercase o). This file
 * uses the manifest key so the golden-test harness matches the albedo.json fixture.
 * (Mirrors the precedent in heart-of-depth.ts: oracle key takes priority over GOOD.)
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/HuskofOpulentDreams.js:15-59
 *   raw/genshin_calc_pub/src/js/classes/StatTable.js (linear table → per-stack value)
 *   packages/data/src/artifacts/sets/crimson-witch.ts (stacks pattern reference)
 *   packages/data/src/artifacts/sets/marechaussee-hunter.ts (stacks pattern reference)
 *   tests/golden/fixtures/set-4pc/_manifest.json (goodId + setToggles for albedo)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const huskOfOpulentDreams: DbObjectArtifactSet = {
  name: "artifact_set.husk_of_opulent_dreams",
  goodId: "HuskofOpulentDreams",
  bonus: {
    // 2pc — DEF +30% (HuskofOpulentDreams.js:18-26).
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.husk_of_opulent_dreams_2",
          stats: { def_percent: 30 },
        },
      ],
    },
    // 4pc — two independent stacks conditions (HuskofOpulentDreams.js:30-57).
    // The bare ConditionStatic 'set.husk_of_opulent_dreams_4' (no stats) is omitted.
    4: {
      conditions: [
        {
          // StatTable('def_percent', [6,12,18,24]): linear, per-stack value = 6.
          // At max 4 stacks: 6×4 = 24% DEF. Albedo's skill/burst scale on DEF.
          type: "stacks",
          name: "set.husk_of_opulent_dreams_4_def",
          title: "set_bonus.husk_of_opulent_dreams_4_def",
          maxStacks: 4,
          stats: { def_percent: 6 },
        },
        {
          // StatTable('dmg_geo', [6,12,18,24]): linear, per-stack value = 6.
          // At max 4 stacks: 6×4 = 24% Geo DMG. Albedo's hits are Geo-typed.
          type: "stacks",
          name: "set.husk_of_opulent_dreams_4_geo",
          title: "set_bonus.husk_of_opulent_dreams_4_geo",
          maxStacks: 4,
          stats: { dmg_geo: 6 },
        },
      ],
    },
  },
};
