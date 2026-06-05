/**
 * Lan Yan — anemo catalyst (Nightsoul), ATK + EM scaler.
 *
 * 4-hit normal combo (all anemo): n2 = 2-hit multihit (_2_1 + _2_2 children),
 * n3 = 2-hit multihit (_3_1 + _3_2 children, equal halves), n4 single. Charged is
 * a 3-hit multihit (charged_hit_total parent + single charged_hit child). Plunge /
 * low / high (anemo). Anemo skill (lanyan_feathermoon_ring_dmg) and burst (burst_dmg)
 * both carry an A4 flat-EM multiplier. A1 grants four element-absorb variants of the
 * skill ring (pyro/hydro/electro/cryo), each = 0.5× the base ring multiplier.
 *
 * A1 "Four Sealing Divination Charms" (LanYan.js A1Scale=50): the skill's Feathermoon
 * Ring releases an extra absorbed-element hit dealing 50% of the skill's DMG, per
 * absorbed element. Modelled as four `FeatureDamageSkill` features keyed
 * `lanyan_feathermoon_ring_<elem>_dmg`, each scaling 0.5× the base ring talent.
 * Auto-active at the canonical A6 build (ConditionAscensionChar(1)).
 *
 * A4 "Skyfeather Evil-Subduing Charm" (A4SkillScale=309, A4BurstScale=774): adds a
 * flat EM-scaled term to skill DMG (309% EM) and burst DMG (774% EM). In raw this is
 * a char-level multiplier targeting damageTypes:['skill'] / ['burst'] with a constant
 * ValueTable. The engine's char-level `multipliers` array is not applied per-feature,
 * so the term is attached directly to each skill feature (incl. the A1 absorb variants,
 * which are damageType 'skill') and the burst feature, as an extra `mastery*` multiplier
 * with a constant value. Auto-active at A6 (ConditionAscensionChar(4)).
 *
 * NOT modelled (correctly absent from the asserted damage triples):
 *   - skill.shield_absorption: a FeatureShield (damageType ""); the harness filters
 *     display-only rows (no damageType). No engine shield support is needed.
 *   - Transformative reactions (swirl variants, overload, superconduct, burning,
 *     burgeon, hyperbloom, electrocharged, rupture, shatter): emitted generically
 *     from the anemo element by `transformativeReactionFeatures`, not declared here.
 *   - Constellations (C0 build) and conditional/Nightsoul/energy-gated bonuses (off).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/LanYan.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (LanYan)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (LanYan)
 */

import type {
  Condition,
  DbObjectChar,
  Feature,
  FeatureMultiplierEntry,
  TalentResolver,
  TalentTable,
} from "@genshin/types";
import { LanYan as LanYanStatTable } from "../generated/charTables.js";
import { LanYan as LanYanTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return LanYanTalents.s1.p1;
      if (name === "normal_hit_2_1") return LanYanTalents.s1.p2;
      if (name === "normal_hit_2_2") return LanYanTalents.s1.p3;
      if (name === "normal_hit_3_1") return LanYanTalents.s1.p4;
      if (name === "normal_hit_3_2") return LanYanTalents.s1.p5;
      if (name === "normal_hit_4") return LanYanTalents.s1.p6;
      if (name === "charged_hit") return LanYanTalents.s1.p7;
      if (name === "plunge") return LanYanTalents.s1.p9;
      if (name === "plunge_low") return LanYanTalents.s1.p10;
      if (name === "plunge_high") return LanYanTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "lanyan_feathermoon_ring_dmg") return LanYanTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return LanYanTalents.s3.p1;
    }
    throw new Error(`lan_yan talents: unknown path '${path}'`);
  },
};

// A1 absorb variants deal 50% of the base Feathermoon Ring multiplier.
// raw: FeatureMultiplier({ scalingMultiplier: A1Scale/100, values: skill ring table }).
// The engine has no `scalingMultiplier`; wrap the ring table so getValue returns 0.5×.
const A1_SCALE = 50;
const ringBase: TalentTable = talents.get("skill.lanyan_feathermoon_ring_dmg");
const a1RingValues: TalentTable = {
  getValue: (level: number) => (A1_SCALE / 100) * ringBase.getValue(level),
};

