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

import type { CharMultiplier, CharPostEffect, Condition, TalentTable } from "@genshin/types";

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
 * Noblesse Oblige 4pc — +20% ATK.
 * Source: Buffs/Artifacts.js:35-49 — OR(AND(set.noblesse_oblige_4, piecesCount NoblesseOblige≥4),
 * set_other.noblesse_oblige_4). Fires once whether the active char wears it or a teammate does.
 */
const setOtherNoblesseOblige4: Condition = {
  type: "static",
  stats: { atk_percent: 20 },
  condition: {
    type: "or",
    items: [
      {
        type: "and",
        items: [
          { type: "boolean", name: "set.noblesse_oblige_4" },
          { type: "pieces-count", setName: "NoblesseOblige", count: 4 },
        ],
      },
      { type: "boolean", name: "set_other.noblesse_oblige_4" },
    ],
  },
};

/**
 * Deepwood Memories 4pc — enemy Dendro RES −30%.
 * Source: Buffs/Artifacts.js:247-261 — OR(AND(set.deepwood_memories_4, piecesCount DeepwoodMemories≥4),
 * set_other.deepwood_memories_4). The −30 is a RAW negative percent. Fires once.
 */
const setOtherDeepwoodMemories4: Condition = {
  type: "static",
  stats: { enemy_res_dendro: -30 },
  condition: {
    type: "or",
    items: [
      {
        type: "and",
        items: [
          { type: "boolean", name: "set.deepwood_memories_4" },
          { type: "pieces-count", setName: "DeepwoodMemories", count: 4 },
        ],
      },
      { type: "boolean", name: "set_other.deepwood_memories_4" },
    ],
  },
};

/**
 * Tenacity of the Millelith 4pc — +20% ATK.
 * Source: Buffs/Artifacts.js:217-232 — OR(AND(set.tenacity_of_the_millelith_4, piecesCount TenacityofMillelith≥4),
 * set_other.tenacity_of_the_millelith_4). `shield:30` omitted (non-damage). Fires once.
 * Note: piecesCount setName is "TenacityofMillelith" (lowercase "of") — her ArtifactSet.name key.
 */
const setOtherTenacityOfTheMillelith4: Condition = {
  type: "static",
  stats: { atk_percent: 20 },
  condition: {
    type: "or",
    items: [
      {
        type: "and",
        items: [
          { type: "boolean", name: "set.tenacity_of_the_millelith_4" },
          { type: "pieces-count", setName: "TenacityofMillelith", count: 4 },
        ],
      },
      { type: "boolean", name: "set_other.tenacity_of_the_millelith_4" },
    ],
  },
};

/**
 * Instructor 4pc — +120 Elemental Mastery.
 * Source: Buffs/Artifacts.js:157-171 — OR(AND(set.instructor_4, piecesCount Instructor≥4),
 * set_other.instructor_4). Fires once.
 */
const setOtherInstructor4: Condition = {
  type: "static",
  stats: { mastery: 120 },
  condition: {
    type: "or",
    items: [
      {
        type: "and",
        items: [
          { type: "boolean", name: "set.instructor_4" },
          { type: "pieces-count", setName: "Instructor", count: 4 },
        ],
      },
      { type: "boolean", name: "set_other.instructor_4" },
    ],
  },
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
            { type: "dropdown-element" as const, name: "set.viridescent_venerer_4", element: el },
            { type: "char-element" as const, elements: ["anemo"] },
            { type: "pieces-count" as const, setName: "ViridescentVenerer", count: 4 },
          ],
        },
        // Team-buff arm: a teammate wears VV-4 and selected this element.
        { type: "dropdown-element" as const, name: "set_other.viridescent_venerer_4", element: el },
      ],
    },
  }));

/**
 * Archaic Petra 4pc — on absorbing a Crystallize shard, the wearer gains +35% `dmg_<element>`
 * for the absorbed element. Faithful port of `ConditionArchaic`
 * (raw/genshin_calc_pub/src/js/classes/Condition/Archaic.js:4-17) gated by
 * raw/.../db/Buffs/Artifacts.js:131-142:
 *   OR(
 *     AND(ConditionBoolean('set_bonus.archaic_petra_4'), PiecesCount('ArchaicPetra', 4)),
 *     ConditionBoolean('set_other.archaic_petra_4')
 *   )
 * ALLOWED = {cryo, electro, hydro, pyro} — geo is EXCLUDED (Archaic.js:4). Always +35, no scaling.
 *
 * One condition per allowed element (like VV4 above): each emits `dmg_<el>: 35`, gated by an
 * OR of the self-worn arm (dropdown value + 4 pieces) and the team-buff arm (`set_other` dropdown
 * value). The OR fires once even when both arms select the same element — additively summing the
 * two paths would double to +70 (wrong); her raw reads a single `element` and adds once.
 * (Raw's lookup precedence is `set_other` then `set_bonus` at Archaic.js:14; modeling each element
 * as one OR-gated emit is equivalent because both keys map to the same element token here.)
 */
const ARCHAIC_PETRA_ELEMENTS = ["cryo", "electro", "hydro", "pyro"] as const;

const setArchaicPetra4DmgConditions: readonly Condition[] =
  ARCHAIC_PETRA_ELEMENTS.map((el) => ({
    type: "static" as const,
    stats: { [`dmg_${el}`]: 35 },
    condition: {
      type: "or" as const,
      items: [
        // Self-worn arm: wearer selected this element AND has Archaic Petra 4pc equipped.
        {
          type: "and" as const,
          items: [
            { type: "dropdown-element" as const, name: "set_bonus.archaic_petra_4", element: el },
            { type: "pieces-count" as const, setName: "ArchaicPetra", count: 4 },
          ],
        },
        // Team-buff arm: a teammate wears Archaic Petra 4pc and selected this element.
        { type: "dropdown-element" as const, name: "set_other.archaic_petra_4", element: el },
      ],
    },
  }));

