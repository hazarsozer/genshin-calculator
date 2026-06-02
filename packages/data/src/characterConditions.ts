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
 * `crit_rate_enemy` is emitted by buildStats (÷100) and folded into every feature's
 * crit-rate block by compileFeature (the C6a engine fix). When enemy_status=cryo is set
 * this +15 adds directly to the crit-rate sum — exactly as her getDefaultStatsCritRate
 * (Damage.js:73) includes it. BlizzardStrayer 4pc (D3) reuses the same now-live plumbing.
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

// ===========================================================================
// set_other team buffs — the global artifact-set buffs that activate when a
// TEAMMATE wears a set, not the active character. Each is gated by the
// `set_other.<set>_4` boolean (true = teammate has the set; absent = inert).
//
// Source: raw/genshin_calc_pub/src/js/db/Buffs/Artifacts.js
// Port convention: display-only `text_*` and `shield` keys omitted (same as
// gilded-dreams.ts / resonance convention). Stats are RAW percents.
// ===========================================================================

/**
 * Noblesse Oblige 4pc (team) — +20% ATK.
 * Source: Buffs/Artifacts.js:21-49 — `set_other.noblesse_oblige_4` boolean gate;
 * the OR-branch `new ConditionBoolean({name: 'set_other.noblesse_oblige_4'})`.
 */
const setOtherNoblesseOblige4: Condition = {
  type: "static",
  stats: { atk_percent: 20 },
  condition: { type: "boolean", name: "set_other.noblesse_oblige_4" },
};

/**
 * Deepwood Memories 4pc (team) — enemy Dendro RES −30%.
 * Source: Buffs/Artifacts.js:234-261 — `set_other.deepwood_memories_4` boolean gate.
 * The −30 is a RAW negative percent; buildStats folds `enemy_res_dendro` into the
 * base enemy resistance the same way it does Escoffier's shred.
 */
const setOtherDeepwoodMemories4: Condition = {
  type: "static",
  stats: { enemy_res_dendro: -30 },
  condition: { type: "boolean", name: "set_other.deepwood_memories_4" },
};

/**
 * Tenacity of the Millelith 4pc (team) — +20% ATK.
 * Source: Buffs/Artifacts.js:202-232 — stats: { shield: 30, atk_percent: 20 }.
 * `shield` is a non-damage key (display-only for the shield-strength buff) — omitted
 * per the resonance/gilded convention. Only `atk_percent: 20` is emitted.
 */
const setOtherTenacityOfTheMillelith4: Condition = {
  type: "static",
  stats: { atk_percent: 20 },
  condition: { type: "boolean", name: "set_other.tenacity_of_the_millelith_4" },
};

/**
 * Instructor 4pc (team) — +120 Elemental Mastery.
 * Source: Buffs/Artifacts.js:143-171 — `set_other.instructor_4` boolean gate;
 * stats: { mastery: 120 }.
 */
const setOtherInstructor4: Condition = {
  type: "static",
  stats: { mastery: 120 },
  condition: { type: "boolean", name: "set_other.instructor_4" },
};

/**
 * Viridescent Venerer 4pc res-shred — OR-once across self-worn and team-buff paths.
 *
 * Faithful port of Buffs/Artifacts.js:82-99: one condition per swirlable element
 * (pyro/hydro/electro/cryo), each emitting `enemy_res_<el>: −40`, gated by:
 *   OR(
 *     AND(DropdownValue('set.viridescent_venerer_4', el), CharElement(['anemo']),
 *         PiecesCount('ViridescentVenerer', 4)),
 *     DropdownValue('set_other.viridescent_venerer_4', el)
 *   )
 * The OR ensures the shred applies once even when BOTH the self-worn and team-buff
 * branches are simultaneously active (additively would double to −80 → wrong).
 * The self-worn conditions previously in viridescent-venerer.ts bonus[4] are
 * REMOVED from that file and consolidated here so the OR is authoritative.
 */
const SWIRL_ELEMENTS = ["pyro", "hydro", "electro", "cryo"] as const;

const setViridescentVenerer4SwirlConditions: readonly Condition[] =
  SWIRL_ELEMENTS.map((el) => ({
    type: "static" as const,
    stats: { [`enemy_res_${el}`]: -40 },
    condition: {
      type: "or" as const,
      items: [
        // Self-worn arm: character has VV-4 equipped, is Anemo, and selected this element.
        {
          type: "and" as const,
          items: [
            { type: "dropdownElement" as const, name: "set.viridescent_venerer_4", element: el },
            { type: "char-element" as const, elements: ["anemo"] },
            { type: "pieces-count" as const, setName: "ViridescentVenerer", count: 4 },
          ],
        },
        // Team-buff arm: a teammate wears VV-4 and selected this element.
        { type: "dropdownElement" as const, name: "set_other.viridescent_venerer_4", element: el },
      ],
    },
  }));

/**
 * Scroll of the Hero of Cinder City 4pc (team) — tier 1: +12% to all elemental DMG types.
 * Source: Buffs/Artifacts.js:289-337 — `set_other.scroll_of_the_hero_of_cinder_city_4_1`
 * boolean gate; stats: dmg_anemo/electro/pyro/cryo/hydro/geo/dendro: 12. Physical is absent
 * (Scroll does not buff physical). RAW percents.
 */
const setOtherScrollCinderCity4Tier1: Condition = {
  type: "static",
  stats: {
    dmg_anemo: 12,
    dmg_electro: 12,
    dmg_pyro: 12,
    dmg_cryo: 12,
    dmg_hydro: 12,
    dmg_geo: 12,
    dmg_dendro: 12,
  },
  condition: {
    type: "boolean",
    name: "set_other.scroll_of_the_hero_of_cinder_city_4_1",
  },
};

/**
 * Scroll of the Hero of Cinder City 4pc (team) — tier 2: +28% to all elemental DMG types.
 * Source: Buffs/Artifacts.js:338-359 — `set_other.scroll_of_the_hero_of_cinder_city_4_2`
 * boolean gate; stats: dmg_anemo/electro/pyro/cryo/hydro/geo/dendro: 28.
 * In her engine the tier-2 self-worn is gated by PiecesCount + NightSoul; the team-buff
 * branch is a plain boolean (`set_other.scroll_of_the_hero_of_cinder_city_4_2`). Faithful.
 */
const setOtherScrollCinderCity4Tier2: Condition = {
  type: "static",
  stats: {
    dmg_anemo: 28,
    dmg_electro: 28,
    dmg_pyro: 28,
    dmg_cryo: 28,
    dmg_hydro: 28,
    dmg_geo: 28,
    dmg_dendro: 28,
  },
  condition: {
    type: "boolean",
    name: "set_other.scroll_of_the_hero_of_cinder_city_4_2",
  },
};

/**
 * All global character conditions, in source order (imaginarium_theatre, then the Elemental
 * Resonance buffs in ElementalResonance.js order, then set_other team buffs from
 * Buffs/Artifacts.js). Wire into buildStats alongside `char.conditions` and `extraConditions`.
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
  // set_other team buffs (Buffs/Artifacts.js) — inert unless the toggle is set via partyContext.
  setOtherNoblesseOblige4,
  setOtherDeepwoodMemories4,
  setOtherTenacityOfTheMillelith4,
  setOtherInstructor4,
  ...setViridescentVenerer4SwirlConditions,
  setOtherScrollCinderCity4Tier1,
  setOtherScrollCinderCity4Tier2,
];
