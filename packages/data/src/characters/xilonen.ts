/**
 * Xilonen — geo sword DEF scaler (Natlan, Nightsoul).
 *
 * In the fixed solo C0 build with `settings = {}`, the Nightsoul Blessing state
 * (`common.nightsoul_blessing_state`) is OFF. Her feature set is gated on that:
 *   - Normal/charged hits are gated by `ConditionNot(nightsoul)` → ACTIVE here,
 *     so they emit (ATK-scaled, physical/normal, no infusion at settings = {}).
 *   - The Source-Sample roller hits (`xilonen_roller_*`) are gated by
 *     `ConditionBoolean(nightsoul)` → INACTIVE → NOT emitted (and absent from the
 *     oracle fixture). They are NOT modelled.
 *
 * Plunge, skill (xilonen_rush_dmg), and burst (burst_dmg + xilonen_beat_dmg) are
 * DEF-scaled (`scaling: "def"`, her `scaling: 'def*'`). Skill/burst are geo.
 * `xilonen_beat_dmg` shares burst_dmg's table (s3.p5 == s3.p1).
 *
 * normal_hit_2 is a 2-hit multihit parent (sum of normal_hit_2_1 + normal_hit_2_2);
 * the two sub-hits are emitted as their own rows (her FeatureDamageNormal isChild,
 * dropped so each emits independently — both present in the fixture).
 *
 * Passives OFF at solo C0 (NOT folded):
 *   - A1 (`xilonen_netotiliztlis_echoes`): +30% dmg_normal/dmg_plunge gated by
 *     nightsoul + damage-mode boolean toggles → OFF. (Xilonen.js:451-464)
 *   - A4 (`xilonen_portable_armored_sheath`): +20% def_percent is a user boolean
 *     toggle (serializeId 3), OFF at baseline. (Xilonen.js:465-477)
 *
 * Skill geo-RES shred: a ConditionLevels keyed on char_skill_elemental, gated by
 * xilonen_sampler_geo AND xilonen_active_sampler_geo (both must be truthy).
 * Raw Xilonen.js:478-491. Talent table s2.p2 × -1:
 *   [−9,−12,−15,−18,−21,−24,−27,−30,−33,−36,−39,−42,−45,−48,−51]
 * At skill level 10 → enemy_res_geo:-36. xilonen_sampler_geo is always-on for geo Xilonen
 * (geo padding); xilonen_active_sampler_geo (C2 / nightsoul) is OFF at C0 solo, so the AND-gate
 * keeps the shred inert there. It is the SINGLE, dynamic res-shred — C2 activates it (skill 13 →
 * -45 in the constellations golden), retiring the former build-coupled enemy_res_geo:-45 fold.
 * Transcribed from raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js:5397.
 *
 * Skipped (display-only, empty damageType → not asserted by the golden harness):
 *   - burst.heal_dot, the C6 party heal (FeatureHeal, out of the TS feature model).
 *   - reaction.crystalize (geo shield/crystallize, damageType "").
 * Geo universals (reaction.electrocharged, reaction.shatter) are auto-emitted by
 * the engine from the element; they are not declared here.
 *
 * Constellations: C2 (dmg_all:50 + geo-sampler activation → dynamic res-shred), C3 (+3 skill),
 * C5 (+3 burst) are modelled; C1/C4/C6 are toggle/nightsoul-gated (OFF in the C6 golden config).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Xilonen.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Xilonen)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Xilonen)
 */