/**
 * Scroll of the Hero of Cinder City 4pc — tier 1: +12% to all elemental DMG types.
 * Source: Buffs/Artifacts.js:317-337 — OR(AND(set.scroll_..._4_1, piecesCount ScrollOfTheEmberedCitysHero≥4),
 * set_other.scroll_..._4_1). Physical absent (Scroll does not buff physical). Fires once.
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
    type: "or",
    items: [
      {
        type: "and",
        items: [
          { type: "boolean", name: "set.scroll_of_the_hero_of_cinder_city_4_1" },
          { type: "pieces-count", setName: "ScrollOfTheEmberedCitysHero", count: 4 },
        ],
      },
      { type: "boolean", name: "set_other.scroll_of_the_hero_of_cinder_city_4_1" },
    ],
  },
};

/**
 * Scroll of the Hero of Cinder City 4pc — tier 2: +28% to all elemental DMG types.
 * Source: Buffs/Artifacts.js:338-359 — OR(AND(set.scroll_..._4_2, nightsoul, piecesCount≥4),
 * set_other.scroll_..._4_2). The team-buff arm is a plain boolean (no nightsoul gate). Fires once.
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
    type: "or",
    items: [
      {
        type: "and",
        items: [
          { type: "boolean", name: "set.scroll_of_the_hero_of_cinder_city_4_2" },
          { type: "nightsoul" },
          { type: "pieces-count", setName: "ScrollOfTheEmberedCitysHero", count: 4 },
        ],
      },
      { type: "boolean", name: "set_other.scroll_of_the_hero_of_cinder_city_4_2" },
    ],
  },
};

/**
 * Song of Days Past 4pc (team) — the recorded-healing INPUT, injected into the stats bag.
 *
 * Faithful port of the ConditionNumber in Buffs/Artifacts.js:262-273
 * (`party_days_past_healing_recorded`, max 15000). Her `ConditionNumber.getStats`
 * (Condition/Number.js:58-70) adds the clamped value to the stats bag under the
 * condition's `name` (no `stat`/`noStat` override). The team multiplier below then
 * scales off that bag value via its bare (non-`*`) `scaling` key — her
 * `makeStatItem('party_days_past_healing_recorded')` reads `stats.get(...)` directly.
 *
 * Active only when the value is > 0 (ConditionNumber.isActive); absent/0 → no stat
 * added → base-inert. The companion `set_other.song_of_days_past_4` boolean gates the
 * MULTIPLIER (below), not this input — her input has no gate of its own.
 */
const setOtherSongOfDaysPast4HealingInput: Condition = {
  type: "number",
  name: "party_days_past_healing_recorded",
  max: 15000,
};

// ===========================================================================
// weapon_other off-field team buffs — a TEAMMATE's weapon passive buffs the
// active char (the `weapons` DbObjectBuff in Buffs/Weapons.js, NOT the weapon's
// own self-passive). Each is gated by a `weapon.<weapon>` / `weapon_other.<weapon>`
// LEVEL setting (1–5 = the teammate weapon's refine; 0/absent → inert). The active
// char does NOT equip the weapon, so there is no self-equip path to double-count
// with — a pure off-field buff (mirrors the set_other team buffs above, but with
// no OR(self) arm: the level setting IS the only gate).
//
// 7a scopes the two pipeline-proving exemplars. Faithful port of her
// ConditionLevelSelect (Static/Level.js semantics): read the level off the gate
// setting, index the atk_percent StatTable. Modeled as ConditionStaticLevel + an
// explicit boolean gate on the SAME setting — REQUIRED because our staticLevel has
// no built-in `settings[name] > 0` activeness check (her ConditionLevelSelect.isActive
// does); without the gate, an absent level falls through to `level = raw || 1` and
// would emit the R1 value, breaking base-safety. The boolean gate reproduces her
// `isActive` so the buff is INERT (emits nothing) unless its level setting is present.
//
// Source: raw/genshin_calc_pub/src/js/db/Buffs/Weapons.js (Thrilling Tales :14, Wolf's :31)
// ===========================================================================

/**
 * Thrilling Tales of Dragon Slayers (off-field) — +24/30/36/42/48% ATK (R1..R5).
 * Source: Buffs/Weapons.js:14-28 — ConditionLevelSelect gated `weapon.thrilling_tales`
 * (NOTE: `weapon.` not `weapon_other.` — Thrilling Tales' off-field ATK buff can be received
 * even by its own wielder after a swap, so her gate name omits the `_other`). The `text_percent`
 * StatTable is display-only (omitted, per the gilded-dreams/set_other convention). Level read off
 * the gate setting; absent → boolean gate false → inert.
 */
const weaponOtherThrillingTales: Condition = {
  type: "static-level",
  levelSetting: "weapon.thrilling_tales",
  levelStats: { atk_percent: [24, 30, 36, 42, 48] },
  condition: { type: "boolean", name: "weapon.thrilling_tales" },
};

/**
 * Wolf's Gravestone (off-field) — +40/50/60/70/80% ATK (R1..R5).
 * Source: Buffs/Weapons.js:31-49 — ConditionLevelSelect gated `weapon_other.weapon_wolfs_gravestone`,
 * with a subCondition ConditionBoolean({name:'weapon_wolfs_gravestone', invert:true}) → the off-field
 * buff applies only when the active char has NOT toggled Wolf's OWN self-passive (its self-equip ATK
 * buff lives in wolfs-gravestone.ts, gated `weapon_wolfs_gravestone`). The invert gate is the
 * no-double-count guard: a Wolf's wielder gets the self-passive, not this team copy. Level read off
 * the gate setting; absent → boolean gate false → inert.
 */
