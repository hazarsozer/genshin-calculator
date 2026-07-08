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
 * (no settings toggle), so no atk% is applied. Its readout other.atk_bonus IS
 * still emitted (the condition gates APPLICATION, not the display) → modelled as
 * output:{kind:"static"} (P3.5.3). skill.heal_dot (FeatureHeal) also modelled.
 *
 * C2 'chevreuse_chain_explosion_dmg' is C2-gated (skill.chevreuse_chain_explosion_dmg feature
 * above). C6 skill.chevreuse_heal_dot (a second FeatureHeal distinct from the base skill.heal_dot)
 * is C6-gated (feature above, P3.5.4 display-gap burndown Task 4).
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
      if (name === "heal_dot_percent") return ChevreuseTalents.s2.p5;
      if (name === "heal_dot_flat") return ChevreuseTalents.s2.p6;
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
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
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
  // --- Skill heal: skill.heal_dot = Overcharged Ball per-tick heal (FeatureHeal, HP-scaled list) ---
  // FeatureMultiplierList scaling:'hp*', leveling:'char_skill_elemental', values=getList('skill.heal_dot') =
  // [s2.p5 (% of HP), s2.p6 (flat)]. base = (s2.p5/100)×hp_total + s2.p6; no healing-bonus passive (HP% ascension).
  // raw/genshin_calc_pub/src/js/db/Char/Chevreuse.js:88-94,314-323.
  {
    name: "heal_dot",
    category: "skill",
    output: { kind: "heal" },
    multipliers: [
      { scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.heal_dot_percent"), flatValues: talents.get("skill.heal_dot_flat") },
    ],
  },
  // --- C6 "In Pursuit of Ending Evil" heal (skill.chevreuse_heal_dot) — distinct from the base
  // skill.heal_dot above. raw: FeatureHeal({ category:'skill', name:'chevreuse_heal_dot',
  //   multipliers:[FeatureMultiplier({ scaling:'hp*', source:'constellation6',
  //     values:new ValueTable([TalentValues.C6PartyHeal=10]) })],
  //   condition:ConditionConstellation({constellation:6}) })  Chevreuse.js:325-333. No partyHeal
  // flag on this FeatureHeal in raw (despite the "party heal" C6 name) → self-only, no
  // `partyHeal:true`. Constant value → leveling:"".
  {
    name: "chevreuse_heal_dot",
    category: "skill",
    output: { kind: "heal" },
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      { scaling: "hp", leveling: "", values: { getValue: () => 10 }, source: "constellation6" },
    ],
  },
  // --- A4 "Vertical Force Coordination" static readout: other.atk_bonus = HP → ATK% (capped) ---
  // FeaturePostEffectValue(atkBuffPost = PostEffectStatsHP, percent=StatTable('atk_percent',[AtkBuffValue/1000=0.001]),
  // statCap=StatTable('',[AtkBuffCap=40])), format:'percent'. 'atk_percent' is isPercent → /100 and the format ×100
  // CANCEL → displayed = 0.001×hp_total capped at 40. values = 0.001×100 = 0.1 → (0.1/100)×hp_total = 0.001×hp_total;
  // capValue = 40 (inert at the canonical HP, ≈31.23). asc4+force_coordination gate APPLICATION not the readout.
  // raw/genshin_calc_pub/src/js/db/Char/Chevreuse.js (TalentValues AtkBuffValue:1, AtkBuffCap:40; atkBuffPost:145-152,368-373).
  {
    name: "atk_bonus",
    category: "other",
    output: { kind: "static" },
    multipliers: [
      { scaling: "hp", leveling: "", values: { getValue: () => 0.1 }, capValue: 40 },
    ],
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
//   Also unlocks the skill.chevreuse_heal_dot FeatureHeal above (display-gap burndown Task 4).
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
  // SELF C6 "In Pursuit of Ending Evil" (chevreuse_in_pursuit): dmg_pyro +20 / dmg_electro +20 per
  // stack (max 3 = +60% each), gated C6. text_percent_heal is a display key → skip. The SELF mirror
  // of party.chevreuse_in_pursuit; lifts her own pyro hits. Was golden-blind SKIPPED. raw
  // constellation[5] ConditionStacks. THE CONSTELLATION IS A GATE.
  {
    type: "stacks",
    name: "chevreuse_in_pursuit",
    maxStacks: 3,
    stats: { dmg_pyro: 20, dmg_electro: 20 },
    condition: { type: "constellation", constellation: 6 },
  },
];

// SELF A4 "Vertical Force Coordination" (chevreuse_force_coordination): own HP → atk_percent at
// 0.001/HP (AtkBuffValue/1000), hard-capped at AtkBuffCap=40, gated by the chevreuse_force_coordination
// boolean (the in-game "an Electro/Pyro teammate triggered Overcharged" trigger). Lifts EVERY one of
// her ATK-scaled hits. The port previously modelled only the other.atk_bonus DISPLAY readout (a static
// feature) + the party.* HP→atk battery, but DROPPED the SELF buff postEffect → golden-blind SKIP. raw
// Chevreuse.js atkBuffPost = PostEffectStatsHP (own HP), conditions [Ascension4, chevreuse_force_coordination].
const selfPostEffects: readonly CharPostEffect[] = [
  {
    fromStat: "hp",
    toStat: "atk_percent",
    ratio: 0.001, // AtkBuffValue=1 / 1000
    capValue: 40, // AtkBuffCap=40
    conditions: [{ type: "boolean", name: "chevreuse_force_coordination" }],
  },
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
  postEffects: selfPostEffects,
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
