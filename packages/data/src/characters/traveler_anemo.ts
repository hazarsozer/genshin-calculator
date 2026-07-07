/**
 * Traveler (Anemo) — anemo sword ATK scaler with full elemental-absorb kit.
 *
 * 5-hit normal combo (physical sword). A1 "Slitting Wind" appends a flat 60%
 * ANEMO normal attack. Charged 2-hit multihit (charged_hit_total parent +
 * standalone charged_hit_1/_2 — the fixture lists all three independently, so the
 * children are emitted, NOT isChild). Plunge/low/high (physical).
 *
 * Skill "Palm Vortex" (Whirlwind) — four damage rows, each ATK-scaling anemo
 * (char_skill_elemental): traveler_initial_cutting_dmg, traveler_max_cutting_dmg,
 * traveler_initial_storm_dmg, traveler_max_storm_dmg. When the swirl absorbs an
 * element, each row additionally deals an absorbed-element hit at 0.25× the same
 * talent table (her scalingMultiplier:0.25, scalingSource:'talent_elemental'). The
 * fixture asserts all four pyro/hydro/cryo/electro variants of every skill row →
 * 4 base + 16 absorb = 20 skill rows. The 0.25× factor is reproduced by wrapping
 * the base TalentTable (the engine has no scalingMultiplier field; this is exact).
 * Electro variants read +2% (the stat block's dmg_electro) on top of the 0.25×,
 * matching the fixture's slightly-higher electro numbers automatically.
 *
 * Burst "Gust Surge" — anemo traveler_tornado_dmg (char_skill_burst) plus the
 * four absorbed-element variants anemoskill_<elem>_dmg, each the FULL anemoskill
 * talent table (s3.p2, no 0.25×), exactly like Venti's burst absorbs.
 *
 * NON-DAMAGE outputs:
 *   - skill.heal_dot: A4 "Second Wind" heal (2% max HP, auto-active at A6). Ported in P3.5.3.
 *
 * NOT MODELLED (faithful to fixed solo C0/A6 build):
 *   - The A1 condition's `text_percent_dmg:60` is a display-only `text_*` string,
 *     not a real dmg bonus (same as Traveler-Geo's A4); the 60% lives only in the
 *     slitting_wind feature's own multiplier, never in the stat bag.
 *   - swordfighting_techniques / special_training ConditionBooleans → toggle-gated,
 *     OFF at settings={}.
 *   - C6 traveler_intertwined_winds RES shred → constellation, skipped (C0 build).
 *
 * REACTIONS: the anemo transformative set (swirl_pyro/hydro/cryo/electro,
 * overloaded, superconduct, electrocharged, burning, rupture, hyperbloom, burgeon,
 * shatter) is appended generically by the loader from element 'anemo' — matching
 * the fixture's reaction rows; none are declared here.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/TravelerAnemo.js
 *   raw/genshin_calc_pub/src/js/db/Char/TravelerAnemo.js:184-194 (A1 slitting_wind, flat [60] anemo)
 *   raw/genshin_calc_pub/src/js/db/Char/TravelerAnemo.js:283-374 (skill base + 0.25× absorb maps)
 *   raw/genshin_calc_pub/src/js/db/Char/TravelerAnemo.js:392-414 (burst tornado + absorb map)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (TravelerAnemo)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier.js (scalingMultiplier)
 */