// A4 flat-EM terms (constant percent-of-EM multipliers; level-independent).
// raw: ValueTable([309]) for skill, ValueTable([774]) for burst, scaling 'mastery*'.
const a4SkillMastery: FeatureMultiplierEntry = {
  scaling: "mastery*",
  leveling: "char_skill_elemental",
  values: { getValue: () => 309 },
};
const a4BurstMastery: FeatureMultiplierEntry = {
  scaling: "mastery*",
  leveling: "char_skill_burst",
  values: { getValue: () => 774 },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (anemo catalyst, always anemo) ---
  // raw: FeatureDamageNormal normal_hit_1 (s1.p1)
  {
    name: "normal_hit_1",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // raw: FeatureDamageMultihit normal_hit_2 (parent = _2_1 + _2_2)
  {
    name: "normal_hit_2",
    category: "attack",
    element: "anemo",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_2") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_2_1 (isChild:true → emit as standalone)
  {
    name: "normal_hit_2_1",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_2_2 (isChild:true → emit as standalone)
  {
    name: "normal_hit_2_2",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_2") }],
  },
  // raw: FeatureDamageMultihit normal_hit_3 (parent = _3_1 + _3_2, equal halves)
  {
    name: "normal_hit_3",
    category: "attack",
    element: "anemo",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_3_1 (isChild:true → emit as standalone)
  {
    name: "normal_hit_3_1",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_3_2 (isChild:true → emit as standalone)
  {
    name: "normal_hit_3_2",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }],
  },
  // raw: FeatureDamageNormal normal_hit_4 (s1.p6)
  {
    name: "normal_hit_4",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attack (3-hit multihit, anemo) ---
  // raw: FeatureDamageMultihit charged_hit_total (items:[{ hits:3, multipliers:[s1.p7] }])
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    element: "anemo",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }] },
    ],
  },
  // raw: FeatureDamageCharged charged_hit (isChild:true, hits:3 → emit as one hit)
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (anemo) ---
  // raw: FeatureDamagePlungeCollision plunge (s1.p9)
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_low (s1.p10)
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high (s1.p11)
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Swallow-Wisp Pinion Dance (anemo) ---
  // raw: FeatureDamageSkill lanyan_feathermoon_ring_dmg (s2.p1) + A4 mastery* term.
  {
    name: "lanyan_feathermoon_ring_dmg",
    category: "skill",
    element: "anemo",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.lanyan_feathermoon_ring_dmg") },
      a4SkillMastery,
    ],
  },
  // A1 absorbed-element variants: pyro / hydro / electro / cryo.
  // raw: map over elements → FeatureDamageSkill({ name:'lanyan_feathermoon_ring_'+elem+'_dmg',
  //   element:elem, multipliers:[FeatureMultiplier({ scalingMultiplier:0.5, values:ring })],
  //   condition: ConditionAscensionChar(1) }). Each also picks up the A4 mastery* skill term.
  {
    name: "lanyan_feathermoon_ring_pyro_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [
      { leveling: "char_skill_elemental", values: a1RingValues },
      a4SkillMastery,
    ],
  },
  {
    name: "lanyan_feathermoon_ring_hydro_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [
      { leveling: "char_skill_elemental", values: a1RingValues },
      a4SkillMastery,
    ],
  },
  {
    name: "lanyan_feathermoon_ring_electro_dmg",
    category: "skill",
    element: "electro",
    multipliers: [
      { leveling: "char_skill_elemental", values: a1RingValues },
      a4SkillMastery,
    ],
  },
  {
    name: "lanyan_feathermoon_ring_cryo_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [
      { leveling: "char_skill_elemental", values: a1RingValues },
      a4SkillMastery,
    ],
  },
  // --- Burst: Lustrous Moonrise (anemo) ---
  // raw: FeatureDamageBurst burst_dmg (s3.p1, multihit hits:3 — parent total only
  // asserted) + A4 mastery* burst term (774% EM).
  {
    name: "burst_dmg",
    category: "burst",
    element: "anemo",
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") },
      a4BurstMastery,
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "As One Might Stride Betwixt the Clouds" (ConditionStatic description-only) → SKIP.
// C2 "Dance Vestments Billow Like Rainbow Jade" (ConditionStatic description-only) → SKIP.
// C3 "..."  → +3 Elemental Skill levels.
//   raw: constellation[2]: Condition{ settings:{char_skill_elemental_bonus:3} }
// C4 "With Drakefalcon's Blood Pearls Adorned" (ConditionBoolean mastery toggle) → SKIP (off).
// C5 "..."  → +3 Elemental Burst levels.
//   raw: constellation[4]: Condition{ settings:{char_skill_burst_bonus:3} }
// C6 "Let Us Away on Sylphic Wing..." (ConditionStatic description-only) → SKIP.
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/LanYan.js:390-446

const constellationConditions: readonly Condition[] = [
  // C3: +3 Elemental Skill (Swallow-Wisp Pinion Dance) levels.
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 Elemental Burst (Lustrous Moonrise) levels.
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const lanYan: DbObjectChar = {
  name: "lan_yan",
  gameId: 10000108,
  rarity: 4,
  element: "anemo",
  weapon: "catalyst",
  origin: "liyue",
  statTable: LanYanStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // C4 "With Drakefalcon's Blood, Pearls Adorned" — +60 EM to party.
  // Source: raw/genshin_calc_pub/src/js/db/Char/LanYan.js (partyData conditions)
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { mastery: 60 },
        condition: { type: "boolean", name: "party.lanyan_with_drakefalcons_blood_pearls_adorned" },
      },
    ],
  },
};
