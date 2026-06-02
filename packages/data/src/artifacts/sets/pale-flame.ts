/**
 * Pale Flame — 4★/5★ artifact set.
 *
 * goodId: "PaleFlame" (confirmed: manifest key `artifactSets.PaleFlame`).
 * Rep: Itto (claymore). setToggles: { "set.pale_flame_4": 2 }. BIND.
 *
 * 2pc — Physical DMG +25% (BIND: always-on static).
 * 4pc — stacks condition (max 2, +9% ATK per stack) + boolean-value threshold at max
 *   stacks (+25% Physical DMG additionally at ≥ 2 stacks). BIND.
 *   Raw StatTable('atk_percent', [9]) → per-stack value 9 (linear, single entry = always 9/stack).
 *   At 2 stacks: 9×2=18 ATK% + 25 Physical DMG% (at-max threshold fires).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/PaleFlame.js
 *   tests/golden/fixtures/sets-4pc/_manifest.json (PaleFlame entry, setToggles: {"set.pale_flame_4":2})
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const paleFlame: DbObjectArtifactSet = {
  name: "artifact_set.pale_flame",
  goodId: "PaleFlame",
  bonus: {
    // 2pc — Physical DMG +25% (PaleFlame.js setBonus[2]). BIND.
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.pale_flame_2",
          stats: { dmg_phys: 25 },
        },
      ],
    },
    // 4pc — (PaleFlame.js setBonus[4]).
    // ConditionStacks: ATK +9% per stack (max 2 → up to +18% ATK).
    // ConditionBooleanValue: at ≥ 2 stacks Physical DMG +25% additionally.
    4: {
      conditions: [
        {
          type: "stacks",
          name: "set.pale_flame_4",
          serializeId: 16,
          title: "set_bonus.pale_flame_4",
          maxStacks: 2,
          stats: { atk_percent: 9 },
        },
        {
          type: "boolean-value",
          setting: "set.pale_flame_4",
          cond: "ge",
          value: 2,
          stats: { dmg_phys: 25 },
        },
      ],
    },
  },
};