const weaponOtherWolfsGravestone: Condition = {
  type: "static-level",
  levelSetting: "weapon_other.weapon_wolfs_gravestone",
  levelStats: { atk_percent: [40, 50, 60, 70, 80] },
  condition: {
    type: "and",
    items: [
      { type: "boolean", name: "weapon_other.weapon_wolfs_gravestone" },
      { type: "boolean", name: "weapon_wolfs_gravestone", invert: true },
    ],
  },
};

// ---------------------------------------------------------------------------
// Task 7b — simple off-field weapon_other buffs (Buffs/Weapons.js, remaining
// ConditionLevelSelect / 1-slot ConditionPartyWeapon without statName).
// All follow the 7a pattern: ConditionStaticLevel + explicit boolean gate.
// Each is INERT unless the gate level setting is present (base-safety).
// ---------------------------------------------------------------------------

/**
 * Hakushin Ring (off-field) — +10/12.5/15/17.5/20% DMG (own element, R1..R5).
 * Source: Buffs/Weapons.js:99-118 — ConditionLevelSelect gated
 * `weapon_other.weapon_white_dragon_ring`, with subCondition
 * ConditionBoolean({name:'weapon_white_dragon_ring', invert:true}).
 * `dmg_own` is the wielder's own-element DMG bonus; buildStats folds it into
 * `dmg_<char_element>`. The NOT(weapon_white_dragon_ring) guard prevents
 * double-count vs the self-equip passive (hakushin-ring.ts).
 */
const weaponOtherWhiteDragonRing: Condition = {
  type: "static-level",
  levelSetting: "weapon_other.weapon_white_dragon_ring",
  levelStats: { dmg_own: [10, 12.5, 15, 17.5, 20] },
  condition: {
    type: "and",
    items: [
      { type: "boolean", name: "weapon_other.weapon_white_dragon_ring" },
      { type: "boolean", name: "weapon_white_dragon_ring", invert: true },
    ],
  },
};

/**
 * Sapwood Blade (off-field) — +60/75/90/105/120 EM (R1..R5).
 * Source: Buffs/Weapons.js:120-140 — ConditionLevelSelect gated
 * `weapon_other.forest_sanctuary`, with subCondition
 * ConditionBoolean({name:'weapon_forest_sanctuary', invert:true}).
 * The NOT guard prevents double-count vs the self-equip EM buff.
 */
const weaponOtherForestSanctuary: Condition = {
  type: "static-level",
  levelSetting: "weapon_other.forest_sanctuary",
  levelStats: { mastery: [60, 75, 90, 105, 120] },
  condition: {
    type: "and",
    items: [
      { type: "boolean", name: "weapon_other.forest_sanctuary" },
      { type: "boolean", name: "weapon_forest_sanctuary", invert: true },
    ],
  },
};

/**
 * Moonpiercer (off-field) — +16/20/24/28/32% ATK (R1..R5).
 * Source: Buffs/Weapons.js:141-161 — ConditionLevelSelect gated
 * `weapon_other.stillwood_moonshadow`, with subCondition
 * ConditionBoolean({name:'weapon_stillwood_moonshadow', invert:true}).
 * The NOT guard prevents double-count vs the self-equip ATK buff.
 */
const weaponOtherStillwoodMoonshadow: Condition = {
  type: "static-level",
  levelSetting: "weapon_other.stillwood_moonshadow",
  levelStats: { atk_percent: [16, 20, 24, 28, 32] },
  condition: {
    type: "and",
    items: [
      { type: "boolean", name: "weapon_other.stillwood_moonshadow" },
      { type: "boolean", name: "weapon_stillwood_moonshadow", invert: true },
    ],
  },
};

/**
 * Starcaller's Watch (off-field) — +28/35/42/49/56% All DMG (R1..R5).
 * Source: Buffs/Weapons.js:271-288 — ConditionPartyWeapon (1 slot, no statName)
 * gated `weapon_other.weapon_starcallers_watch`, subCondition
 * ConditionNot([ConditionBoolean({name:'weapon_starcallers_watch'})]).
 * Functionally identical to ConditionLevelSelect (1 slot). The NOT guard
 * prevents double-count vs the self-equip DMG bonus (starcallers-watch.ts).
 */
const weaponOtherStarcallersWatch: Condition = {
  type: "static-level",
  levelSetting: "weapon_other.weapon_starcallers_watch",
  levelStats: { dmg_all: [28, 35, 42, 49, 56] },
  condition: {
    type: "and",
    items: [
      { type: "boolean", name: "weapon_other.weapon_starcallers_watch" },
      { type: "boolean", name: "weapon_starcallers_watch", invert: true },
    ],
  },
};

/**
 * Symphonist of Scents (off-field) — +32/40/48/56/64% ATK (R1..R5).
 * Source: Buffs/Weapons.js:289-304 — ConditionPartyWeapon (1 slot, no statName)
 * gated `weapon_other.weapon_symphonist_of_scents`, outer condition
 * ConditionNot([ConditionBoolean({name:'symphonist_of_scents_3'})]).
 * The NOT guard prevents double-count when the self-equip 3rd-stack passive
 * (same atk_percent values, key `symphonist_of_scents_3`) is active.
 */
