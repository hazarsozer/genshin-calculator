/**
 * Cyno — electro polearm ATK scaler (fixed solo C0 build, Hijacked/Burst stance OFF).
 *
 * The fixture build has `cyno_wolfs_swiftness` (Pactsworn Pathclearer burst stance)
 * OFF, so the modelled normals/charged/plunge are the ground-stance set
 * (raw: `condition: ConditionNot([cyno_wolfs_swiftness])`) — PHYSICAL, no element
 * override (standard polearm, mirrors rosaria). The burst-stance electro normals,
 * `cyno_duststalker_bolt_dmg`, the A4 normal-attack EM multiplier, and the A1
 * `dmg_skill_cyno` skill bonus are ALL gated on the burst stance (and/or ascension),
 * so they do not fire in this build and are omitted.
 *
 *   normal_hit_3 is a 2-hit multihit (parent = 2× s1.p3); its single-hit child
 *   `normal_hit_3_1` (= 1× s1.p3, half the parent) is emitted as its own feature
 *   (raw marks it isChild:true; the loader drops isChild, so we model it plain —
 *   same pattern as rosaria's normal_hit_3_1).
 *
 * Skill (Secret Rite: Chasmic Soulfarer) is electro: skill_dmg + the Mortuary Rite
 * follow-up cyno_mortuary_rite_dmg, both char_skill_elemental.
 *
 * No always-on C0 passive stat folds: A1 (Featherfall Judgment) and A4 (Authority
 * over the Nine Bows) are both gated on the burst stance; the ascension secondary
 * stat is already folded into the generated stat table. Constellations skipped (C0).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Cyno.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Cyno)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Cyno)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Cyno as CynoStatTable } from "../generated/charTables.js";
import { Cyno as CynoTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return CynoTalents.s1.p1;
      if (name === "normal_hit_2") return CynoTalents.s1.p2;
      if (name === "normal_hit_3") return CynoTalents.s1.p3;
      if (name === "normal_hit_4") return CynoTalents.s1.p5;
      if (name === "charged_hit") return CynoTalents.s1.p6;
      if (name === "plunge") return CynoTalents.s1.p8;
      if (name === "plunge_low") return CynoTalents.s1.p9;
      if (name === "plunge_high") return CynoTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return CynoTalents.s2.p1;
      if (name === "cyno_mortuary_rite_dmg") return CynoTalents.s2.p2;
    }
    // Burst-stance (Pactsworn Pathclearer) normals/charged/plunge — char_skill_burst leveling.
    if (talent === "burst") {
      if (name === "normal_hit_1") return CynoTalents.s3.p1;
      if (name === "normal_hit_2") return CynoTalents.s3.p2;
      if (name === "normal_hit_3") return CynoTalents.s3.p3;
      if (name === "normal_hit_4") return CynoTalents.s3.p4;
      if (name === "normal_hit_5") return CynoTalents.s3.p6;
      if (name === "charged_hit") return CynoTalents.s3.p7;
      if (name === "plunge") return CynoTalents.s3.p9;
      if (name === "plunge_low") return CynoTalents.s3.p10;
      if (name === "plunge_high") return CynoTalents.s3.p11;
    }
    throw new Error(`cyno talents: unknown path '${path}'`);
  },
};

// Pactsworn Pathclearer (Sacred Rite: Wolf's Swiftness) burst stance toggle. When ON, Cyno's
// physical ground moveset is replaced by an electro burst-infused set (her engine gates the base
// set with ConditionNot([cyno_wolfs_swiftness]) and the alt set with ConditionBoolean(it)).
const STANCE: Condition = { type: "boolean", name: "cyno_wolfs_swiftness" };
const NOT_STANCE: Condition = { type: "not", items: [{ type: "boolean", name: "cyno_wolfs_swiftness" }] };

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- GROUND stance normal attacks (physical) — gated OFF when the burst stance is up ---
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
    condition: NOT_STANCE,
  },
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
    condition: NOT_STANCE,
  },
  // normal_hit_3: 2-hit multihit (same multiplier × 2). Parent models the total.
  // raw: FeatureDamageMultihit({ items: [{ hits: 2, multipliers: [p3] }] })
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
    ],
    condition: NOT_STANCE,
  },
  // Child hit: one of the 2 hits of normal_hit_3 (half the parent total).
  // raw marks isChild:true; loader drops isChild, so we emit it as a plain feature.
  // raw/genshin_calc_pub/src/js/db/Char/Cyno.js:218-231
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
    condition: NOT_STANCE,
  },
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
    condition: NOT_STANCE,
  },
  // --- Charged attack (physical, no element override) ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
    condition: NOT_STANCE,
  },
  // --- Plunge attacks ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
    condition: NOT_STANCE,
  },
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
    condition: NOT_STANCE,
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
    condition: NOT_STANCE,
  },
  // --- PACTSWORN PATHCLEARER stance: parallel ELECTRO normal set (char_skill_burst), gated ON ---
  // raw Cyno.js:285-404 — each FeatureDamageNormal/Charged/Plunge with element:'electro',
  // leveling:'char_skill_burst', condition ConditionBoolean(cyno_wolfs_swiftness). The element is
  // HARDCODED (not infusion) so the stance condition publishes no attack_infusion. Same feature
  // names as the ground set → only one variant is produced at a time (mutually-exclusive gates).
  {
    name: "normal_hit_1",
    category: "attack",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.normal_hit_1") }],
    condition: STANCE,
  },
  {
    name: "normal_hit_2",
    category: "attack",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.normal_hit_2") }],
    condition: STANCE,
  },
  {
    name: "normal_hit_3",
    category: "attack",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.normal_hit_3") }],
    condition: STANCE,
  },
  // normal_hit_4: 2-hit multihit (same s3.p4 multiplier × 2). Its isChild single-hit child
  // (raw normal_hit_4_1) is NOT emitted in her stance dump → not modelled here.
  {
    name: "normal_hit_4",
    category: "attack",
    damageType: "normal",
    element: "electro",
    items: [
      { multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.normal_hit_4") }] },
      { multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.normal_hit_4") }] },
    ],
    condition: STANCE,
  },
  // Child hit: one of the 2 hits of the electro normal_hit_4 (1× s3.p4, half the parent). raw marks
  // it isChild; the loader drops isChild, so we emit it plain (matches her per-sub-hit dump key).
  {
    name: "normal_hit_4_1",
    category: "attack",
    damageType: "normal",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.normal_hit_4") }],
    condition: STANCE,
  },
  {
    name: "normal_hit_5",
    category: "attack",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.normal_hit_5") }],
    condition: STANCE,
  },
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.charged_hit") }],
    condition: STANCE,
  },
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.plunge") }],
    condition: STANCE,
  },
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.plunge_low") }],
    condition: STANCE,
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.plunge_high") }],
    condition: STANCE,
  },
  // --- Skill: Secret Rite: Chasmic Soulfarer (electro, unconditional) ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  {
    name: "cyno_mortuary_rite_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.cyno_mortuary_rite_dmg") }],
  },
  // --- A1 "Featherfall Judgment" Duststalker Bolt (electro skill instance), stance-gated ---
  // raw Cyno.js:427-446 — FeatureDamageSkill cyno_duststalker_bolt_dmg, gated AND[stance, asc1].
  // Two multipliers: A1 100% ATK (source ascension1, constant) + A4 250%×EM (mastery*, source
  // ascension4, gated asc4 — always-on at the rep's A6). The asc1/asc4 sub-gates are dropped (the
  // rep is A6 so both hold); only the stance gate remains.
  {
    name: "cyno_duststalker_bolt_dmg",
    category: "skill",
    element: "electro",
    multipliers: [
      { leveling: "", values: { getValue: () => 100 }, source: "ascension1" },
      { scaling: "mastery*", leveling: "", values: { getValue: () => 250 }, source: "ascension4" },
    ],
    condition: STANCE,
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// NOTE: Cyno's C3 bumps the BURST talent and C5 bumps the ELEMENTAL SKILL —
// the reverse of most characters. Raw cons[2]=burst_bonus, cons[4]=elemental_bonus.
//
// C1 "Ordinance: Unceasing Vigil": ConditionStatic with atk_speed_normal — display-only
//   stat key (atk_speed_*), subConditions gated on burst-stance → SKIP.
// C2 "Ceremony: Homecoming of Spirits": ConditionStacks dmg_electro toggle → SKIP.
// C4 "Austerity: Forbidding Guard": ConditionStatic no stats → display-only, SKIP.
// C6 "Raiment: Just Scales": ConditionStatic no stats → display-only, SKIP.
//
// Source: raw/genshin_calc_pub/src/js/db/Char/Cyno.js:502-567

const constellationConditions: readonly Condition[] = [
  // C3 "Precept: Lawful Enforcer": +3 levels to Mortuary Rite (Elemental Burst).
  // Raw cons[2]: Condition{ settings:{ char_skill_burst_bonus: 3 } }.
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5 "Funerary Rite: The Passing of Starlight": +3 levels to Secret Rite (Elemental Skill).
  // Raw cons[4]: Condition{ settings:{ char_skill_elemental_bonus: 3 } }.
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const cyno: DbObjectChar = {
  name: "cyno",
  gameId: 10000071,
  rarity: 5,
  element: "electro",
  weapon: "polearm",
  origin: "sumeru",
  statTable: CynoStatTable,
  talents,
  features,
  // A4 "Authority over the Nine Bows": +250% EM... no — the NORMAL-attack EM bonus is +150%×EM as a
  // damage-instance on Cyno's electro normals while the stance is up. raw Cyno.js:448-461 — a
  // char-level FeatureMultiplier(scaling mastery*, ValueTable[150], target damageElements:['electro']
  // damageTypes:['normal'], gated AND[stance, asc4]). Modelled as a CharMultiplier gated on the stance
  // (asc4 always-on at the rep's A6); targets the electro normals (incl. the normal_hit_4 multihit).
  multipliers: [
    {
      scaling: "mastery*",
      leveling: "",
      values: { getValue: () => 150 },
      source: "ascension4",
      target: { damageElements: ["electro"], damageTypes: ["normal"] },
      condition: { type: "boolean", name: "cyno_wolfs_swiftness" },
    },
  ],
  // Pactsworn Pathclearer stance — the burst stance toggle. While up it grants +100 EM (BurstMastery),
  // which lifts the EM-scaled duststalker bolt / A4 normal multiplier + every electro reaction. The
  // moveset-swap itself is via the per-feature Feature.condition gates above. raw Cyno.js:463-472.
  conditions: [
    { type: "boolean", name: "cyno_wolfs_swiftness", stats: { mastery: 100 } },
    ...constellationConditions,
  ],
};
