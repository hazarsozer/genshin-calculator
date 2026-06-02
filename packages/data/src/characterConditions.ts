/**
 * Global character conditions — faithfully ported from
 * raw/genshin_calc_pub/src/js/db/Conditions/Character.js (lines 1-15) and the
 * team buffs her engine appends to every character (Elemental Resonance).
 *
 * These conditions are NOT per-character. In her engine, CalcObjectCharacter.getConditions()
 * does `result = result.concat(DB.Conditions.Character)`, appending every entry here onto
 * every character's condition list. Each is gated by its own boolean `name` / gate, so it
 * contributes nothing unless that key is set `true` in the EvalContext.
 *
 * Port convention:
 *   ConditionBoolean → `{ type: "boolean", name, stats }` (serializeId and UI strings omitted).
 *   ConditionStatic  → `{ type: "static", stats, condition }`.
 *   Display-only `text_*` stat keys are OMITTED (UI descriptor text — same convention as
 *   gilded-dreams.ts). Stats are RAW percents — identical to her internal bag convention.
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

// ===========================================================================
// Elemental Resonance — the 7 elemental buffs + the none-resonance buff her
// ElementalResonance buff (db/Buffs/ElementalResonance.js) appends to every
// character. Each buff is gated by (its element's ConditionResonance) AND the
// ResonanceEnabled team-presence gate.
// ===========================================================================

/**
 * ResonanceEnabled — her ConditionBooleanResonanceEnabled (Boolean/ResonanceEnabled.js:8-14):
 *   result = true; if (settings['buffs.only_full_party_resonance'] && party_size < 4) result = false
 *
 * Her engine only ever instantiates ElementalResonance in a party context, so this is also
 * the team-presence proxy. We make that explicit and base-safe: require a real party
 * (`party_size >= 2`; solo leaves party_size absent → reads 0 → false), then apply her exact
 * only_full_party rule. `NOT(only_full_party_resonance AND party_size < 4)` = her `result`.
 *
 * Composed from existing gate variants (no new primitive): an AND of
 *   - party present: ConditionBooleanValue(party_size, ge, 2)
 *   - NOT(only_full_party_resonance AND party_size < 4)
 * The fixtures all use party_size 4 with only_full_party_resonance unset → this is true; with
 * no party party_size is absent → the presence gate is false → every resonance buff is inert.
 *
 * Source: raw/genshin_calc_pub/src/js/classes/Condition/Boolean/ResonanceEnabled.js:8-14
 *         raw/genshin_calc_pub/src/js/db/Buffs/ElementalResonance.js:91 (every buff sub-gates on it)
 */
const resonanceEnabled: Condition = {
  type: "and",
  items: [
    // Resonance is a team mechanic — present only with >= 1 teammate (party_size >= 2).
    { type: "boolean-value", setting: "party_size", cond: "ge", value: 2 },
    // NOT(only_full_party_resonance AND party_size < 4) — her exact disable rule.
    {
      type: "not",
      items: [
        {
          type: "and",
          items: [
            { type: "boolean", name: "buffs.only_full_party_resonance" },
            { type: "boolean-value", setting: "party_size", cond: "lt", value: 4 },
          ],
        },
      ],
    },
  ],
};

/** A resonance buff's gate: (this element resonates) AND (resonance enabled). */
function resonanceGate(element?: string): Condition {
  return {
    type: "and",
    items: [
      element !== undefined ? { type: "resonance", element } : { type: "resonance" },
      resonanceEnabled,
    ],
  };
}

/**
 * Cryo Resonance — base buff (text-only: +15% CRIT Rate vs enemies affected by Cryo, a
 * display descriptor) carries no emitted stat. Source: ElementalResonance.js:75-93.
 * The real CRIT bonus is the cryo-STATUS sub-effect below.
 */
const resonanceCryo: Condition = {
  type: "static",
  // text_percent (display) omitted — no real stat on the base cryo buff.
  condition: resonanceGate("cryo"),
};

/**
 * Cryo Resonance (status sub-effect) — crit_rate_enemy +15 when the enemy has Cryo status.
 * Gated additionally on ConditionEnemyStatus(['cryo']) — her enemy_status setting.
 * Source: ElementalResonance.js:94-116.
 *
 * GATED-BUT-NO-DELTA: `crit_rate_enemy` is not yet plumbed by the engine (same deferred
 * mechanism as BlizzardStrayer 4pc — buildStats does not emit it, compileFeature does not
 * read it). In resonance-cryo the gate IS active (enemyStatus: cryo), so the stat lands in
 * the raw bag, but is dropped at emit — matching the oracle (which shows base 25% crit, no
 * +15). When that mechanism is ported (D3), this fires automatically with no change here.
 */
const resonanceCryoStatus: Condition = {
  type: "static",
  stats: { crit_rate_enemy: 15 },
  condition: {
    type: "and",
    items: [
      resonanceGate("cryo"),
      { type: "enemy-status", statuses: ["cryo"] },
    ],
  },
};

/**
 * Electro Resonance — text-only (energy-particle / cooldown descriptors); no emitted stat.
 * Source: ElementalResonance.js:117-136 (text_percent_1 / text_percent_2 display only).
 */
const resonanceElectro: Condition = {
  type: "static",
  condition: resonanceGate("electro"),
};

/**
 * Hydro Resonance — +25% Max HP. Source: ElementalResonance.js:137-156
 *   stats: { text_percent: 40 (display, omitted), hp_percent: 25 }
 */
