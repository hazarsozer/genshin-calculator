/**
 * Global character conditions — faithfully ported from
 * raw/genshin_calc_pub/src/js/db/Conditions/Character.js (lines 1-15).
 *
 * These conditions are NOT per-character. In her engine, CalcObjectCharacter.getConditions()
 * does `result = result.concat(DB.Conditions.Character)`, appending every entry here onto
 * every character's condition list. Each is gated by its own boolean `name`, so it
 * contributes nothing unless that key is set `true` in the EvalContext.
 *
 * Port convention:
 *   ConditionBoolean → `{ type: "boolean", name, stats }` (serializeId and UI strings omitted).
 *   Stats are RAW percents — identical to her internal bag convention.
 */

import type { Condition } from "@genshin/types";

/**
 * Imaginarium Theatre challenge buff: +20% HP / DEF / ATK while active.
 * Source: raw/genshin_calc_pub/src/js/db/Conditions/Character.js:4-14
 *   name: 'imaginarium_theatre'
 *   stats: { hp_percent: 20, def_percent: 20, atk_percent: 20 }
 *
 * Exercised by fixtures: toggles/arataki_itto, toggles/ganyu, full-build/arataki_itto.
 */
const imaginariumTheatre: Condition = {
  type: "boolean",
  name: "imaginarium_theatre",
  stats: {
    hp_percent: 20,
    def_percent: 20,
    atk_percent: 20,
  },
};

/**
 * All global character conditions, in source order.
 * Wire into buildStats alongside `char.conditions` and `extraConditions`.
 */
export const CHARACTER_CONDITIONS: readonly Condition[] = [imaginariumTheatre];
