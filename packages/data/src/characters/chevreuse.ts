/**
 * Chevreuse — pyro polearm ATK scaler.
 *
 * 4-hit normal combo (n3: 2-hit multihit → children _3_1/_3_2), charged hit,
 * plunge/low/high, pyro skill (press_dmg, hold_dmg, chevreuse_overcharge_dmg,
 * surging_blade_dmg), pyro burst (chevreuse_explosive_grenade_dmg,
 * chevreuse_secondary_explosive_dmg).
 *
 * A4 "Vertical Force Coordination": HP→atk_percent post-effect gated by
 * ConditionBoolean('chevreuse_force_coordination') — OFF at canonical build
 * (no settings toggle). The other.atk_bonus FeaturePostEffectValue also has
 * empty damageType → not tested. No baseStats needed.
 *
 * C2 'chevreuse_chain_explosion_dmg' is C2-gated → not active at C0, omit.
 * C6 party heals are C6-gated → omit.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Chevreuse.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Chevreuse)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Chevreuse)
 */

import type { CharPostEffect, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Chevreuse as ChevreuseStatTable } from "../generated/charTables.js";
import { Chevreuse as ChevreuseTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return ChevreuseTalents.s1.p1;
      if (name === "normal_hit_2") return ChevreuseTalents.s1.p2;
      if (name === "normal_hit_3_1") return ChevreuseTalents.s1.p3;
      if (name === "normal_hit_3_2") return ChevreuseTalents.s1.p4;
      if (name === "normal_hit_4") return ChevreuseTalents.s1.p5;
      if (name === "charged_hit") return ChevreuseTalents.s1.p6;
      if (name === "plunge") return ChevreuseTalents.s1.p8;
      if (name === "plunge_low") return ChevreuseTalents.s1.p9;
      if (name === "plunge_high") return ChevreuseTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "press_dmg") return ChevreuseTalents.s2.p1;
      if (name === "hold_dmg") return ChevreuseTalents.s2.p2;
      if (name === "chevreuse_overcharge_dmg") return ChevreuseTalents.s2.p3;
      if (name === "surging_blade_dmg") return ChevreuseTalents.s2.p7;
    }
    if (talent === "burst") {
      if (name === "chevreuse_explosive_grenade_dmg") return ChevreuseTalents.s3.p1;
      if (name === "chevreuse_secondary_explosive_dmg") return ChevreuseTalents.s3.p2;
    }
    throw new Error(`chevreuse talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
  // raw: FeatureDamageNormal normal_hit_1
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_2
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  // raw: FeatureDamageMultihit normal_hit_3 (parent = _3_1 + _3_2)
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_3_1 isChild:true → drop isChild to emit
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_3_2 isChild:true → drop isChild to emit
  {
    name: "normal_hit_3_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }],
  },
  // raw: FeatureDamageNormal normal_hit_4
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attack ---
  // raw: FeatureDamageCharged charged_hit
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks ---
  // raw: FeatureDamagePlungeCollision plunge
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_low
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Short-Range Rapid Interdiction Fire (pyro) ---
  // raw: FeatureDamageSkill press_dmg
  {
    name: "press_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.press_dmg") }],
  },
  // raw: FeatureDamageSkill hold_dmg
  {
    name: "hold_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.hold_dmg") }],
  },
  // raw: FeatureDamageSkill chevreuse_overcharge_dmg
  {
    name: "chevreuse_overcharge_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.chevreuse_overcharge_dmg") }],
  },
  // --- C2 "Sniper-Induced Explosion": cons-added pyro skill chain explosion (fixed 120% ATK).
  // Raw: FeatureDamageSkill → damageType:"skill". Fixed ValueTable([120]), C2-gated.
  // Raw Chevreuse.js:304-313. TalentValues.C2ChainDmg = 120.
  {
    name: "chevreuse_chain_explosion_dmg",
    category: "skill",
    element: "pyro",
    damageType: "skill",
    condition: { type: "constellation", constellation: 2 },
    multipliers: [
      {
        leveling: "char_skill_attack",
        values: { getValue: (_level: number) => 120 },
        source: "constellation2",
      },
    ],
  },
  // raw: FeatureDamageSkill surging_blade_dmg (cannotReact:true, still a pyro skill hit)
  {
    name: "surging_blade_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.surging_blade_dmg") }],
  },
  // --- Burst: Ring of Bursting Grenades (pyro) ---
  // raw: FeatureDamageBurst chevreuse_explosive_grenade_dmg
  {
    name: "chevreuse_explosive_grenade_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.chevreuse_explosive_grenade_dmg") }],
  },
  // raw: FeatureDamageBurst chevreuse_secondary_explosive_dmg
  {
    name: "chevreuse_secondary_explosive_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.chevreuse_secondary_explosive_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Stable Front Line's Resolve": ConditionStatic display-only → SKIP.
// C2 "Sniper-Induced Explosion": ConditionStatic (text_percent_dmg:120) display-only → SKIP.
//   The actual C2 damage comes from the chevreuse_chain_explosion_dmg feature above.
// C3: +3 levels to Short-Range Rapid Interdiction Fire (skill). Raw cons[2] settings char_skill_elemental_bonus:3.
// C4 "The Secret to Rapid-Fire Multishots": ConditionStatic display-only → SKIP.
// C5: +3 levels to Ring of Bursting Grenades (burst). Raw cons[4] settings char_skill_burst_bonus:3.
// C6 "In Pursuit of Ending Evil": ConditionStacks (dmg_pyro/electro per stack, toggle) → SKIP.
// Raw: Chevreuse.js:408-470 (constellation array).
const constellationConditions: readonly Condition[] = [
  // A1 "Vanguard's Coordinated Tactics" (chevreuse_tactics co-toggle): with a Pyro+Electro-ONLY
  // party, enemy Pyro & Electro RES −40 each. Gated by the two-element party gate — her
  // ConditionBooleanChevreuseParty treats `electro` as the second trigger (Pyro + Electro, NOT
  // Pyro+Hydro). The raw ConditionAscensionChar(1) subcondition is always satisfied at the fixed
  // ascension-6 build, so it is omitted. Raw Chevreuse.js:430-449 (TalentValues.ResShred=-40).
  {
    type: "boolean",
    name: "chevreuse_tactics",
    stats: { enemy_res_pyro: -40, enemy_res_electro: -40 },
    condition: { type: "party-elements", elements: ["pyro", "electro"] },
  },
  // C3: +3 levels to Short-Range Rapid Interdiction Fire (skill).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 levels to Ring of Bursting Grenades (burst).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const chevreuse: DbObjectChar = {
  name: "chevreuse",
  gameId: 10000090,
  rarity: 4,
  element: "pyro",
  weapon: "polearm",
  origin: "fontaine",
  statTable: ChevreuseStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // partyData — teammate kit buffs (P3.5.2 Bucket B).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Chevreuse.js:471-541
  // Scope: oracle-gated core only — A4 "Vertical Force Coordination" HP→atk_percent battery.
  // Deferred to the P3.5.2 variant-rep pass:
  //   A1 "Vanguard's Coordinated Tactics": enemy_res_pyro/electro:-15 (display keys, no separate
  //     party rep needed — it's a static ConditionBoolean stats block, covered by Bucket A).
  //   C6 "In Pursuit of Ending Evil": stacks → dmg_pyro/electro (Bucket B variant rep).
  partyData: {
    loadStats: {
      stats: ["hp_total"],
    },
    conditions: [
      // ConditionNumber: lifts the teammate's hp_total into the recipient's stat bag.
      { type: "number", name: "chevreuse_hp_total", max: 150000 },
      // A4 master toggle (gates the ATK% postEffect below).
      { type: "boolean", name: "party.chevreuse_force_coordination" },
    ],
    postEffects: [
      // A4 "Vertical Force Coordination": hp_total × AtkBuffValue/1000 = 0.001 → atk_percent,
      // hard-capped at AtkBuffCap=40 (flat percent cap matching statCap ValueTable([40])).
      // Also requires active char to be pyro or electro (ConditionBooleanCharElement gate).
      // Source: raw/genshin_calc_pub/src/js/db/Char/Chevreuse.js:530-539
      {
        fromStat: "chevreuse_hp_total",
        toStat: "atk_percent",
        ratio: 0.001,  // AtkBuffValue=1 / 1000
        capValue: 40,  // AtkBuffCap=40
        conditions: [
          { type: "boolean", name: "party.chevreuse_force_coordination" },
          { type: "char-element", elements: ["pyro", "electro"] },
        ],
      } satisfies CharPostEffect,
    ],
  },
};