const weaponOtherSymphonistOfScents: Condition = {
  type: "static-level",
  levelSetting: "weapon_other.weapon_symphonist_of_scents",
  levelStats: { atk_percent: [32, 40, 48, 56, 64] },
  condition: {
    type: "and",
    items: [
      { type: "boolean", name: "weapon_other.weapon_symphonist_of_scents" },
      { type: "boolean", name: "symphonist_of_scents_3", invert: true },
    ],
  },
};

/**
 * A Thousand Floating Dreams (off-field, primary slot) — +40/42/44/46/48 EM (R1..R5).
 * Source: Buffs/Weapons.js:238-250 — ConditionPartyWeapon (3 slots: serializeIds [47,48,49],
 * no statName, no self-exclusion) gated `weapon_other.weapon_thousand_floating_dreams`.
 * Ports slot 1 only (the primary team buff from a single TFD wielder). Slots 2+3
 * (`weapon_other.weapon_thousand_floating_dreams_2/_3`) deferred to a follow-up task
 * if multi-wielder stacking is required.
 */
const weaponOtherThousandFloatingDreams: Condition = {
  type: "static-level",
  levelSetting: "weapon_other.weapon_thousand_floating_dreams",
  levelStats: { mastery: [40, 42, 44, 46, 48] },
  condition: { type: "boolean", name: "weapon_other.weapon_thousand_floating_dreams" },
};

/**
 * Elegy for the End (off-field) — +20/25/30/35/40% ATK + 100/125/150/175/200 EM (R1..R5).
 * Source: Buffs/Weapons.js:51-66 — ConditionLevelSelect gated
 * `weapon_other.weapon_elegy_for_the_end`. No self-exclusion subCondition.
 * Stats: `text_percent [20..40]` maps to atk_percent; `text_value [100..200]` maps to mastery.
 * In her engine `text_*` prefixed stats are display-labelled but mechanically real:
 * `text_percent` accumulates into atk_percent; `text_value` accumulates into mastery.
 * Verified empirically: oracle ratio 2422/1808 = 1.339 matches atk_percent+40% on Diluc.
 */
const weaponOtherElegyForTheEnd: Condition = {
  type: "static-level",
  levelSetting: "weapon_other.weapon_elegy_for_the_end",
  levelStats: {
    atk_percent: [20, 25, 30, 35, 40],
    mastery: [100, 125, 150, 175, 200],
  },
  condition: { type: "boolean", name: "weapon_other.weapon_elegy_for_the_end" },
};

/**
 * Song of Broken Pines (off-field) — +20/25/30/35/40% ATK (R1..R5).
 * Source: Buffs/Weapons.js:67-81 — ConditionLevelSelect gated
 * `weapon_other.weapon_song_of_broken_pines`. No self-exclusion.
 * Stats: `text_percent [20..40]` → atk_percent; `text_percent_2 [12..24]` → ATK SPD (display only).
 * ATK SPD omitted: it has zero damage-number effect in this calculator. Verified: oracle
 * 2422 matches atk_percent+40% on Diluc (same as Elegy, no extra from text_percent_2:24).
 */
const weaponOtherSongOfBrokenPines: Condition = {
  type: "static-level",
  levelSetting: "weapon_other.weapon_song_of_broken_pines",
  levelStats: { atk_percent: [20, 25, 30, 35, 40] },
  condition: { type: "boolean", name: "weapon_other.weapon_song_of_broken_pines" },
};

/**
 * Freedom-Sworn (off-field) — +20/25/30/35/40% ATK + +16/20/24/28/32% Normal/Charged/Plunge DMG (R1..R5).
 * Source: Buffs/Weapons.js:83-98 — ConditionLevelSelect gated
 * `weapon_other.weapon_freedom_sworn`. No self-exclusion.
 * Stats: `text_percent [20..40]` → atk_percent; `text_percent_2 [16..32]` → dmg_normal +
 *   dmg_charged + dmg_plunge (Normal/Charged/Plunge DMG% bonus in-game).
 * Verified: oracle 3114 matches atk_percent+40% × normal_dmg_bonus+32% on Diluc
 *   (3114/1808 = 1.722 ≈ (1.58/1.18) × (1.12+0.32)/1.12 = 1.339 × 1.286 ✓).
 */
const weaponOtherFreedomSworn: Condition = {
  type: "static-level",
  levelSetting: "weapon_other.weapon_freedom_sworn",
  levelStats: {
    atk_percent: [20, 25, 30, 35, 40],
    dmg_normal: [16, 20, 24, 28, 32],
    dmg_charged: [16, 20, 24, 28, 32],
    dmg_plunge: [16, 20, 24, 28, 32],
  },
  condition: { type: "boolean", name: "weapon_other.weapon_freedom_sworn" },
};