import type {
  Condition,
  DbObjectChar,
  Element,
  Feature,
  TalentResolver,
  TalentTable,
} from "@genshin/types";
import { Traveler as TravelerStatTable } from "../generated/charTables.js";
import { TravelerAnemo as TravelerAnemoTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return TravelerAnemoTalents.s1.p1;
      if (name === "normal_hit_2") return TravelerAnemoTalents.s1.p2;
      if (name === "normal_hit_3") return TravelerAnemoTalents.s1.p3;
      if (name === "normal_hit_4") return TravelerAnemoTalents.s1.p4;
      if (name === "normal_hit_5") return TravelerAnemoTalents.s1.p5;
      if (name === "charged_hit_1") return TravelerAnemoTalents.s1.p6;
      if (name === "charged_hit_2") return TravelerAnemoTalents.s1.p7;
      if (name === "plunge") return TravelerAnemoTalents.s1.p9;
      if (name === "plunge_low") return TravelerAnemoTalents.s1.p10;
      if (name === "plunge_high") return TravelerAnemoTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "traveler_initial_cutting_dmg") return TravelerAnemoTalents.s2.p1;
      if (name === "traveler_max_cutting_dmg") return TravelerAnemoTalents.s2.p2;
      if (name === "traveler_initial_storm_dmg") return TravelerAnemoTalents.s2.p3;
      if (name === "traveler_max_storm_dmg") return TravelerAnemoTalents.s2.p4;
    }
    if (talent === "burst") {
      if (name === "traveler_tornado_dmg") return TravelerAnemoTalents.s3.p1;
      if (name === "anemoskill_dmg") return TravelerAnemoTalents.s3.p2;
    }
    throw new Error(`traveler_anemo talents: unknown path '${path}'`);
  },
};

// A1 "Slitting Wind": constant 60% anemo normal-attack multiplier.
// raw: new FeatureMultiplier({ source:'ascension1', values: new StatTable('traveler_slitting_wind', [60]) })
// source:'ascension1' is not a leveling slot, so compileFeature reads getValue(1) = 60.
const slittingWindTable: TalentTable = { getValue: () => 60 };

// Absorbed-element skill variant: 0.25× the base skill talent table.
// raw: scalingMultiplier:0.25, scalingSource:'talent_elemental' (per-level, char_skill_elemental).
// Wrapping the base TalentTable reproduces the 0.25× exactly (no scalingMultiplier field).
function absorbSkillTable(base: TalentTable): TalentTable {
  return { getValue: (level: number) => base.getValue(level) * 0.25 };
}

// The four skill rows (base names) and the four absorbable elements.
const SKILL_NAMES = [
  "traveler_initial_cutting_dmg",
  "traveler_max_cutting_dmg",
  "traveler_initial_storm_dmg",
  "traveler_max_storm_dmg",
] as const;
const ABSORB_ELEMENTS: readonly Element[] = ["pyro", "hydro", "cryo", "electro"];

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical sword) ---
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
  {
    name: "normal_hit_3",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  {
    name: "normal_hit_5",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
  },
  // --- A1 Slitting Wind: flat 60% anemo normal attack (active at A6) ---
  // raw/genshin_calc_pub/src/js/db/Char/TravelerAnemo.js:184-194
  {
    name: "traveler_slitting_wind",
    category: "attack",
    damageType: "normal",
    element: "anemo",
    multipliers: [{ leveling: "ascension1", values: slittingWindTable }],
  },
  // --- Charged attacks ---
  // raw: FeatureDamageMultihit charged_hit_total (2-hit: p6 + p7)
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }] },
    ],
  },
  // raw: FeatureDamageCharged charged_hit_1/_2 (isChild in raw, but the fixture lists
  // them as independent features → emit them, do NOT mark isChild).
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
  // --- Plunge attacks (physical) ---
  // raw: FeatureDamagePlungeCollision plunge; FeatureDamagePlungeShockWave plunge_low/high
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
  // --- Skill: Palm Vortex (anemo) — 4 base rows ---
  // raw: SkillNames.map → FeatureDamageSkill({ element:'anemo', char_skill_elemental })
  ...SKILL_NAMES.map(
    (name): Feature => ({
      name,
      category: "skill",
      element: "anemo",
      multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill." + name) }],
    })
  ),
  // --- Skill absorb variants: 4 rows × 4 elements at 0.25× the base table ---
  // raw: ['pyro','hydro','cryo','electro'].map per SkillName → name.replace('_dmg','_<elem>_dmg'),
  //      element:<elem>, scalingMultiplier:0.25, scalingSource:'talent_elemental'.
  ...ABSORB_ELEMENTS.flatMap((elem) =>
    SKILL_NAMES.map(
      (name): Feature => ({
        name: name.replace("_dmg", `_${elem}_dmg`),
        category: "skill",
        element: elem,
        multipliers: [
          {
            leveling: "char_skill_elemental",
            values: absorbSkillTable(talents.get("skill." + name)),
          },
        ],
      })
    )
  ),
  // --- A4 "Second Wind": heal_dot (2% max HP, active at A6) ---
  // raw: FeatureHeal({ category:'skill', multipliers:[{ scaling:'hp*', source:'ascension4',
  //   values: new StatTable('heal_dot', [2]) }], condition:ConditionAscensionChar({ascension:4}) })
  // source:'ascension4' → leveling='ascension4'; getValue(1)=2. Auto-active at canonical A6 build.
  {
    name: "heal_dot",
    category: "skill",
    output: { kind: "heal" },
    multipliers: [
      { scaling: "hp", leveling: "ascension4", values: { getValue: () => 2 } },
    ],
  },
  // --- Burst: Gust Surge (anemo) ---
  // raw: FeatureDamageBurst traveler_tornado_dmg (anemo, char_skill_burst)
  {
    name: "traveler_tornado_dmg",
    category: "burst",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.traveler_tornado_dmg") }],
  },
  // Burst absorb variants: anemoskill_<elem>_dmg, each the FULL anemoskill table (s3.p2).
  // raw: ['pyro','hydro','cryo','electro'].map → FeatureDamageBurst({ name:'anemoskill_'+elem+'_dmg', element:elem, char_skill_burst })
  ...ABSORB_ELEMENTS.map(
    (elem): Feature => ({
      name: `anemoskill_${elem}_dmg`,
      category: "burst",
      element: elem,
      multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.anemoskill_dmg") }],
    })
  ),
];

