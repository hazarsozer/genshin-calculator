/**
 * Sethos — electro bow ATK+mastery scaler.
 *
 * 3-hit normal combo (n2: 2-hit multihit → children _2_1/_2_2), bow aimed shot,
 * fully-charged aimed shot (electro), Shadow Piercing Shot (ATK + mastery scaling),
 * plunge/low/high, electro skill.
 *
 * STANCE SWAP: Twilight Meditation (`sethos_twilight_meditation`, ConditionBoolean toggle)
 * transforms the three ground normals into ELECTRO CHARGED hits (same talent tables, explicit
 * electro element), and gates the ground normals + aimed shots + Shadow Piercing Shot OFF. Her
 * engine gates the ground set with ConditionNot([toggle]) and the meditation set with
 * ConditionBoolean(it). While meditation is up, a char-level Dusk Bolt mastery multiplier
 * (s3.p1, target charged) adds a per-mastery% term to those charged hits. Both stances are
 * modelled; the golden/fixture build has the toggle OFF (the ground normals produced).
 *
 * Shadow Piercing Shot (sethos_shadowpiercing_shot_dmg): uses two multipliers —
 *   1. ATK-based: s1.p7 at char_skill_attack
 *   2. mastery-based: s1.p8 at char_skill_attack (scaling:'mastery*')
 * A4 "The Sand King's Boon" adds +700 mastery as a 3rd multiplier, but it is
 * gated by ConditionBoolean (sethos_sand_king_boon) — OFF in the canonical build.
 * critRateBonuses: ['crit_rate_sethos'] — from C1 (inactive at C0, reads 0).
 *
 * No burst damage feature: burst.sethos_twilight_shadowpiercer only provides a
 * mastery bonus to charged hits inside burst mode (multipliers-level, conditional).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Sethos.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Sethos)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Sethos)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Sethos as SethosStatTable } from "../generated/charTables.js";
import { Sethos as SethosTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return SethosTalents.s1.p1;
      if (name === "normal_hit_2_1") return SethosTalents.s1.p2;
      if (name === "normal_hit_2_2") return SethosTalents.s1.p3;
      if (name === "normal_hit_3") return SethosTalents.s1.p4;
      if (name === "aimed") return SethosTalents.s1.p5;
      if (name === "charged_aimed") return SethosTalents.s1.p6;
      if (name === "sethos_shadowpiercing_shot_dmg") return SethosTalents.s1.p7;
      if (name === "sethos_shadowpiercing_shot_mastery") return SethosTalents.s1.p8;
      if (name === "plunge") return SethosTalents.s1.p9;
      if (name === "plunge_low") return SethosTalents.s1.p10;
      if (name === "plunge_high") return SethosTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return SethosTalents.s2.p1;
    }
    if (talent === "burst") {
      // Twilight Shadowpiercer: per-mastery% bonus added to CHARGED hits while meditation is up.
      if (name === "sethos_dusk_bolt_dmg_increase") return SethosTalents.s3.p1;
    }
    throw new Error(`sethos talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Twilight Meditation STANCE toggle
// ---------------------------------------------------------------------------
// When ON, Sethos's ground bow moveset (normals + aimed + Shadow Piercing Shot) is replaced
// by a "meditation" moveset: the same three normal-attack tables become ELECTRO CHARGED hits.
// Her engine gates the ground set with ConditionNot([sethos_twilight_meditation]) and the
// meditation set with ConditionBoolean(it). The meditation hits carry an EXPLICIT electro
// element (no infusion setting), and — via a char-level mastery multiplier gated on the
// stance (targeting charged) — an extra Dusk Bolt mastery term. raw Sethos.js:134-315, 385-395.
const STANCE: Condition = { type: "boolean", name: "sethos_twilight_meditation" };
const NOT_STANCE: Condition = { type: "not", items: [{ type: "boolean", name: "sethos_twilight_meditation" }] };

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Ground normal attacks (physical, gated OFF in meditation) ---
  // raw: FeatureDamageNormal normal_hit_1 (Sethos.js:134-145, cond:ConditionNot[twilight])
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
    condition: NOT_STANCE,
  },
  // raw: FeatureDamageMultihit normal_hit_2 (2 sub-hits). Sethos.js:146-172
  {
    name: "normal_hit_2",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_2") }] },
    ],
    condition: NOT_STANCE,
  },
  // raw: FeatureDamageNormal normal_hit_2_1 (isChild:true → emit as standalone). Sethos.js:173-184
  {
    name: "normal_hit_2_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_1") }],
    condition: NOT_STANCE,
  },
  // raw: FeatureDamageNormal normal_hit_2_2 (isChild:true → emit as standalone). Sethos.js:185-196
  {
    name: "normal_hit_2_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_2") }],
    condition: NOT_STANCE,
  },
  // raw: FeatureDamageNormal normal_hit_3 (Sethos.js:197-207, cond:ConditionNot[twilight])
  {
    name: "normal_hit_3",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
    condition: NOT_STANCE,
  },
  // --- Bow aimed shots (gated OFF in meditation) ---
  // raw: FeatureDamageChargedAimed aimed (physical). Sethos.js:276-286
  {
    name: "aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
    condition: NOT_STANCE,
  },
  // raw: FeatureDamageChargedAimed charged_aimed (electro). Sethos.js:287-297
  {
    name: "charged_aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_aimed") }],
    condition: NOT_STANCE,
  },
  // --- Shadow Piercing Shot (electro) — gated OFF in meditation ---
  // raw: FeatureDamageCharged sethos_shadowpiercing_shot_dmg. Sethos.js:299-322
  // Two active multipliers: ATK% (p7) + mastery% (p8).
  // A4 mastery bonus (ConditionBoolean sethos_sand_king_boon) is OFF at canonical C0 build.
  // critRateBonuses: C1 'crit_rate_sethos' — inactive at C0, reads 0.
  {
    name: "sethos_shadowpiercing_shot_dmg",
    category: "attack",
    damageType: "charged",
    element: "electro",
    critRateBonuses: ["crit_rate_sethos"],
    multipliers: [
      { leveling: "char_skill_attack", values: talents.get("attack.sethos_shadowpiercing_shot_dmg") },
      { scaling: "mastery", leveling: "char_skill_attack", values: talents.get("attack.sethos_shadowpiercing_shot_mastery") },
    ],
    condition: NOT_STANCE,
  },
  // ========================================================================
  // TWILIGHT MEDITATION moveset — the same three normal tables as ELECTRO CHARGED hits,
  // gated ON. Explicit electro element (no infusion). char_skill_attack leveling. Each hit,
  // being damageType 'charged', also picks up the char-level Dusk Bolt mastery multiplier
  // (below, gated on the stance). raw Sethos.js:208-315.
  // ========================================================================
  {
    name: "normal_hit_1",
    category: "attack",
    damageType: "charged",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
    condition: STANCE,
  },
  // normal_hit_2: 2-hit multihit as electro charged. raw Sethos.js:216-243.
  {
    name: "normal_hit_2",
    category: "attack",
    damageType: "charged",
    element: "electro",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_2") }] },
    ],
    condition: STANCE,
  },
  {
    name: "normal_hit_2_1",
    category: "attack",
    damageType: "charged",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_1") }],
    condition: STANCE,
  },
  {
    name: "normal_hit_2_2",
    category: "attack",
    damageType: "charged",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_2") }],
    condition: STANCE,
  },
  {
    name: "normal_hit_3",
    category: "attack",
    damageType: "charged",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
    condition: STANCE,
  },
  // --- Plunge attacks ---
  // raw: FeatureDamagePlungeCollision plunge. Sethos.js:323-330
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_low. Sethos.js:331-338
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high. Sethos.js:339-346
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: The Thundering Sands (electro) ---
  // raw: FeatureDamageSkill skill_dmg (electro). Sethos.js:347-355
  {
    name: "skill_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Sealed Shrine's Spiritsong": ConditionStatic — crit_rate_sethos: 15 (always-on).
//    Raw cons[0]: ConditionStatic{ stats:{ crit_rate_sethos: TalentValues.C1CritRate=15 } }
//    sethos_shadowpiercing_shot_dmg already carries critRateBonuses:['crit_rate_sethos'].
// C2 "Papyrus Scripture of Silent Secrets": ConditionStacks toggle (dmg_electro) → SKIP.
// C3 "Guided by the Falcon's Eye": +3 Normal Attack talent levels.
//    Raw cons[2]: Condition{ settings:{ char_skill_attack_bonus:3 } }
// C4 "Beneficent Plumage": ConditionBoolean toggle (mastery) → SKIP.
// C5 "Pylon of the Sojourning Sun Temple": +3 Elemental Burst talent levels.
//    Raw cons[4]: Condition{ settings:{ char_skill_burst_bonus:3 } }
// C6 "Pylon of the Sojourning Sun Temple": ConditionStatic with no real stats → SKIP.
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/Sethos.js:398-463

const constellationConditions: readonly Condition[] = [
  // C1: crit_rate_sethos +15 (always-on ConditionStatic).
  // sethos_shadowpiercing_shot_dmg already has critRateBonuses:['crit_rate_sethos'] → picks this up.
  { type: "constellation", constellation: 1, stats: { crit_rate_sethos: 15 } },
  // C2 "Papyrus Scripture of Silent Secrets": +15% dmg_electro PER STACK (max 2), a self
  // ConditionStacks gated at C≥2. Base-inert unless sethos_papyrus_scripture_of_silent_secrets
  // is set (0 stacks → no bonus). raw Sethos.js:409-424 (cons[1]).
  {
    type: "stacks",
    name: "sethos_papyrus_scripture_of_silent_secrets",
    maxStacks: 2,
    stats: { dmg_electro: 15 },
    condition: { type: "constellation", constellation: 2 },
  },
  // C3: +3 Normal Attack (Cooling Treatment bow normals).
  // Raw cons[2]: new Condition({ settings: { char_skill_attack_bonus: 3 } }).
  { type: "constellation", constellation: 3, settings: { char_skill_attack_bonus: 3 } },
  // C4 "Beneficent Plumage" (SELF): +80 Elemental Mastery to Sethos herself, a self
  // ConditionBoolean gated at C≥4 (lifts her mastery-scaled Shadow Piercing / meditation Dusk
  // Bolt terms + EM reactions). The party mirror lives in partyData. raw Sethos.js:427-441 (cons[3]).
  {
    type: "boolean",
    name: "sethos_beneficent_plumage",
    stats: { mastery: 80 },
    condition: { type: "constellation", constellation: 4 },
  },
  // C5: +3 Elemental Burst (The Thundering Sands burst).
  // Raw cons[4]: new Condition({ settings: { char_skill_burst_bonus: 3 } }).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const sethos: DbObjectChar = {
  name: "sethos",
  gameId: 10000097,
  rarity: 4,
  element: "electro",
  weapon: "bow",
  origin: "sumeru",
  statTable: SethosStatTable,
  talents,
  features,
  // Twilight Shadowpiercer (Dusk Bolt): while meditation is up, a per-mastery% bonus (s3.p1,
  // char_skill_burst-leveled) is added to the base term of every CHARGED-type hit — i.e. the
  // meditation electro charged normals. Gated on the stance + targeted at damageType 'charged';
  // inert otherwise. raw Sethos.js:385-395 (char.multipliers, mastery* → target charged).
  multipliers: [
    {
      scaling: "mastery*",
      leveling: "char_skill_burst",
      values: talents.get("burst.sethos_dusk_bolt_dmg_increase"),
      source: "talent_burst",
      target: { damageTypes: ["charged"] },
      condition: STANCE,
    },
  ],
  conditions: constellationConditions,
  // C4 "Beneficent Plumage" — +80 Elemental Mastery to party.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Sethos.js:116,120,469-474
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { mastery: 80 },
        condition: { type: "boolean", name: "sethos_beneficent_plumage" },
      },
    ],
  },
};