/**
 * Bond of Life → bag stat — faithful port of her GLOBAL `ConditionBoLStat`
 * (db/Buffs/Static.js:28, the `static` buff appended to every character):
 *   getStats(settings) → { bond_of_life: settings['common.bond_of_life'] || 0 }
 * gated by `ConditionBoolean({name:'common.bond_of_life'})`.
 *
 * Modelled as a `number` condition keyed by `common.bond_of_life`, writing the
 * (clamped) value to the bag under `bond_of_life` (her `stat ?? name`). The
 * `number` variant's `isActive` (Condition/Number.js:8-11) requires the setting
 * `> 0` — exactly her ConditionBoolean gate (a truthy `common.bond_of_life`) — so
 * an absent/0 input contributes nothing (base-inert). The `common.bond_of_life`
 * setting is published by `partyContext` (`party.bondOfLife`, partyContext.ts:97)
 * or supplied directly in settings.
 *
 * The emitted `bond_of_life` is RAW (= the setting, e.g. 50) — identical to
 * ConditionBoLStat, which emits the un-folded `common.bond_of_life`. (Her engine's
 * `processPercent` later folds the isPercent `bond_of_life` /100 before the C4
 * post-effect reads it; in our port the post-effect instead carries the raw
 * `C4BurstBonus`/`C4BurstBonusCap` and the single emit-time /100 reproduces the
 * fold — see clorinde.ts.) Read ONLY from the internal `raw` Stats by the Clorinde
 * C4 post-effect (`fromStat:"bond_of_life"`); never copied to the emitted `out`
 * bag, so it does not touch any damage golden (and the deferred Clorinde BoL *heal*
 * `cStat("bond_of_life")` — which reads `out` — stays unchanged at 0).
 *
 * ⚠️ FUTURE-PASS TRAP: when the deferred Clorinde/Lyney BoL *heal* is modeled, it must
 * emit `bond_of_life` to `out` as a FRACTION (`raw.get("bond_of_life") / 100`, since
 * `isPercent("bond_of_life")` is true) — NOT a raw copy. `raw` holds the un-folded 50;
 * the heal/`subtractBoL` terms read `out` via `cStat` expecting the 0.5 fraction. Copying
 * raw→out verbatim (like RAW_BAG_SCALING_KEYS) would be a 100× heal bug.
 *
 * Base-inert: no golden sets `common.bond_of_life` → the `number` condition is
 * inactive → `{}` → 58k goldens byte-unchanged.
 *
 * Source: raw/genshin_calc_pub/src/js/classes/Condition/BoLStat.js:4-8
 *         raw/genshin_calc_pub/src/js/db/Buffs/Static.js:28-30 (global `static` buff)
 *         raw/genshin_calc_pub/src/js/classes/Stats.js:332 (isPercent bond_of_life)
 */
const bondOfLifeStat: Condition = {
  type: "number",
  name: "common.bond_of_life",
  stat: "bond_of_life",
};

/**
 * Neuvillette A4 input slider → bag stat — faithful port of her per-character
 * `ConditionNumber` `neuvillette_the_high_arbitrators_discipline`
 * (db/Char/Neuvillette.js:309-324). Her `ConditionNumber.getStats`
 * (Condition/Number.js:58-70) clamps the raw settings value to [0, max] and adds it
 * to the bag under the condition's `name` (no `stat`/`noStat` override → keyed by
 * `name`); `isActive` requires it `> 0` (Number.js:8-11). The A4 PostEffectStats
 * then reads this bag value via `makeStatItem(from)` and converts it to a damage-%
 * pct (the HP-ratio branch when > 100).
 *
 * The bag value is RAW (NOT percent-folded): `isPercent('neuvillette_the_high…')` is
 * false (it has no isPercent prefix), so her `processPercent` leaves it untouched —
 * verified empirically (setting 30000 → bag 30000). `max` mirrors her
 * `CHARACTER_MAX_POSSIBLE_HP` ceiling; we use a large constant (no build can exceed
 * it) so the clamp never binds here. Although her DB instance carries the A4
 * `ConditionAscensionChar(4)` gate, every build is A6 and we do not thread an
 * ascension type (Mizuki/Emilie precedent) — the slider being `> 0` is the real
 * gate. This is a NEUVILLETTE-only input but lives in the global registry (like the
 * BoL stat) so the setting→stat emit is shared infra, decoupled from the
 * post-effect; it is gated on its own char-specific setting → inert for every other
 * character and every golden.
 *
 * Source: raw/genshin_calc_pub/src/js/db/Char/Neuvillette.js:309-324 (ConditionNumber)
 *         raw/genshin_calc_pub/src/js/classes/Condition/Number.js:58-70 (getStats)
 *         raw/genshin_calc_pub/src/js/classes/Stats.js:327-336 (isPercent — no match)
 */
const neuvilletteDisciplineSlider: Condition = {
  type: "number",
  name: "neuvillette_the_high_arbitrators_discipline",
  max: 1_000_000,
};

/**
 * All global character conditions, in source order (imaginarium_theatre, then the Elemental
 * Resonance buffs in ElementalResonance.js order, then set_other team buffs from
 * Buffs/Artifacts.js, then weapon_other off-field weapon team buffs from Buffs/Weapons.js).
 * Wire into buildStats alongside `char.conditions` and `extraConditions`.
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
  ...setArchaicPetra4DmgConditions,
  setOtherScrollCinderCity4Tier1,
  setOtherScrollCinderCity4Tier2,
  // Song of Days Past 4pc (team) — the healing-recorded INPUT (the multiplier is in
  // CHARACTER_MULTIPLIERS). Inert unless `party_days_past_healing_recorded > 0`.
  setOtherSongOfDaysPast4HealingInput,
  // weapon_other off-field weapon team buffs (Buffs/Weapons.js) — inert unless the gate
  // level setting is published via partyContext (weaponOther) or supplied in settings.
  weaponOtherThrillingTales,
  weaponOtherWolfsGravestone,
  // Task 7b — simple off-field weapon buffs (ConditionLevelSelect / 1-slot PartyWeapon, no statName).
  weaponOtherWhiteDragonRing,
  weaponOtherForestSanctuary,
  weaponOtherStillwoodMoonshadow,
  weaponOtherStarcallersWatch,
  weaponOtherSymphonistOfScents,
  weaponOtherThousandFloatingDreams,
  weaponOtherElegyForTheEnd,
  weaponOtherSongOfBrokenPines,
  weaponOtherFreedomSworn,
  // BoL/stat input emits (ConditionBoLStat + Neuvillette's A4 slider) — global
  // setting→stat conditions read by per-char post-effects (Clorinde C4 / Neuvillette
  // A4). Each gated on its own input being > 0 → inert for every golden.
  bondOfLifeStat,
  neuvilletteDisciplineSlider,
];

/**
 * The universal manual-buff escape-hatch. Her DB.Buffs.ElementalResonance carries one always-present
 * ConditionCustomBuffs that loops `custom_buffs.<key>` settings and additively injects each suffix as
 * a RAW stat into the bag. Applied like CHARACTER_CONDITIONS (a global on every build); folds {}
 * unless a `custom_buffs.*` setting is present, so it is inert for every base build.
 * Source: raw/.../db/Buffs/ElementalResonance.js:70-74, raw/.../classes/Condition/CustomBuffs.js
 */
