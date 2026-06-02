/**
 * Nymph's Dream — 4★/5★ artifact set.
 *
 * goodId: "NymphsDream" (confirmed: manifest key `artifactSets.NymphsDream`).
 * Rep: Tartaglia (bow). setToggles: { "set.nymphs_dream_4": 3 }. BIND.
 *
 * 2pc — Hydro DMG +15% (BIND: always-on static).
 * 4pc — ConditionLevels over 3 stacks (setting: "set.nymphs_dream_4", maxStacks:3).
 *   Raw StatTable values (cumulative): atk_percent [7, 16, 25], dmg_hydro [4, 9, 15].
 *   Decomposed as 3 incremental boolean-value thresholds (delta from each prior level):
 *     stack ≥ 1: +7 atk%, +4 hydro dmg   (cumulative after 1 stack)
 *     stack ≥ 2: +9 atk%, +5 hydro dmg   (delta: 16−7=9, 9−4=5)
 *     stack ≥ 3: +9 atk%, +6 hydro dmg   (delta: 25−16=9, 15−9=6)
 *   At 3 stacks: 7+9+9=25 atk%, 4+5+6=15 hydro — matches raw indexed tables. BIND.
 *
 * The raw also has a ConditionStacks (the stack slider UI) — carried as a separate
 * stacks condition so the UI slider exists. The boolean-value conditions do the stat work.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/NymphsDream.js
 *   tests/golden/fixtures/sets-4pc/_manifest.json (NymphsDream entry, setToggles: {"set.nymphs_dream_4":3})
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const nymphsDream: DbObjectArtifactSet = {
  name: "artifact_set.nymphs_dream",
  goodId: "NymphsDream",
  bonus: {
    // 2pc — Hydro DMG +15% (NymphsDream.js setBonus[2]). BIND.
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.nymphs_dream_2",
          stats: { dmg_hydro: 15 },
        },
      ],
    },
    // 4pc — 3-level stacks (NymphsDream.js setBonus[4]).
    // ConditionStacks provides the UI slider (max 3 stacks).
    // Three boolean-value deltas accumulate the correct totals per stack level.
    //   Level 1: atk_percent+7, dmg_hydro+4
    //   Level 2: atk_percent+9, dmg_hydro+5  (16-7=9, 9-4=5)
    //   Level 3: atk_percent+9, dmg_hydro+6  (25-16=9, 15-9=6)
    4: {
      conditions: [
        {
          type: "stacks",
          name: "set.nymphs_dream_4",
          serializeId: 31,
          title: "set_bonus.nymphs_dream_4",
          maxStacks: 3,
          stats: {},
        },
        {
          type: "boolean-value",
          setting: "set.nymphs_dream_4",
          cond: "ge",
          value: 1,
          stats: { atk_percent: 7, dmg_hydro: 4 },
        },
        {
          type: "boolean-value",
          setting: "set.nymphs_dream_4",
          cond: "ge",
          value: 2,
          stats: { atk_percent: 9, dmg_hydro: 5 },
        },
        {
          type: "boolean-value",
          setting: "set.nymphs_dream_4",
          cond: "ge",
          value: 3,
          stats: { atk_percent: 9, dmg_hydro: 6 },
        },
      ],
    },
  },
};