import type { CharMultiplier, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Xilonen as XilonenStatTable } from "../generated/charTables.js";
import { Xilonen as XilonenTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return XilonenTalents.s1.p1;
      // normal_hit_2 is two sub-hits (s1.p2, s1.p3)
      if (name === "normal_hit_2_1") return XilonenTalents.s1.p2;
      if (name === "normal_hit_2_2") return XilonenTalents.s1.p3;
      if (name === "normal_hit_3") return XilonenTalents.s1.p4;
      if (name === "charged_hit") return XilonenTalents.s1.p5;
      if (name === "plunge") return XilonenTalents.s1.p7;
      if (name === "plunge_low") return XilonenTalents.s1.p8;
      if (name === "plunge_high") return XilonenTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "xilonen_rush_dmg") return XilonenTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return XilonenTalents.s3.p1;
      if (name === "xilonen_beat_dmg") return XilonenTalents.s3.p5;
    }
    throw new Error(`xilonen talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (ATK-scaled, gated ON by ConditionNot(nightsoul)) ---
  // raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:178-188
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // normal_hit_2: FeatureDamageMultihit (2-hit parent = sub_1 + sub_2)
  // raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:189-215
  {
    name: "normal_hit_2",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_2") }] },
    ],
  },
  // normal_hit_2_1 / normal_hit_2_2: individual sub-hits (her isChild rows, dropped to emit)
  // raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:216-239
  {
    name: "normal_hit_2_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_1") }],
  },
  {
    name: "normal_hit_2_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_2") }],
  },
  // raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:240-250
  {
    name: "normal_hit_3",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // --- Charged attack (ATK-scaled, gated ON by ConditionNot(nightsoul)) ---
  // raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:291-301
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (DEF-scaled) ---
  // raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:302-328
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ scaling: "def", leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ scaling: "def", leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ scaling: "def", leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Yohual's Scratch (geo, DEF-scaled) ---
  // raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:329-338
  {
    name: "xilonen_rush_dmg",
    category: "skill",
    element: "geo",
    multipliers: [{ scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.xilonen_rush_dmg") }],
  },
  // --- Burst: Ocelotlicue Point! (geo, DEF-scaled) ---
  // raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:339-358
  {
    name: "burst_dmg",
    category: "burst",
    element: "geo",
    multipliers: [{ scaling: "def", leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  {
    name: "xilonen_beat_dmg",
    category: "burst",
    element: "geo",
    multipliers: [{ scaling: "def", leveling: "char_skill_burst", values: talents.get("burst.xilonen_beat_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Geo sampler availability (ConditionBooleanXilonen — geo padding)
// ---------------------------------------------------------------------------
// Her ConditionBooleanXilonen.getData() (Condition/Boolean/Xilonen.js:7-36) ALWAYS sets
// `xilonen_sampler_<element>:1` for the sampler elements, UNCONDITIONALLY (regardless of the
// toggle's active state). getSamplers() (Xilonen.js:38-55) pads to 3 with 'geo' when no resonance element fills a
// slot; for solo geo Xilonen (char_element 'geo', not in the pyro/cryo/electro/hydro sampler
// set) the result is ['geo','geo','geo'] → `xilonen_sampler_geo:1` is set on EVERY build.
// `xilonen_active_sampler_geo` is the SEPARATE gate, turned on only when the sampler is ACTIVE
// (the nightsoul toggle, or C2's cons[0]). Modelled here as an always-active static condition
// publishing `xilonen_sampler_geo:1` (the solo-geo case; resonance-element samplers are a party
// concern handled by partyData). MUST be ordered before the res-shred staticLevel so its gate
// reads the published key. Base-safe: it only PUBLISHES a setting; no stat-bearing effect fires
// until `xilonen_active_sampler_geo` is also set (C2 / nightsoul), which no base build does.
const geoSamplerSetup: readonly Condition[] = [
  { type: "static", settings: { xilonen_sampler_geo: 1 } },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1: ConditionStatic, no real stats → SKIP.
// C2: dmg_all:50 (C2GeoBonus) + activate the geo sampler (turns the res-shred on) — see below.
// C3 "Tonalpohuallis Loop" — +3 Elemental Skill talent levels.
//   raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:417-424 (char-level conditions).
// C4: ConditionBoolean toggle (normal_base_def_percent/plunge_base_def_percent) → SKIP.
// C5 "Ocelotlicue Points (Improved)" — +3 Burst talent levels.
//   raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:598-605 (constellation[4]).
// C6: ConditionStatic gated by ConditionBoolean(nightsoul_blessing_state) subCondition (OFF) → SKIP.

const constellationConditions: readonly Condition[] = [
  // C2 "Yoalli's Scratching Tone" — activates the geo Source Sample: her cons[0]
  // (Xilonen.js:409-416) sets `xilonen_active_sampler_geo:1` gated ConditionConstellation(2).
  // With the geo sampler now ACTIVE (active_sampler_geo) AND available (sampler_geo, always-on
  // for geo), BOTH sampler-gated effects fire:
  //   • dmg_all:50 (C2GeoBonus) — her cons[1] (Xilonen.js:571-579), gated by the same samplers.
  //     A real FLAT constant (not build-coupled), kept here. Modelled constellation:2-gated:
  //     equivalent because C2 is exactly what turns the geo sampler on in this nightsoul-off config.
  //   • the geo RES-shred — emitted DYNAMICALLY by skillResShredConditions below (NOT folded here):
  //     it reads the live skill level so it is correct at any build (skill 10 → -36, skill 13 → -45).
  // This retires the former build-coupled `enemy_res_geo:-45` fold (Task 4b): the -45 was the shred
  // at skill 13 (10 + C3) — correct ONLY at the constellations C6 build. The dynamic shred below
  // reproduces -45 there (level 13) AND -36 at skill 10, firing EXACTLY ONCE per build.
  { type: "constellation", constellation: 2, stats: { dmg_all: 50 } },
  // C2 also publishes the active-sampler setting (her cons[0]) — split into a SEPARATE condition
  // mirroring the raw two-condition structure (cons[0] settings-publish, cons[1] dmg_all stat),
  // both ordered before the res-shred so the gate reads the propagated active-sampler key.
  { type: "constellation", constellation: 2, settings: { xilonen_active_sampler_geo: 1 } },
  // C3 — char_skill_elemental_bonus +3 (skill talent level up). MUST precede the res-shred so the
  // staticLevel resolves at skill 13 in the C6 config (her getSkillLevelByName adds `_bonus`).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 — char_skill_burst_bonus +3 (burst talent level up).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// Skill geo-RES shred condition (the SINGLE, dynamic res-shred)
// ---------------------------------------------------------------------------
// Raw Xilonen.js:478-491 — ONE ConditionLevels(levelSetting:'char_skill_elemental',
//   stats:[Talents.getMulti({name:'enemy_res_geo', from:'skill.xilonen_res_decrease', multi:-1})],
//   subConditions:[ConditionBoolean('xilonen_sampler_geo'), ConditionBoolean('xilonen_active_sampler_geo')]).
// Talent table s2.p2 (CharTalentTables.js:5397) multiplied by -1:
//   [−9,−12,−15,−18,−21,−24,−27,−30,−33,−36,−39,−42,−45,−48,−51]
// Her engine has exactly ONE res-shred, gated by the AND of both sampler booleans; C2 (or the
// nightsoul toggle) is what makes the geo sampler ACTIVE. There is NO separate C2 res-shred —
// so this single staticLevel is the faithful model (Task 4b unification): it fires ONCE for every
// build where both samplers are set, reading the LIVE skill level:
//   • C0 + samplers (xilonen_resshred fixture): skill 10 → enemy_res_geo[9] = -36 ✓
//   • C2 (constellations C6): active_sampler_geo from C2, sampler_geo always-on, skill 10+3(C3)=13
//     → enemy_res_geo[12] = -45 ✓ (reproduces the former -45 fold)
//   • C2 + explicit samplers (xilonen_c2_resshred fixture): skill 10 → -36, fired ONCE (no double).
// ORDERED LAST so its staticLevel level + gate read the propagated char_skill_elemental_bonus (C3)
// and xilonen_active_sampler_geo (C2) — mirroring her engine, where the constellation conditions
// precede the char res-shred condition (probe-verified: C6 → enemy_res_geo -45 at level 13).
const skillResShredConditions: readonly Condition[] = [
  {
    type: "static-level",
    levelSetting: "char_skill_elemental",
    levelStats: {
      enemy_res_geo: [-9, -12, -15, -18, -21, -24, -27, -30, -33, -36, -39, -42, -45, -48, -51],
    },
    condition: {
      type: "and",
      items: [
        { type: "boolean", name: "xilonen_sampler_geo" },
        { type: "boolean", name: "xilonen_active_sampler_geo" },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// partyData — teammate kit buff (P3.5.2 Bucket C).
// Source: raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:624-824
// Scope: C4 "Suchitl's Trance" — Xilonen's DEF-scaled damage bonus applied to
// the recipient's normal/charged/plunge hits. Conditions ported = ONLY the lift
// the multiplier reads + the master gate. Other conditions deferred to variant-rep pass.
// ---------------------------------------------------------------------------

// C4DefDmgBonus constant: 65 (raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:162)
const C4_DEF_DMG_BONUS = 65;

const xilonenPartyMultipliers: readonly CharMultiplier[] = [
  // C4: xilonen_def_total% × xilonen_def_total added to each NORMAL/CHARGED/PLUNGE
  // hit of the recipient (no element filter — any element qualifies).
  // raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:813-822
  {
    source: "xilonen",
    scaling: "xilonen_def_total",
    leveling: "",
    values: { getValue: (): number => C4_DEF_DMG_BONUS },
    condition: { type: "boolean", name: "party.xilonen_suchitls_trance" },
    target: { damageTypes: ["normal", "charged", "plunge"] },
  } satisfies CharMultiplier,
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const xilonen: DbObjectChar = {
  name: "xilonen",
  gameId: 10000103,
  rarity: 5,
  element: "geo",
  weapon: "sword",
  origin: "natlan",
  statTable: XilonenStatTable,
  talents,
  features,
  multipliers: [],
  // Order is load-bearing: sampler availability + constellation settings (active sampler, C3
  // talent bonus) are published FIRST, then the res-shred staticLevel reads them (level + gate).
  conditions: [...geoSamplerSetup, ...constellationConditions, ...skillResShredConditions],
  partyData: {
    loadStats: {
      stats: ["def_total"],
      settings: ["char_skill_elemental"],
    },
    conditions: [
      // Lift Xilonen's def_total (partyStat) into recipient bag as `xilonen_def_total`.
      // raw: ConditionNumber({name:'xilonen_def_total', partyStat:'def_total', max:10000}).
      { type: "number", name: "xilonen_def_total", max: 10000 },
    ],
    multipliers: xilonenPartyMultipliers,
  },
};