export const CUSTOM_BUFFS_CONDITION: Condition = { type: "custom-buffs" };

// ===========================================================================
// Global ENEMY conditions — faithfully ported from
// raw/genshin_calc_pub/src/js/db/Conditions/Enemy.js (the stat-bearing entries).
//
// In her engine the Enemy CalcObject's getConditions() does
// `result = result.concat(DB.Conditions.Enemy)` (CalcObject/Enemy.js:71-77), and
// CalcSet.getBaseStats folds EVERY object's conditions — char, weapon, artifacts,
// ENEMY, … — into the same base-stats bag (CalcSet.js:357-363). So these are
// "appended to every build", gated by their own boolean `name`, exactly like
// CHARACTER_CONDITIONS (which mirror DB.Conditions.Character). They are a DISTINCT
// source file, so they live in their own registry here.
//
// Only ONE Enemy condition carries stats: `enemy.superconduct → enemy_res_phys:-40`
// (Superconduct lowers the enemy's Physical RES by 40%). The others
// (common.enemy_status, enemy_frozen, enemy_burning, enemy_weak_shot) carry no
// `stats` (their effects are applied elsewhere: enemy_status/frozen via set/char
// conditions that GATE on them; burning via Emilie's A4 postEffect; weak_shot via
// the aimed crit branch in compileFeature), so they are not represented here.
//
// KEY MAPPING: her `enemy_res_phys` is `enemy_res_physical` in our bag — our engine
// keys physical resistance by the full element name (see compileFeature.ts
// dmgElementKey note + the ELEMENTS loop in buildStats), exactly as Deepwood's
// `enemy_res_dendro:-30` shred does. The -40 accumulates into the same
// `enemy_res_physical` value the resistance multiplier reads.
//
// Base-inert: gated on `enemy.superconduct`, unset in all 58k goldens → folds {}.
//
// Source: raw/genshin_calc_pub/src/js/db/Conditions/Enemy.js:65-73
//         raw/genshin_calc_pub/src/js/classes/CalcObject/Enemy.js:71-77 (getConditions concat)
//         raw/genshin_calc_pub/src/js/classes/CalcSet.js:357-363 (getBaseStats folds enemy conds)
// ===========================================================================
export const ENEMY_CONDITIONS: readonly Condition[] = [
  {
    type: "boolean",
    name: "enemy.superconduct",
    stats: { enemy_res_physical: -40 },
  },
];

// ===========================================================================
// Global character MULTIPLIERS — the team-buff analogue of CHARACTER_CONDITIONS,
// for set_other buffs whose effect is a FeatureMultiplier (a base-damage-term
// bonus) rather than a stat-bag condition. In her engine these live in the same
// Buffs/Artifacts.js buff her ConditionNumber/ConditionBoolean above do, on the
// buff's `multipliers` array; CalcObjectCharacter merges every buff's multipliers
// into the active char's `data.multipliers` (Feature2.getMultipliers), so they
// behave exactly like a char-level ("targeted") CharMultiplier — summed into each
// matching feature's base term, gated by their own `condition` + `target`.
//
// Threaded into compileCharacter via buildStats' BuildResult (the party harness
// passes them as `extraMultipliers`), so the gate evaluates against the SAME
// merged settings the conditions saw. Each is gated on a `set_other.*` toggle, so
// the whole channel is INERT for every non-party build (no toggle set → no match).
//
// Source: raw/genshin_calc_pub/src/js/db/Buffs/Artifacts.js:362-381
// ===========================================================================

/**
 * Song of Days Past 4pc (team) — per-hit base bonus = 8% × recorded healing.
 *
 * Faithful port of the FeatureMultiplier in Buffs/Artifacts.js:363-380:
 *   scaling: 'party_days_past_healing_recorded'  (NO `*` → reads the RAW bag value the
 *            ConditionNumber injected, not `<key>_total`)
 *   values:  ValueTable([8])  (leveling absent → level 1 → 8% as a fraction = 0.08)
 *   target:  damageTypes [normal, charged, plunge, skill, burst]
 *   condition: AND(
 *     NOT(set_bonus.song_of_days_past_4 AND PiecesCount('SongOfDaysPast', 4)),  // not self-worn
 *     set_other.song_of_days_past_4                                             // a teammate wears it
 *   )
 * The NOT-self-worn arm keeps this from double-counting against the active char's own
 * self-worn 4pc (which has its own set-level multiplier in song-of-days-past.ts). For
 * the party fixture the rep does NOT wear the set, so NOT(false AND false) = true and the
 * team buff fires: base term += 0.08 × stats.get('party_days_past_healing_recorded').
 */
const setOtherSongOfDaysPast4Multiplier: CharMultiplier = {
  source: "artifacts",
  scaling: "party_days_past_healing_recorded",
  leveling: "",
  values: { getValue: (): number => 8 },
  target: { damageTypes: ["normal", "charged", "plunge", "skill", "burst"] },
  condition: {
    type: "and",
    items: [
      {
        type: "not",
        items: [
          { type: "boolean", name: "set_bonus.song_of_days_past_4" },
          { type: "pieces-count", setName: "SongOfDaysPast", count: 4 },
        ],
      },
      { type: "boolean", name: "set_other.song_of_days_past_4" },
    ],
  },
};

