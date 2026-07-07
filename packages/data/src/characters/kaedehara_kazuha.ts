/**
 * Kaedehara Kazuha — anemo sword.
 *
 * 5-hit normal combo (n3 is a 2-table multihit → children _3_1/_3_2; n5 is a
 * 3-hit multihit of one table → child _5_1), charged (2-table multihit
 * charged_hit_total → children _1/_2), and TWO plunge families:
 *   - physical plunge / plunge_low / plunge_high (her plain FeatureDamagePlunge*),
 *   - the burst-state ANEMO plunge: kazuha_plunge (collision) + kazuha_plunge_low/
 *     high (shockwave), plus the A1 "Soumon Swordsmanship" absorbed-element
 *     variants kazuha_plunge_{cryo,electro,hydro,pyro} — each a FLAT 200% ATK
 *     plunge shockwave (ValueTable([200]), source 'ascension1', auto-active at A6).
 * Anemo skill (press_dmg / hold_dmg), anemo burst (kazuha_slashing_dmg + dot_dmg
 * + absorbed-element anemoskill_{cryo,electro,hydro,pyro}_dmg, all on s3.p3).
 *
 * ELEMENTS: normals + charged are PHYSICAL (her FeatureDamageNormal/Charged carry
 * no element; no infusion in the solo C0 build). Confirmed against the oracle:
 * normal_hit_1 implied talent% = 0.8891 (= s1.p1 L10 / 100) only when treated as
 * physical (dmg_phys 4% + dmg_normal 8%); the anemo reading gives a non-table
 * 0.9220. The kazuha_plunge family + skill + burst are explicitly anemo. The
 * physical-vs-anemo split is exactly the 25/26 (≈0.9615) ratio between plunge and
 * kazuha_plunge in the fixture (physical RES/dmg_phys vs anemo). The engine derives
 * all of this from `element` — no manual fudge.
 *
 * NOT MODELLED (faithfully — engine/harness handle or filter these):
 *   - reaction.* (swirl_cryo/electro/hydro/pyro, overloaded, superconduct,
 *     electrocharged, hyperbloom, burgeon, burning, shatter, rupture): emitted
 *     generically from element='anemo' by the loader's transformative-reaction
 *     catalog, not declared per-character.
 *   - other.kazuha_elemental_bonus (A4 EM-scaled cryo dmg% display): a
 *     FeaturePostEffectValue stat-readout (format 'percent', empty damageType) —
 *     the golden harness filters non-damage-triple entries, and the engine has no
 *     post-effect-value output channel. Its value (9.0131) is a display only.
 *   - A4 "Poetics of Fuubutsu" elemental-dmg buffs: gated on the
 *     poetics_of_fuubutsu dropdown (OFF in solo) → contribute nothing here.
 *   - C0 build: all constellations skipped.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Kazuha.js:161-502
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Kazuha)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Kazuha)
 */

import type { CharPostEffect, Condition, DbObjectChar, Feature, TalentResolver, TalentTable } from "@genshin/types";
import { Kazuha as KazuhaStatTable } from "../generated/charTables.js";
import { Kazuha as KazuhaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return KazuhaTalents.s1.p1;
      if (name === "normal_hit_2") return KazuhaTalents.s1.p2;
      if (name === "normal_hit_3_1") return KazuhaTalents.s1.p3;
      if (name === "normal_hit_3_2") return KazuhaTalents.s1.p4;
      if (name === "normal_hit_4") return KazuhaTalents.s1.p5;
      if (name === "normal_hit_5") return KazuhaTalents.s1.p6;
      if (name === "charged_hit_1") return KazuhaTalents.s1.p7;
      if (name === "charged_hit_2") return KazuhaTalents.s1.p8;
      if (name === "plunge") return KazuhaTalents.s1.p10;
      if (name === "plunge_low") return KazuhaTalents.s1.p11;
      if (name === "plunge_high") return KazuhaTalents.s1.p12;
    }
    if (talent === "skill") {
      if (name === "press_dmg") return KazuhaTalents.s2.p1;
      if (name === "hold_dmg") return KazuhaTalents.s2.p3;
    }
    if (talent === "burst") {
      if (name === "kazuha_slashing_dmg") return KazuhaTalents.s3.p1;
      if (name === "dot_dmg") return KazuhaTalents.s3.p2;
      if (name === "anemoskill_elemental_dmg") return KazuhaTalents.s3.p3;
    }
    throw new Error(`kazuha talents: unknown path '${path}'`);
  },
};

