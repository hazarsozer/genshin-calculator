/**
 * Xilonen — geo sword DEF scaler (Natlan, Nightsoul).
 *
 * In the fixed solo C0 build with `settings = {}`, the Nightsoul Blessing state
 * (`common.nightsoul_blessing_state`) is OFF. Her feature set is gated on that:
 *   - Normal/charged hits are gated by `ConditionNot(nightsoul)` → ACTIVE here,
 *     so they emit (ATK-scaled, physical/normal, no infusion at settings = {}).
 *   - The Source-Sample roller hits (`xilonen_roller_*`) are gated by
 *     `ConditionBoolean(nightsoul)` → INACTIVE at settings={} → NOT emitted at
 *     baseline (present under nightsoul — see nightsoulConditions/moveset swap below).
 *
 * Plunge, skill (xilonen_rush_dmg), and burst (burst_dmg + xilonen_beat_dmg) are
 * DEF-scaled (`scaling: "def"`, her `scaling: 'def*'`). Skill/burst are geo.
 * `xilonen_beat_dmg` shares burst_dmg's table (s3.p5 == s3.p1).
 *
 * normal_hit_2 is a 2-hit multihit parent (sum of normal_hit_2_1 + normal_hit_2_2);
 * the two sub-hits are emitted as their own rows (her FeatureDamageNormal isChild,
 * dropped so each emits independently — both present in the fixture).
 *
 * NIGHTSOUL cluster (Tartaglia stance-swap precedent — `Feature.condition` gates
 * feature PRESENCE, already a shipped core primitive, no core change):
 *   - `common.nightsoul_blessing_state` toggle (raw Xilonen.js:425-434) publishes
 *     `attack_infusion:'geo'` + `xilonen_active_sampler_geo:1` — modelled below as
 *     `nightsoulConditions`. This flips the (already-geo) skill/burst's res-shred-target
 *     element unchanged, and geo-infuses the plunge.
 *   - normal_hit_1/2/2_1/2_2/3 + charged_hit gain `condition: NOT(nightsoul)` (were
 *     unconditional) and 4 new DEF-scaled roller `FeatureDamageNormal` rows
 *     (`xilonen_roller_1..4`, s1.p10-p13, `condition: nightsoul`) replace them — raw
 *     Xilonen.js:251-290. BASE-INERT: baseline builds have nightsoul OFF → NOT(nightsoul)
 *     passes (unchanged), nightsoul boolean fails (rollers absent) → byte-identical.
 *   - A1 "Netotiliztli's Echoes" (`xilonen_netotiliztlis_echoes`, Xilonen.js:451-464):
 *     +30% dmg_normal/dmg_plunge gated AND(nightsoul, xilonen_damage_mode). The
 *     ascension-1 subcondition is dropped per the fixed-max-ascension convention
 *     (see kachina.ts A1 precedent) — always true at any rep build. dmg_normal lifts
 *     the rollers too (they are plain FeatureDamageNormal, category "attack", implicit
 *     damageType "normal" — same lane as normal_hit_1..3). `xilonen_damage_mode` /
 *     `xilonen_support_mode` are NOT free-standing toggles: they are COMPUTED by her
 *     `ConditionBooleanXilonen.getData` (Condition/Boolean/Xilonen.js:23-27) from
 *     `otherElementsCnt` (count of the 4 sampler elements among char_element +
 *     resonance_element_1-3, the SAME 4 slots `elements-count`'s RESONANCE_SLOTS reads) —
 *     `>=2` -> support_mode, else damage_mode. Modelled as two `elements-count`
 *     publishers mirroring `geoSamplerSetup`'s count/invert pattern (damageModeSetup).
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
 * Non-damage output: burst.heal_dot — DEF-scaled burst heal, modelled as output:{kind:"heal"}
 *   (P3.5.3). other.xilonen_heal_on_hit — C6-gated DEF-scaled party heal-on-hit, modelled
 *   (display-gap burndown Task 5).
 * Skipped (display-only, empty damageType → not asserted by the golden harness):
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
      if (name === "xilonen_roller_1_dmg") return XilonenTalents.s1.p10;
      if (name === "xilonen_roller_2_dmg") return XilonenTalents.s1.p11;
      if (name === "xilonen_roller_3_dmg") return XilonenTalents.s1.p12;
      if (name === "xilonen_roller_4_dmg") return XilonenTalents.s1.p13;
    }
    if (talent === "skill") {
      if (name === "xilonen_rush_dmg") return XilonenTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return XilonenTalents.s3.p1;
      if (name === "xilonen_beat_dmg") return XilonenTalents.s3.p5;
      if (name === "heal_dot_percent") return XilonenTalents.s3.p2;
      if (name === "heal_dot_flat")    return XilonenTalents.s3.p3;
    }
    throw new Error(`xilonen talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Nightsoul stance-swap gates (Tartaglia precedent — Feature.condition)
// ---------------------------------------------------------------------------
const NIGHTSOUL: Condition = { type: "boolean", name: "common.nightsoul_blessing_state" };
const NOT_NIGHTSOUL: Condition = { type: "not", items: [NIGHTSOUL] };

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (ATK-scaled, gated OFF by ConditionNot(nightsoul)) ---
  // raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:178-188
  {
    name: "normal_hit_1",
    category: "attack",
    condition: NOT_NIGHTSOUL,
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // normal_hit_2: FeatureDamageMultihit (2-hit parent = sub_1 + sub_2)
  // raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:189-215
  {
    name: "normal_hit_2",
    category: "attack",
    condition: NOT_NIGHTSOUL,
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
    condition: NOT_NIGHTSOUL,
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_1") }],
  },
  {
    name: "normal_hit_2_2",
    category: "attack",
    condition: NOT_NIGHTSOUL,
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_2") }],
  },
  // raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:240-250
  {
    name: "normal_hit_3",
    category: "attack",
    condition: NOT_NIGHTSOUL,
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // --- Charged attack (ATK-scaled, gated OFF by ConditionNot(nightsoul)) ---
  // raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:291-301
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    condition: NOT_NIGHTSOUL,
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Nightsoul Source-Sample roller hits (DEF-scaled, gated ON by nightsoul) ---
  // raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:251-290 — 4 FeatureDamageNormal rows
  // (category "attack", implicit damageType "normal"), scaling 'def*'/char_skill_attack,
  // replacing the moveset above 1:1 while nightsoul is active.
  {
    name: "xilonen_roller_1_dmg",
    category: "attack",
    condition: NIGHTSOUL,
    multipliers: [{ scaling: "def", leveling: "char_skill_attack", values: talents.get("attack.xilonen_roller_1_dmg") }],
  },
  {
    name: "xilonen_roller_2_dmg",
    category: "attack",
    condition: NIGHTSOUL,
    multipliers: [{ scaling: "def", leveling: "char_skill_attack", values: talents.get("attack.xilonen_roller_2_dmg") }],
  },
  {
    name: "xilonen_roller_3_dmg",
    category: "attack",
    condition: NIGHTSOUL,
    multipliers: [{ scaling: "def", leveling: "char_skill_attack", values: talents.get("attack.xilonen_roller_3_dmg") }],
  },
  {
    name: "xilonen_roller_4_dmg",
    category: "attack",
    condition: NIGHTSOUL,
    multipliers: [{ scaling: "def", leveling: "char_skill_attack", values: talents.get("attack.xilonen_roller_4_dmg") }],
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
  // --- Burst heal (FeatureHeal): burst.heal_dot — DEF-scaled (s3.p2 % DEF + s3.p3 flat) ---
  // raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:359-368 (FeatureMultiplierList scaling:'def*', char_skill_burst).
  {
    name: "heal_dot",
    category: "burst",
    output: { kind: "heal" },
    multipliers: [
      { scaling: "def", leveling: "char_skill_burst", values: talents.get("burst.heal_dot_percent"), flatValues: talents.get("burst.heal_dot_flat") },
    ],
  },
  // --- C6 "Imperishable Night Carnival" heal-on-hit party heal (other.xilonen_heal_on_hit) ---
  // Raw: FeatureHeal, category:'other', partyHeal:true, scaling:'def*', leveling:'char_skill_burst',
  // values: StatTable('xilonen_heal_on_hit', [C6DefHeal=120]) — a fixed 120% DEF (single-entry
  // StatTable, constant regardless of level), gated ConditionConstellation(6).
  // raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:369-378.
  {
    name: "xilonen_heal_on_hit",
    category: "other",
    output: { kind: "heal", partyHeal: true },
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      { scaling: "def", leveling: "char_skill_burst", values: { getValue: () => 120 } },
    ],
  },
];

// ---------------------------------------------------------------------------
// C6 "Imperishable Night Carnival" self DEF-scaled dmg bonus (nightsoul-gated).
// ---------------------------------------------------------------------------
// raw Xilonen.js:395-406 — a char-level FeatureMultiplier (self scaling 'def*',
// no leveling → flat ValueTable([300])), AND(nightsoul, constellation 6), targeting
// normal+plunge damageTypes. Lifts the nightsoul rollers (damageType "normal") too.
// (The C6 heal-on-hit text_percent_heal / normal_base_def_percent duplicate label in
// the constellation array (Xilonen.js:607-621) is the SAME stat — her ConditionStatic
// there is display-only text; the real stat-bearing term is this top-level multiplier.)
const C6_DEF_DMG_BONUS = 300; // raw Xilonen.js:164 C6DefDmgBonus

const xilonenSelfMultipliers: readonly CharMultiplier[] = [
  {
    source: "constellation6",
    scaling: "def",
    leveling: "",
    values: { getValue: (): number => C6_DEF_DMG_BONUS },
    condition: { type: "and", items: [NIGHTSOUL, { type: "constellation", constellation: 6 }] },
    target: { damageTypes: ["normal", "plunge"] },
  } satisfies CharMultiplier,
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
//
// getSamplers (Xilonen.js:38-55) pads to 3 with 'geo' ONLY while fewer than 3 real (non-geo)
// samplers were found among the 4 slots (char_element + resonance_element_1/2/3; geo itself is
// excluded from samplersElements, so Xilonen's own char_element never counts). The party-axis
// gap: this padding is unconditional here, but her engine SUPPRESSES it once the party supplies
// >= 3 non-geo sampler elements (pyro/hydro/cryo/electro) via the 3 resonance slots. Gated with
// the existing `elements-count` Condition (inverted): active iff count(pyro,hydro,cryo,electro) < 3.
// Solo/no-party -> count 0 < 3 -> unchanged (padding still fires) -> base-inert.
const geoSamplerSetup: readonly Condition[] = [
  {
    type: "static",
    settings: { xilonen_sampler_geo: 1 },
    condition: { type: "elements-count", element: ["pyro", "hydro", "cryo", "electro"], count: 3, invert: true },
  },
];

// ---------------------------------------------------------------------------
// Nightsoul Blessing toggle publish (raw Xilonen.js:425-434, self conditions[2])
// ---------------------------------------------------------------------------
// `common.nightsoul_blessing_state` (serializeId 1) publishes attack_infusion:'geo'
// (geo-infuses the normal-attack-class plunge; skill/burst are already geo) and
// xilonen_active_sampler_geo:1 (activates the self geo res-shred alongside
// xilonen_sampler_geo, which is always-on for solo geo Xilonen — geoSamplerSetup).
const nightsoulSetup: readonly Condition[] = [
  {
    type: "static",
    settings: { xilonen_active_sampler_geo: 1, attack_infusion: "geo" },
    condition: NIGHTSOUL,
  },
];

// ---------------------------------------------------------------------------
// Damage/Support mode publish (her ConditionBooleanXilonen.getData, always-on —
// Condition/Boolean/Xilonen.js:23-27) + A1 "Netotiliztli's Echoes" dmg bonus.
// ---------------------------------------------------------------------------
// otherElementsCnt = count of the 4 sampler elements (pyro/hydro/cryo/electro) among
// char_element + resonance_element_1-3 — the SAME 4 slots `elements-count` reads
// (RESONANCE_SLOTS). >=2 -> support_mode, else damage_mode. Solo/no-party -> count 0
// -> damage_mode (matches her getSamplers default: char_element geo, no resonance).
const A1_ATTACK_BONUS = 30; // raw Xilonen.js:156 A1AttackBonus

const damageModeSetup: readonly Condition[] = [
  {
    type: "static",
    settings: { xilonen_damage_mode: 1 },
    condition: { type: "elements-count", element: ["pyro", "hydro", "cryo", "electro"], count: 2, invert: true },
  },
  {
    type: "static",
    settings: { xilonen_support_mode: 1 },
    condition: { type: "elements-count", element: ["pyro", "hydro", "cryo", "electro"], count: 2 },
  },
  // A1 (Xilonen.js:451-464): +30% dmg_normal/dmg_plunge, AND(nightsoul, damage_mode).
  // dmg_normal also lifts the rollers (plain FeatureDamageNormal, damageType "normal").
  // The raw ascension-1 subcondition is dropped — always true at any rep build (fixed
  // max ascension; see kachina.ts A1 "Mountain Echoes" precedent).
  {
    type: "static",
    stats: { dmg_normal: A1_ATTACK_BONUS, dmg_plunge: A1_ATTACK_BONUS },
    condition: { type: "and", items: [NIGHTSOUL, { type: "boolean", name: "xilonen_damage_mode" }] },
  },
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
  //   • dmg_all:50 (C2GeoBonus) — her cons[1] (Xilonen.js:571-579), explicitly AND-gated in raw on
  //     BOTH `xilonen_sampler_geo` AND `xilonen_active_sampler_geo` (the SAME AND-gate as the
  //     res-shred below) — NOT bare constellation:2. Previously modelled as unconditional-at-C2
  //     (sound only while `xilonen_sampler_geo` was itself unconditional); the resonance-sampler
  //     party-axis gate (geoSamplerSetup) makes `xilonen_sampler_geo` suppressible when >=3 non-geo
  //     teammates are present, so this must now carry the same explicit AND-gate to stay faithful
  //     (evaluateConstellation ignores a nested `.condition`, so this is a `static` + `and[...]`).
  //   • the geo RES-shred — emitted DYNAMICALLY by skillResShredConditions below (NOT folded here):
  //     it reads the live skill level so it is correct at any build (skill 10 → -36, skill 13 → -45).
  // This retires the former build-coupled `enemy_res_geo:-45` fold (Task 4b): the -45 was the shred
  // at skill 13 (10 + C3) — correct ONLY at the constellations C6 build. The dynamic shred below
  // reproduces -45 there (level 13) AND -36 at skill 10, firing EXACTLY ONCE per build.
  //
  // C2 also publishes the active-sampler setting (her cons[0]) — split into a SEPARATE condition
  // mirroring the raw two-condition structure (cons[0] settings-publish, cons[1] dmg_all stat).
  // ORDERED BEFORE the dmg_all gate below so its AND-gate reads the propagated active-sampler key
  // (same propagation discipline as the res-shred, which is also ordered after this publish).
  { type: "constellation", constellation: 2, settings: { xilonen_active_sampler_geo: 1 } },
  {
    type: "static",
    stats: { dmg_all: 50 },
    condition: {
      type: "and",
      items: [
        { type: "constellation", constellation: 2 },
        { type: "boolean", name: "xilonen_sampler_geo" },
        { type: "boolean", name: "xilonen_active_sampler_geo" },
      ],
    },
  },
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
// Source Sampling — teammate per-element enemy-RES shred (P3.5 / Wave 2).
// Source: raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:698-767
//         raw/genshin_calc_pub/src/js/classes/Condition/Boolean/Xilonen.js (samplers)
// ---------------------------------------------------------------------------
// Her Source Sampling team mechanic: while Xilonen's Nightsoul Blessing ("Source
// Sampling") is active, the active char's hits gain a per-element enemy RES shred
// scaled by Xilonen's Elemental Skill level. The shredded elements are her "samplers":
// the active char's element + the team's resonance elements (filtered to the four
// non-geo sampler elements {pyro,cryo,electro,hydro}), padded to length 3 with geo.
//
// Faithful model of getSamplers' CHAR-ELEMENT + geo-padding branch (samplers =
// [active_char_element, geo, geo]):
//   • xilonen_sampler_geo is ALWAYS published (her pad-to-3 with geo).
//   • xilonen_sampler_<el> (el ∈ {pyro,hydro,cryo,electro}) is published when the
//     active char IS that element (char-element gate) — getSamplers' first slot.
//   • xilonen_active_sampler_<el> is published when the master toggle
//     `party.xilonen_samplers` is ON (her ConditionBooleanXilonen.isActive), AND the
//     element is a sampler (geo: always a sampler; the four: char-element-gated).
//   • the five ConditionLevels res-shreds: enemy_res_<el> = -skill.xilonen_res_decrease
//     at level `xilonen_char_skill_elemental`, each gated AND(sampler_<el>, active_sampler_<el>).
//
// DEFERRED (needs a new core/types primitive — STOP-flagged, not forced): the
// RESONANCE-element branch of getSamplers (a same-element TEAMMATE adding a non-geo
// sampler) requires reading resonance_element_1/2/3 to publish a per-element setting —
// her custom ConditionBooleanXilonen. No existing Condition variant expresses
// "≥1 teammate of element E" (the `resonance` gate fires only on a DUO, count ≥ 2).
// Those extra samplers shred elements OTHER than the active char's, so they do not
// bind to a single-element active char's own (compared) damage. Also deferred: the
// alternative geo activators (party.xilonen_blessing_state, xilonen_chiucue_mix) and
// the C2 chiucue-mix recipient stat bonuses (Xilonen.js:768-811) — variant-rep / C2 pass.
//
// Inert unless Xilonen is a TEAMMATE with the toggle ON: published only via partyData
// (no golden has a party → 7353 root goldens byte-identical), and the res-shred needs
// BOTH sampler_<el> AND active_sampler_<el> (active_sampler requires the toggle).

// skill.xilonen_res_decrease = CharTalentTables Xilonen.s2.p2 × -1 (line 5397). The SAME
// table the self res-shred uses, applied per element. Skill 10 → -36 ; skill 13 → -45.
const XILONEN_RES_SHRED = [-9, -12, -15, -18, -21, -24, -27, -30, -33, -36, -39, -42, -45, -48, -51];

const SAMPLER_ELEMENTS = ["pyro", "hydro", "cryo", "electro"] as const;

const sourceSamplingConditions: readonly Condition[] = [
  // sampler availability — geo is ALWAYS a sampler (getSamplers pads to 3 with geo).
  { type: "static", settings: { xilonen_sampler_geo: 1 } },
  // ...the active char's own element, when it is one of the four non-geo samplers.
  ...SAMPLER_ELEMENTS.map(
    (el): Condition => ({
      type: "static",
      settings: { [`xilonen_sampler_${el}`]: 1 },
      condition: { type: "char-element", elements: [el] },
    })
  ),
  // active samplers — published when the master Source Sampling toggle is ON.
  {
    type: "static",
    settings: { xilonen_active_sampler_geo: 1 },
    condition: { type: "boolean", name: "party.xilonen_samplers" },
  },
  ...SAMPLER_ELEMENTS.map(
    (el): Condition => ({
      type: "static",
      settings: { [`xilonen_active_sampler_${el}`]: 1 },
      condition: {
        type: "and",
        items: [
          { type: "boolean", name: "party.xilonen_samplers" },
          { type: "char-element", elements: [el] },
        ],
      },
    })
  ),
  // the five per-element team RES shreds (one ConditionLevels per element, Xilonen.js:698-767).
  // Ordered LAST so the AND-gate booleans read the propagated sampler/active-sampler settings.
  ...(["geo", ...SAMPLER_ELEMENTS] as const).map(
    (el): Condition => ({
      type: "static-level",
      levelSetting: "xilonen_char_skill_elemental",
      levelStats: { [`enemy_res_${el}`]: XILONEN_RES_SHRED },
      condition: {
        type: "and",
        items: [
          { type: "boolean", name: `xilonen_sampler_${el}` },
          { type: "boolean", name: `xilonen_active_sampler_${el}` },
        ],
      },
    })
  ),
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
  multipliers: xilonenSelfMultipliers,
  // Order is load-bearing: sampler availability + nightsoul/damage-mode publish + constellation
  // settings (active sampler, C3 talent bonus) are published FIRST, then the res-shred
  // staticLevel reads them (level + gate).
  conditions: [
    ...geoSamplerSetup,
    ...nightsoulSetup,
    ...damageModeSetup,
    ...constellationConditions,
    ...skillResShredConditions,
  ],
  partyData: {
    loadStats: {
      stats: ["def_total"],
      settings: ["char_skill_elemental"],
    },
    conditions: [
      // Lift Xilonen's def_total (partyStat) into recipient bag as `xilonen_def_total`.
      // raw: ConditionNumber({name:'xilonen_def_total', partyStat:'def_total', max:10000}).
      { type: "number", name: "xilonen_def_total", max: 10000 },
      // Source Sampling per-element team RES shred (samplers + the five ConditionLevels).
      ...sourceSamplingConditions,
    ],
    multipliers: xilonenPartyMultipliers,
  },
};