/**
 * All global character MULTIPLIERS (set_other FeatureMultiplier team buffs). Threaded
 * into compileCharacter as `extraMultipliers` by the caller (the party harness via the
 * BuildResult). Inert for every build that sets no matching `set_other.*` toggle.
 */
export const CHARACTER_MULTIPLIERS: readonly CharMultiplier[] = [
  setOtherSongOfDaysPast4Multiplier,
];

// ===========================================================================
// Global character POST-EFFECTS — the team-buff analogue of CHARACTER_CONDITIONS
// for off-field weapon buffs whose value is a CONVERSION of a TEAMMATE's stat
// (EM / HP / DEF) into a buff on the active char. In her engine these are the
// `postEffects` array of the `weapons` DbObjectBuff (db/Buffs/Weapons.js:323-391)
// PLUS the `static` buff's PostEffectKhajNisut (db/Buffs/Static.js:33). Her
// CalcSet.getPostEffects() concats EVERY equipped object's post-effects — including
// these two always-present buffs — so they run in the SAME applyPostEffects pass as
// char / weapon / set post-effects.
//
// Each reads a TEAMMATE-STAT NUMBER from the stat bag (`fromStat`) and writes
// `ratio × that number` to the active char. The number reaches the bag as a user-
// supplied input (her ConditionPartyWeapon's ConditionNumber → `stats.add(statName,
// value)`; in this calculator, the caller supplies it in the build's `statBlock`).
// Gated on the off-field `weapon_other.*` toggle (published via PartyInput.weaponOther
// or supplied in settings), which is ALSO the `levelSetting` (refine index 1-5) that
// picks the ratio / cap table row. Absent toggle → the gate condition fails → the
// post-effect contributes {} → the channel is INERT for every non-party build (the
// base golden suite + all existing fixtures are byte-unchanged).
//
// Threaded into buildStats' applyPostEffects call (alongside char / weapon / set
// post-effects). Source-fidelity notes per effect below.
//
// Sources: raw/.../db/Buffs/Weapons.js:182-265 (gate + statName), :323-391 (PostEffectStats),
//          db/Buffs/Static.js:32-36 + classes/PostEffect/KhajNisut.js (the HP→mastery party fold).
// ===========================================================================

/** Refine-indexed ratio/cap table — `getValue(refine)` returns `values[refine-1]`. */
function refineTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[refine - 1] ?? 0 };
}

/**
 * Makhaira Aquamarine (`desert_pavilion`) — a teammate's EM → +ATK on the active char.
 *
 * Buffs/Weapons.js:348-354 (+`_2`/`_3` slots :356-370): `from: 'desert_pavilion_mastery'`,
 * `percent: StatTable('atk', [24,30,36,42,48] × 0.003)` keyed off `weapon_other.desert_pavilion`.
 * So `atk += teammate_EM × (0.072..0.144)`. `atk` is a REAL_TOTAL stat (not percent) → the bonus
 * is a flat ATK value, written raw (no /100), exactly as the bag carries flat ATK. Three party
 * slots share one ratio table; each is an independent gate/input (`_2`/`_3` for a 2nd/3rd wielder).
 */
function desertPavilionEffect(slot: "" | "_2" | "_3"): CharPostEffect {
  const gate = `weapon_other.desert_pavilion${slot}`;
  return {
    priority: 1,
    fromStat: `desert_pavilion_mastery${slot}`,
    toStat: "atk",
    ratioFromTalent: {
      table: refineTable([24 * 0.003, 30 * 0.003, 36 * 0.003, 42 * 0.003, 48 * 0.003]),
      levelSetting: gate,
      multi: 1,
    },
    conditions: [{ type: "boolean", name: gate }],
  };
}

/**
 * Xiphos' Moonlight (`whisper_of_the_jinn`) — a teammate's EM → +Energy Recharge on the active char.
 *
 * Buffs/Weapons.js:324-346 (3 slots): `from: 'whisper_of_the_jinn_mastery'`,
 * `percent: StatTable('recharge', [3.6,4.5,5.4,6.3,7.2] × 0.003)` keyed off `weapon_other.whisper_of_the_jinn`.
 * So `recharge += teammate_EM × (0.0108..0.0216)`.
 *
 * NO-DELTA (oracle-proven): recharge drives a DAMAGE term only for the few characters whose
 * features convert ER% → damage (Raiden A4, Mona A4, Eula, Engulfing Lightning). For every other
 * character the recharge bonus moves no damage triple. The Group B oracle proves this on Diluc
 * (`weapon-other-whisper-of-the-jinn.json` is byte-identical to base Diluc on every hit). The
 * effect is still modelled faithfully (so an ER-scaling rep WOULD see it), but it lands no delta
 * here. CAVEAT: `recharge` is an isPercent stat in her engine (her post-effect pre-divides /100),
 * whereas buildStats emits `recharge_total` as a raw number; this divergence is immaterial because
 * recharge feeds no damage path for any v5.8 rep that would receive this off-field buff, but it
 * means the emitted `recharge_total` stat would be 100× hers IF an ER-scaling consumer were paired
 * with this buff — out of scope (no such pairing exists in v5.8). Recorded for the ④ follow-up.
 */
