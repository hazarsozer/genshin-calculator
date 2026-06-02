/**
 * Obsidian Codex — 4★/5★ artifact set (NOVEL hand-port; ConditionBooleanNightSoul gate).
 *
 * goodId: "ObsidianCodex" (confirmed vs sets-4pc/_manifest.json artifact key).
 * Rep: Mavuika (Natlan → char_origin === "natlan" → nightsoul gate ACTIVE).
 *
 * 2pc "Warrior's Oath" bonus — two conditions:
 *   a. ConditionBoolean `common.nightsoul_blessing_state` (serializeId:41): the nightsoul
 *      blessing state toggle. Gated by ConditionBooleanNightSoul (natlan chars only).
 *      Mavuika → gate passes → toggle is surfaced. No stats of its own.
 *   b. ConditionStatic with dmg_all:15. Gated on AND[nightsoul, common.nightsoul_blessing_state].
 *      Active when both the nightsoul char gate AND the user toggle pass.
 *      Fixture 2pc crit_rate=10 (base, no crit bonus from 2pc).
 *
 * 4pc "Warrior's Oath" bonus — one condition:
 *   a. ConditionBoolean `set.obsidian_codex_4` (serializeId:42): CritRate +40%.
 *      Gated by ConditionBooleanNightSoul (natlan chars only).
 *      Mavuika → gate passes → toggle active when user enables `set.obsidian_codex_4`.
 *      Fixture 4pc crit_rate=50 (base 10 + 40 from 4pc toggle) ✓.
 *
 * Mavuika is a Natlan char → both nightsoul gates BIND (char_origin==="natlan").
 * The fixture toggles `common.nightsoul_blessing_state:true` + `set.obsidian_codex_4:true`.
 * 2pc: dmg_all+15 ACTIVE; 4pc: crit_rate+40 ACTIVE (total 50 ✓).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/ObsidianCodex.js:6-58
 *   raw/genshin_calc_pub/src/js/classes/Condition/Boolean/NightSoul.js (char_origin==="natlan")
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const obsidianCodex: DbObjectArtifactSet = {
  name: "artifact_set.obsidian_codex",
  goodId: "ObsidianCodex",
  bonus: {
    // 2pc — DMG +15% while in Nightsoul's Blessing. Gated on `nightsoul` ALONE: a Natlan
    // wielder is assumed in Nightsoul's Blessing for the calc, so the oracle applies the bonus
    // even when `common.nightsoul_blessing_state` is not explicitly toggled (the Phase-2
    // set-4pc/mavuika fixture sets only `set.obsidian_codex_4`, yet still applies the +15%).
    // The not-in-blessing config defers to ②. (The raw also has a stat-less blessing_state
    // toggle marker — omitted.)
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.obsidian_codex_2",
          description: "set_descr.obsidian_codex_2",
          stats: { dmg_all: 15 },
          condition: { type: "nightsoul" },
        },
      ],
    },
    // 4pc — CritRate +40% (toggle gated by nightsoul char gate).
    4: {
      conditions: [
        // +40% CritRate: active when natlan char AND user enables set.obsidian_codex_4.
        {
          type: "boolean",
          name: "set.obsidian_codex_4",
          serializeId: 42,
          title: "set_bonus.obsidian_codex_4",
          description: "set_descr.obsidian_codex_4",
          stats: { crit_rate: 40 },
          condition: { type: "nightsoul" },
        },
      ],
    },
  },
};