// A1 absorbed-element plunge: a flat 200% ATK shockwave (her ValueTable([200]),
// source 'ascension1'). Constant table — the talent level is irrelevant.
// raw/genshin_calc_pub/src/js/db/Char/Kazuha.js:131 (A1PlungeDmg = 200), :363-406.
const a1PlungeValue: TalentTable = { getValue: () => 200 };

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (PHYSICAL — no element on her FeatureDamageNormal) ---
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  // normal_hit_3: 2-sub-hit multihit with two DIFFERENT tables (_3_1=p3, _3_2=p4).
  // raw: FeatureDamageMultihit({ items: [{ [p3] }, { [p4] }] }) → parent = sum.
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }] },
    ],
  },
  // Sub-hits of normal_hit_3 (raw marks them isChild; de-childed so they emit).
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }],
  },
  {
    name: "normal_hit_3_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }],
  },
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // normal_hit_5: 3-hit multihit of one table (p6 × 3). raw: items:[{ hits:3, [p6] }].
  // Modelled as three item entries so the parent total = 3 × (p6% × ATK).
  {
    name: "normal_hit_5",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }] },
    ],
  },
  // normal_hit_5_1: one sub-hit of normal_hit_5 (single p6). raw isChild → de-childed.
  {
    name: "normal_hit_5_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
  },
  // --- Charged attack: 2-table multihit (charged_hit_total = c1 + c2) ---
  // raw damageType 'charged'; children charged_hit_1/_2 de-childed.
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }] },
    ],
  },
  {
    name: "charged_hit_1",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }],
  },
  {
    name: "charged_hit_2",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }],
  },
  // --- Plunge attacks: PHYSICAL family (collision + low/high shockwave) ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Plunge attacks: burst-state ANEMO family (same plunge tables, anemo) ---
  {
    name: "kazuha_plunge",
    category: "attack",
    damageType: "plunge",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "kazuha_plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "kazuha_plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // A1 absorbed-element plunge shockwaves: flat 200% ATK, one per element.
  {
    name: "kazuha_plunge_hydro",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "hydro",
    multipliers: [{ leveling: "ascension1", values: a1PlungeValue }],
  },
  {
    name: "kazuha_plunge_pyro",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "pyro",
    multipliers: [{ leveling: "ascension1", values: a1PlungeValue }],
  },
  {
    name: "kazuha_plunge_cryo",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "cryo",
    multipliers: [{ leveling: "ascension1", values: a1PlungeValue }],
  },
  {
    name: "kazuha_plunge_electro",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "electro",
    multipliers: [{ leveling: "ascension1", values: a1PlungeValue }],
  },
  // --- Skill: Chihayaburu (anemo) ---
  {
    name: "press_dmg",
    category: "skill",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.press_dmg") }],
  },
  {
    name: "hold_dmg",
    category: "skill",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.hold_dmg") }],
  },
  // --- Burst: Kazuha Slash (anemo) ---
  {
    name: "kazuha_slashing_dmg",
    category: "burst",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.kazuha_slashing_dmg") }],
  },
  {
    name: "dot_dmg",
    category: "burst",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.dot_dmg") }],
  },
  // Burst absorbed-element variants: pyro/hydro/cryo/electro, all share s3.p3.
  {
    name: "anemoskill_pyro_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.anemoskill_elemental_dmg") }],
  },
  {
    name: "anemoskill_hydro_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.anemoskill_elemental_dmg") }],
  },
  {
    name: "anemoskill_cryo_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.anemoskill_elemental_dmg") }],
  },
  {
    name: "anemoskill_electro_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.anemoskill_elemental_dmg") }],
  },
  // --- A4 "Poetics of Fuubutsu" static readout: other.kazuha_elemental_bonus = EM-scaled elemental DMG% ---
  // FeaturePostEffectValue(PostEffectStatsMastery, percent=StatTable('dmg_cryo',[A4ElementalBonus=0.04])),
  // format:'percent'. The percent StatTable is a percent-stat (isPercent→/100) → effective per-EM coeff 0.0004;
  // ×EM then ×100 (percent display) nets to displayed% = 0.04×EM. Modelled scaling:mastery, values=
  // A4ElementalBonus×100=4 → term = (4/100)×mastery = 0.04×EM = the displayed value.
  // raw/genshin_calc_pub/src/js/db/Char/Kazuha.js:489-492,132 (A4ElementalBonus=0.04)
  {
    name: "kazuha_elemental_bonus",
    category: "other",
    output: { kind: "static" },
    multipliers: [
      { scaling: "mastery", leveling: "", values: { getValue: () => 4 } },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Scarlet Hills": ConditionStatic text_percent_cd → display-only, SKIP.
// C2 "Yamaarashi Tailwind": ConditionBoolean mastery toggle → SKIP.
// C4 "Oozora Genpou": ConditionStatic no stats → display-only, SKIP.
// C6 "Crimson Momiji": TWO conditions in raw cons[5]:
//   1. Condition{ settings:{ allowed_infusion_anemo: 1 } } — ALWAYS-ON settings at C6.
//      Enables the infusion option for the character.
//   2. ConditionBoolean kaedehara_kazuha_crimson_momiji — TOGGLE for dmg% bonus
//      + attack_infusion_anemo:1 settings; the DMG bonus is via a PostEffectStatsMastery
//      (damageBonusPost) gated on both this toggle AND ConditionConstellation(6).
//      The toggle is OFF in the constellations fixture → SKIP the boolean part.
// The always-on C6 settings (`allowed_infusion_anemo`) is ported below.
//
// Source: raw/genshin_calc_pub/src/js/db/Char/Kazuha.js:612-684, :130-148

const constellationConditions: readonly Condition[] = [
  // C3 "Maple Monogatari": +3 levels to Chihayaburu (Elemental Skill).
  // Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus: 3 } }.
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 "Wisdom of Bansei": +3 levels to Kazuha Slash (Elemental Burst).
  // Raw cons[4]: Condition{ settings:{ char_skill_burst_bonus: 3 } }.
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
  // C6 "Crimson Momiji" (always-on part): unlocks anemo infusion option.
  // Raw cons[5]: standalone Condition{ settings:{ allowed_infusion_anemo: 1 } }.
  // No stats contributed; the crimson_momiji ConditionBoolean toggle (off in the
  // constellations fixture) carries the actual DMG bonus and attack_infusion_anemo.
  { type: "constellation", constellation: 6, settings: { allowed_infusion_anemo: 1 } },
  // C6 "Crimson Momiji" (toggle part): the ConditionBoolean kaedehara_kazuha_crimson_momiji
  // grants an ANEMO infusion on his normals/charged/plunge (raw attack_infusion_anemo:1 → our
  // simplified attack_infusion:"anemo") AND gates the EM→dmg_normal/charged/plunge conversion
  // (selfPostEffects below). Gated on constellation 6 (the toggle lives in raw cons[5] → the
  // constellation IS the gate; base-inert: no golden sets it). Source: raw Kazuha.js:660-684.
  {
    type: "boolean",
    name: "kaedehara_kazuha_crimson_momiji",
    settings: { attack_infusion: "anemo" },
    condition: { type: "constellation", constellation: 6 },
  },
];

// SELF Mastery→DMG stat CONVERSIONS (PostEffectStatsMastery) — the port modelled only the
// party.* mirror of A4 and SKIPPED the C6 self entirely → golden-blind SKIP. Data-only (existing
// CharPostEffect fixed-ratio + dropdown-element / boolean / constellation conditions; dmg_<key>
// folds /100 at emit, exactly like the already-ported party A4 entries).
//   A4 "Poetics of Fuubutsu": EM × 0.04 → dmg_<el> per swirl element, gated by the SELF dropdown
//     kaedehara_kazuha_poetics_of_fuubutsu (no party prefix). Mirrors the partyData A4 entries.
//     raw Kazuha.js:504-532 (A4ElementalBonus 0.04).
//   C6 "Crimson Momiji": EM × 0.2 → dmg_normal/charged/plunge, gated by the crimson_momiji
//     boolean AND constellation 6. raw Kazuha.js:138-148 (C6DmgBonus 0.2).
const selfPostEffects: readonly CharPostEffect[] = [
  // A4 — one entry per swirl element (the famous EM→elemental-DMG buff).
  {
    fromStat: "mastery",
    toStat: "dmg_cryo",
    ratio: 0.04,
    conditions: [{ type: "dropdown-element", name: "kaedehara_kazuha_poetics_of_fuubutsu", element: "cryo" }],
  },
  {
    fromStat: "mastery",
    toStat: "dmg_electro",
    ratio: 0.04,
    conditions: [{ type: "dropdown-element", name: "kaedehara_kazuha_poetics_of_fuubutsu", element: "electro" }],
  },
  {
    fromStat: "mastery",
    toStat: "dmg_hydro",
    ratio: 0.04,
    conditions: [{ type: "dropdown-element", name: "kaedehara_kazuha_poetics_of_fuubutsu", element: "hydro" }],
  },
  {
    fromStat: "mastery",
    toStat: "dmg_pyro",
    ratio: 0.04,
    conditions: [{ type: "dropdown-element", name: "kaedehara_kazuha_poetics_of_fuubutsu", element: "pyro" }],
  },
  // C6 — EM → normal/charged/plunge DMG, gated crimson_momiji + constellation 6.
  {
    fromStat: "mastery",
    toStat: "dmg_normal",
    ratio: 0.2,
    conditions: [
      { type: "boolean", name: "kaedehara_kazuha_crimson_momiji" },
      { type: "constellation", constellation: 6 },
    ],
  },
  {
    fromStat: "mastery",
    toStat: "dmg_charged",
    ratio: 0.2,
    conditions: [
      { type: "boolean", name: "kaedehara_kazuha_crimson_momiji" },
      { type: "constellation", constellation: 6 },
    ],
  },
  {
    fromStat: "mastery",
    toStat: "dmg_plunge",
    ratio: 0.2,
    conditions: [
      { type: "boolean", name: "kaedehara_kazuha_crimson_momiji" },
      { type: "constellation", constellation: 6 },
    ],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const kaedeharaKazuha: DbObjectChar = {
  name: "kaedehara_kazuha",
  gameId: 10000047,
  rarity: 5,
  element: "anemo",
  weapon: "sword",
  origin: "inazuma",
  statTable: KazuhaStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  postEffects: selfPostEffects,
  // partyData — teammate kit buffs (P3.5.2 Bucket B batch 1).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Kazuha.js:685-813
  partyData: {
    loadStats: {
      stats: ["mastery_total"],
    },
    // C2 "Yamaarashi Tailwind" (+200 EM, gated on the C2 toggle) is deferred to the
    // P3.5.2 variant-rep pass (ported together with its gated oracle rep).
    conditions: [
      // ConditionNumber: lifts the teammate's mastery_total into the bag as 'kazuha_mastery'.
      { type: "number", name: "kazuha_mastery", max: 10000 },
    ],
    postEffects: [
      // A4 "Poetics of Fuubutsu": EM → elemental DMG% bonus.
      // Each postEffect fires when the swirl-element dropdown equals the element.
      // Oracle bakes 'party.kaedehara_kazuha_poetics_of_fuubutsu' as a string value;
      // gated via dropdown-element consumer pattern (same as Venti C6 in venti.ts).
      // ratio 0.04 = A4ElementalBonus per point of EM (raw TalentValues.A4ElementalBonus:0.04).
      // Source: raw/genshin_calc_pub/src/js/db/Char/Kazuha.js:775-811
      {
        fromStat: "kazuha_mastery",
        toStat: "dmg_cryo",
        ratio: 0.04,
        conditions: [{ type: "dropdown-element", name: "party.kaedehara_kazuha_poetics_of_fuubutsu", element: "cryo" }],
      },
      {
        fromStat: "kazuha_mastery",
        toStat: "dmg_electro",
        ratio: 0.04,
        conditions: [{ type: "dropdown-element", name: "party.kaedehara_kazuha_poetics_of_fuubutsu", element: "electro" }],
      },
      {
        fromStat: "kazuha_mastery",
        toStat: "dmg_hydro",
        ratio: 0.04,
        conditions: [{ type: "dropdown-element", name: "party.kaedehara_kazuha_poetics_of_fuubutsu", element: "hydro" }],
      },
      {
        fromStat: "kazuha_mastery",
        toStat: "dmg_pyro",
        ratio: 0.04,
        conditions: [{ type: "dropdown-element", name: "party.kaedehara_kazuha_poetics_of_fuubutsu", element: "pyro" }],
      },
    ],
  },
};