// ---------------------------------------------------------------------------
// Constellations (P2.C)
// ---------------------------------------------------------------------------
// C1 "Raging Vortex": ConditionStatic with no real stats → SKIP (inert).
// C2 "Uprising Whirlwind": recharge +16. ConditionStatic (always-on at C2).
//    Raw cons[1]: ConditionStatic{ stats:{ recharge:16 } }
// C3 "Sweeping Gust": +3 Elemental Burst talent levels.
//    Raw cons[2]: Condition{ settings:{ char_skill_burst_bonus:3 } }
// C4 "Cherishing Breezes": text_percent_reduce:10 (display-only) → SKIP.
// C5 "Stirring Breeze": +3 Elemental Skill talent levels.
//    Raw cons[4]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
// SELF buffs (golden-blind SKIPPED — the port modelled only the party.* C6 mirror + skipped the
// two shared passive toggles entirely; all are OFF in the fixed solo build, so the 58k DAMAGE
// goldens never exercised them — a diff-parity sweep surfaced every Anemo hit diverging):
//   "Swordfighting Techniques" (traveler_swordfighting_techniques): +3 base ATK. Ungated. raw
//     TravelerAnemo.js:384-392.
//   "Special Training" (traveler_special_training): +7 base ATK, +15 EM, +50 base HP. Ungated. raw
//     TravelerAnemo.js:393-403.
//   C6 "Intertwined Winds" (traveler_intertwined_winds): enemy Anemo RES −20 (lifts her anemo hits +
//     anemo reactions) + a per-element RES −20 dropdown (traveler_intertwined_winds_element selects
//     cryo/electro/hydro/pyro → lifts that absorb variant + its reactions), gated at C6 (THE
//     CONSTELLATION IS A GATE). The SELF mirror of party.traveler_intertwined_winds (the dropdown is
//     party.* even on the self side in raw). raw TravelerAnemo.js:456-503.
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/TravelerAnemo.js:384-520

