/**
 * Song of Days Past — 4★/5★ artifact set.
 *
 * goodId: "SongOfDaysPast" (confirmed: manifest key `artifactSets.SongOfDaysPast`).
 * Rep: Sigewinne (bow). setToggles: { "set.song_of_days_past_4": true }. BIND.
 *
 * 2pc — Healing Bonus +15% (BIND: always-on static).
 * 4pc — a numeric input ("days_past_healing_recorded", max 15000) + a boolean toggle
 *   ("set.song_of_days_past_4"). The text_percent_dmg and text_value_hp stats in the
 *   raw boolean are display-only → OMIT.
 *   The real effect is a FeatureMultiplier (set-level `multipliers`): each hit of type
 *   normal/charged/plunge/skill/burst gets +<accumulated_healing × 8%> (her ValueTable([8]),
 *   scale "accumulated_healing", source "artifacts"). Gated by the boolean toggle.
 *   At the oracle default (accumulated_healing = 0): multiplier × 0 = 0 → contributes 0,
 *   matching the fixture (sigewinne rep). BIND at toggle-on; INERT at zero healing.
 *
 * Note on fixture: setToggles {"set.song_of_days_past_4": true} — toggle is on, but
 * accumulated_healing defaults to 0 in the build config → net multiplier contribution = 0.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/SongOfDaysPast.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier.js (getValue: value/100, default 'atk*')
 *   packages/data/src/artifacts/sets/echoes-of-an-offering.ts (multipliers pattern reference)
 *   tests/golden/fixtures/sets-4pc/_manifest.json (SongOfDaysPast entry)
 */

import type { CharMultiplier, DbObjectArtifactSet } from "@genshin/types";

// 4pc — per-hit multiplier: +8% of accumulated_healing on all normal/charged/plunge/skill/burst.
// The scaling "accumulated_healing" reads the ConditionNumber input from the context.
// At 0 healing this contributes 0 — exact match to the v5.8 sigewinne fixture.
const healingMultiplier: CharMultiplier = {
  scaling: "accumulated_healing",
  source: "artifacts",
  leveling: "",
  values: { getValue: (): number => 8 },
  target: { damageTypes: ["normal", "charged", "plunge", "skill", "burst"] },
  condition: { type: "boolean", name: "set.song_of_days_past_4" },
};

export const songOfDaysPast: DbObjectArtifactSet = {
  name: "artifact_set.song_of_days_past",
  goodId: "SongOfDaysPast",
  bonus: {
    // 2pc — Healing Bonus +15% (SongOfDaysPast.js setBonus[2]). BIND.
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.song_of_days_past_2",
          stats: { healing: 15 },
        },
      ],
    },
    // 4pc — (SongOfDaysPast.js setBonus[4]).
    // ConditionNumber: the accumulated healing input (max 15000, slider/spinner).
    // ConditionBoolean: the "record" toggle. Raw text_percent_dmg/text_value_hp are display-only → omitted.
    4: {
      conditions: [
        {
          type: "number",
          name: "days_past_healing_recorded",
          serializeId: 35,
          title: "set_bonus.song_of_days_past_4_stack",
          max: 15000,
        },
        {
          type: "boolean",
          name: "set.song_of_days_past_4",
          serializeId: 36,
          title: "set_bonus.song_of_days_past_4",
          stats: {},
        },
      ],
    },
  },
  multipliers: [healingMultiplier],
};