function whisperOfTheJinnEffect(slot: "" | "_2" | "_3"): CharPostEffect {
  const gate = `weapon_other.whisper_of_the_jinn${slot}`;
  return {
    priority: 1,
    fromStat: `whisper_of_the_jinn_mastery${slot}`,
    toStat: "recharge",
    ratioFromTalent: {
      table: refineTable([3.6 * 0.003, 4.5 * 0.003, 5.4 * 0.003, 6.3 * 0.003, 7.2 * 0.003]),
      levelSetting: gate,
      multi: 1,
    },
    conditions: [{ type: "boolean", name: gate }],
  };
}

/**
 * Peak Patrol Song (off-field, `weapon_peak_patrol_song`) — a teammate's DEF → +all-7-elemental
 * DMG% on the active char, each capped.
 *
 * Buffs/Weapons.js:372-390: `from: 'peak_patrol_song_def'`, `percent: [StatTable('dmg_<el>',
 * [0.008,0.01,0.012,0.014,0.016])]` for all 7 elements, `statCap: StatTable('', [25.6,32,38.4,44.8,
 * 51.2])`, keyed off `weapon_other.weapon_peak_patrol_song`, gated AND `NOT(weapon_peak_patrol_song_2)`.
 * So per element: `dmg_<el> += min(teammate_DEF × (0.008..0.016), 25.6..51.2)`. `dmg_<el>` is an
 * isPercent stat → her post-effect pre-divides the ratio AND the cap by 100, writing a fraction;
 * buildStats writes the RAW PERCENT and applies the /100 at emit (the ring-of-ceiba convention), so
 * the TS ratio/cap are the RAW table values. Modelled as 7 separate post-effects (one per element),
 * each with its own `capValueFromTalent` (the cap is applied per converted element, her getTree loop).
 *
 * The `NOT(weapon_peak_patrol_song_2)` sub-condition prevents double-count with the SELF-wielder's
 * own Peak Patrol Song passive (peak-patrol-song.ts, gated `weapon_peak_patrol_song_2`): when the
 * active char wields Peak Patrol Song its own DEF→dmg_own post-effect fires, so the OFF-FIELD team
 * version must NOT also fire. Single slot (no `_2`/`_3`).
 */
const PEAK_PATROL_ELEMENTS = [
  "anemo",
  "electro",
  "pyro",
  "cryo",
  "hydro",
  "geo",
  "dendro",
] as const;
const peakPatrolSongEffects: readonly CharPostEffect[] = PEAK_PATROL_ELEMENTS.map((el) => ({
  priority: 1,
  fromStat: "peak_patrol_song_def",
  toStat: `dmg_${el}`,
  ratioFromTalent: {
    table: refineTable([0.008, 0.01, 0.012, 0.014, 0.016]),
    levelSetting: "weapon_other.weapon_peak_patrol_song",
    multi: 1,
  },
  capValueFromTalent: {
    table: refineTable([25.6, 32, 38.4, 44.8, 51.2]),
    levelSetting: "weapon_other.weapon_peak_patrol_song",
  },
  conditions: [
    { type: "boolean", name: "weapon_other.weapon_peak_patrol_song" },
    { type: "not", items: [{ type: "boolean", name: "weapon_peak_patrol_song_2" }] },
  ],
}));

/**
 * Key of Khaj-Nisut (off-field, `weapon_key_of_khaj_nisut`) — a teammate's HP → +EM on the active char.
 *
 * db/Buffs/Static.js:33 + classes/PostEffect/KhajNisut.js: the PARTY path returns the teammate HP
 * (`settings['sunken_song_of_the_sands_hp']`) as the base and `percent: StatTable('mastery',
 * [0.002,0.0025,0.003,0.0035,0.004])` keyed off `weapon_other.weapon_key_of_khaj_nisut`. So
 * `mastery += teammate_HP × (0.002..0.004)`. `mastery` is NOT an isPercent stat → written raw.
 *
 * Her KhajNisut reads the teammate HP from SETTINGS; this TS port reads it from the BAG (`fromStat:
 * 'sunken_song_of_the_sands_hp'`) so it shares the uniform bag-input path with the other three
 * (the caller supplies the HP in the build's statBlock). Gated on the off-field toggle (the same
 * gate is the `levelSetting`). The self-wielder's own KhajNisut HP→EM fold is the weapon file's
 * PostEffectStatsHP (key-of-khaj-nisut weapon, gated `weapon_key_of_khaj_nisut`); the party gate
 * is distinct (`weapon_other.weapon_key_of_khaj_nisut`), so no double-count. Single slot.
 */
const keyOfKhajNisutEffect: CharPostEffect = {
  priority: 1,
  fromStat: "sunken_song_of_the_sands_hp",
  toStat: "mastery",
  ratioFromTalent: {
    table: refineTable([0.002, 0.0025, 0.003, 0.0035, 0.004]),
    levelSetting: "weapon_other.weapon_key_of_khaj_nisut",
    multi: 1,
  },
  conditions: [{ type: "boolean", name: "weapon_other.weapon_key_of_khaj_nisut" }],
};

/**
 * All global character POST-EFFECTS (off-field weapon teammate-stat conversions). Threaded into
 * buildStats' applyPostEffects call. Inert for every build that sets no matching `weapon_other.*`
 * toggle (the gate condition fails → {} contribution → base golden suite byte-unchanged).
 */
export const CHARACTER_POST_EFFECTS: readonly CharPostEffect[] = [
  desertPavilionEffect(""),
  desertPavilionEffect("_2"),
  desertPavilionEffect("_3"),
  whisperOfTheJinnEffect(""),
  whisperOfTheJinnEffect("_2"),
  whisperOfTheJinnEffect("_3"),
  ...peakPatrolSongEffects,
  keyOfKhajNisutEffect,
];