const constellationConditions: readonly Condition[] = [
  // C2: recharge +16. ConditionStatic{ stats:{ recharge:16 } }
  // Raw cons[1]: ConditionStatic{ stats:{ recharge:16 } }
  { type: "constellation", constellation: 2, stats: { recharge: 16 } },
  // C3: +3 Elemental Burst talent levels.
  // Raw cons[2]: Condition{ settings:{ char_skill_burst_bonus:3 } }
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 Elemental Skill talent levels.
  // Raw cons[4]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
  // SELF shared passives — +base ATK (every hit) + EM (reactions) + base HP (damage-inert here).
  // Ungated ConditionBooleans. raw TravelerAnemo.js:384-403.
  { type: "boolean", name: "traveler_swordfighting_techniques", stats: { atk_base: 3 } },
  { type: "boolean", name: "traveler_special_training", stats: { atk_base: 7, mastery: 15, hp_base: 50 } },
  // SELF C6 "Intertwined Winds" part 1 — enemy Anemo RES −20%. ConditionBoolean gated at C6 (THE
  // CONSTELLATION IS A GATE; base-inert below C6 / when untoggled). raw TravelerAnemo.js:456-464.
  {
    type: "boolean",
    name: "traveler_intertwined_winds",
    stats: { enemy_res_anemo: -20 },
    condition: { type: "constellation", constellation: 6 },
  },
  // SELF C6 part 2 — the absorbed-element RES −20 dropdown (single-select cryo/electro/hydro/pyro),
  // gated AND(dropdown==el, traveler_intertwined_winds, cons 6). Mirrors the partyData dropdown but
  // with the SELF toggle + the C6 gate. raw TravelerAnemo.js:465-503.
  ...(["cryo", "electro", "hydro", "pyro"] as const).map(
    (el): Condition => ({
      type: "static",
      stats: { [`enemy_res_${el}`]: -20 },
      condition: {
        type: "and",
        items: [
          { type: "dropdown-element", name: "traveler_intertwined_winds_element", element: el },
          { type: "boolean", name: "traveler_intertwined_winds" },
          { type: "constellation", constellation: 6 },
        ],
      },
    })
  ),
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const travelerAnemo: DbObjectChar = {
  name: "traveler_anemo",
  gameId: 10000005,
  rarity: 5,
  element: "anemo",
  weapon: "sword",
  origin: "foreign",
  statTable: TravelerStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // partyData — teammate kit buffs (P3.5.2 Bucket A, A-straggler)
  // C6 "Intertwined Winds" RES shred (mirrors Venti's C6 shape):
  //   part 1: party.traveler_intertwined_winds (boolean) → enemy_res_anemo:-20.
  //   part 2: party.traveler_intertwined_winds_element single-select dropdown-element →
  //     enemy_res_<el>:-20 for the chosen cryo/electro/hydro/pyro, gated on the part-1 boolean.
  //   Source: raw/genshin_calc_pub/src/js/db/Char/TravelerAnemo.js:507-562
  partyData: {
    conditions: [
      // C6 part 1: -20% anemo res.
      {
        type: "boolean",
        name: "party.traveler_intertwined_winds",
        stats: { enemy_res_anemo: -20 },
      },
      // C6 part 2: per-element RES shred — the traveler_intertwined_winds_element single-select
      // dropdown → enemy_res_<el>:-20, gated on traveler_intertwined_winds. Modeled with the
      // dropdown-element consumer pattern (cf. Venti C6). Raw TravelerAnemo.js:520-560.
      {
        type: "static",
        stats: { enemy_res_cryo: -20 },
        condition: { type: "and", items: [
          { type: "dropdown-element", name: "party.traveler_intertwined_winds_element", element: "cryo" },
          { type: "boolean", name: "party.traveler_intertwined_winds" },
        ] },
      },
      {
        type: "static",
        stats: { enemy_res_electro: -20 },
        condition: { type: "and", items: [
          { type: "dropdown-element", name: "party.traveler_intertwined_winds_element", element: "electro" },
          { type: "boolean", name: "party.traveler_intertwined_winds" },
        ] },
      },
      {
        type: "static",
        stats: { enemy_res_hydro: -20 },
        condition: { type: "and", items: [
          { type: "dropdown-element", name: "party.traveler_intertwined_winds_element", element: "hydro" },
          { type: "boolean", name: "party.traveler_intertwined_winds" },
        ] },
      },
      {
        type: "static",
        stats: { enemy_res_pyro: -20 },
        condition: { type: "and", items: [
          { type: "dropdown-element", name: "party.traveler_intertwined_winds_element", element: "pyro" },
          { type: "boolean", name: "party.traveler_intertwined_winds" },
        ] },
      },
    ],
  },
};