const resonanceHydro: Condition = {
  type: "static",
  stats: { hp_percent: 25 },
  condition: resonanceGate("hydro"),
};

/**
 * Pyro Resonance — +25% ATK. Source: ElementalResonance.js:157-176
 *   stats: { text_percent: 40 (display, omitted), atk_percent: 25 }
 */
const resonancePyro: Condition = {
  type: "static",
  stats: { atk_percent: 25 },
  condition: resonanceGate("pyro"),
};

/**
 * Anemo Resonance — stamina/movement/recovery (non-combat). Source: ElementalResonance.js:177-197
 *   stats: { stamina_consume: 15, move_speed: 10, recovery: 5 }
 * Faithfully carried (her bag holds them); none are emitted → no damage delta.
 */
const resonanceAnemo: Condition = {
  type: "static",
  stats: { stamina_consume: 15, move_speed: 10, recovery: 5 },
  condition: resonanceGate("anemo"),
};

/**
 * Geo Resonance — base shield bonus (non-combat). Source: ElementalResonance.js:198-216
 *   stats: { shield: 15 }
 */
const resonanceGeo: Condition = {
  type: "static",
  stats: { shield: 15 },
  condition: resonanceGate("geo"),
};

/**
 * Geo Resonance (shield sub-effect) — +15% DMG while shielded. Source: ElementalResonance.js:217-241
 *   ConditionBoolean(name: 'common.char_status_shield'), stats: { dmg_all: 15 }
 * Gated additionally on the `common.char_status_shield` toggle (unset in every fixture → inert).
 */
const resonanceGeoShield: Condition = {
  type: "boolean",
  name: "common.char_status_shield",
  stats: { dmg_all: 15 },
  condition: resonanceGate("geo"),
};

/**
 * Geo Resonance (attack sub-effect) — enemy Geo RES -20 while attacking a shielded-by-self
 * enemy. Source: ElementalResonance.js:242-267
 *   ConditionBoolean(name: 'buffs.resonance_geo_attack'), stats: { text_percent: 20 (display,
 *   omitted), enemy_res_geo: -20 }
 * Gated additionally on the `buffs.resonance_geo_attack` toggle (unset in every fixture → inert).
 */
const resonanceGeoAttack: Condition = {
  type: "boolean",
  name: "buffs.resonance_geo_attack",
  stats: { enemy_res_geo: -20 },
  condition: resonanceGate("geo"),
};

/**
 * Dendro Resonance — base +50 Elemental Mastery. Source: ElementalResonance.js:268-291
 *   ConditionStatic(name: 'common.char_status_shield' — a UI rotation key, NOT a gate),
 *   stats: { mastery: 50 }
 * The `name` on her ConditionStatic is a rotation/serialize hint only (Static activation does
 * not read `ctx[name]`), so this is always-on under the resonance gate — matching the oracle.
 */
const resonanceDendro: Condition = {
  type: "static",
  stats: { mastery: 50 },
  condition: resonanceGate("dendro"),
};

/**
 * Dendro Resonance (sub-effect 1) — +30 EM after triggering a Dendro-core reaction.
 * Source: ElementalResonance.js:292-316 — ConditionBoolean(name: 'buffs.resonance_dendro_1'),
 *   stats: { mastery: 30 }. Gated on the toggle (unset in every fixture → inert).
 */
const resonanceDendro1: Condition = {
  type: "boolean",
  name: "buffs.resonance_dendro_1",
  stats: { mastery: 30 },
  condition: resonanceGate("dendro"),
};

/**
 * Dendro Resonance (sub-effect 2) — +20 EM after a Burning/Bloom/etc. reaction.
 * Source: ElementalResonance.js:317-341 — ConditionBoolean(name: 'buffs.resonance_dendro_2'),
 *   stats: { mastery: 20 }. Gated on the toggle (unset in every fixture → inert).
 */
const resonanceDendro2: Condition = {
  type: "boolean",
  name: "buffs.resonance_dendro_2",
  stats: { mastery: 20 },
  condition: resonanceGate("dendro"),
};

/**
 * No-resonance buff — all-element RES +15 (self-RES, defensive) when no element reaches a
 * duo. Source: ElementalResonance.js:342-367
 *   stats: { res_anemo/res_phys/res_geo/res_pyro/res_electro/res_hydro/res_cryo/res_dendro: 15 }
 * Self-RES keys are never emitted by buildStats → no damage delta (matches the oracle for
 * resonance-none and the mixed-element gilded-dreams-different fixtures). The none-case gate
 * is held inert without a party by ResonanceEnabled (party_size >= 2).
 */
const resonanceNone: Condition = {
  type: "static",
  stats: {
    res_anemo: 15,
    res_phys: 15,
    res_geo: 15,
    res_pyro: 15,
    res_electro: 15,
    res_hydro: 15,
    res_cryo: 15,
    res_dendro: 15,
  },
  condition: resonanceGate(),
};

/**
 * All global character conditions, in source order (imaginarium_theatre, then the Elemental
 * Resonance buffs in ElementalResonance.js order). Wire into buildStats alongside
 * `char.conditions` and `extraConditions`.
 */
export const CHARACTER_CONDITIONS: readonly Condition[] = [
  imaginariumTheatre,
  resonanceCryo,
  resonanceCryoStatus,
  resonanceElectro,
  resonanceHydro,
  resonancePyro,
  resonanceAnemo,
  resonanceGeo,
  resonanceGeoShield,
  resonanceGeoAttack,
  resonanceDendro,
  resonanceDendro1,
  resonanceDendro2,
  resonanceNone,
];
