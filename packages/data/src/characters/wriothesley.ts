/**
 * Wriothesley — cryo catalyst, HP-scaling fistfighter.
 *
 * 5-hit normal combo (n4 is a 2-hit multihit → child normal_hit_4_1), cryo charged
 * hit, the Vaulting Fist charged-attack variant (wriothesley_vaulting_fist_dmg) with
 * A1/A6/C6 charged-only bonuses, plunge/low/high, cryo burst (burst_dmg, modelled as
 * a 5-hit multihit parent in raw but the fixture asserts the per-instance value — see
 * below), all cryo.
 *
 * CHILLING PENALTY (n1..n5 + n4 multihit use FeatureMultiplierWriothesley in raw):
 *   raw's FeatureMultiplierWriothesley applies an EXTRA scaling multiplier
 *   (skill.wriothesley_enhanced_repelling_fist) to every normal hit ONLY when the
 *   setting `wriothesley_chilling_penalty` is ON
 *   (raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/Wriothesley.js:18-21).
 *   It is a ConditionBoolean toggle (default OFF). The canonical golden build runs
 *   with settings:{} → chilling penalty OFF → the boost factor is absent and the
 *   normals reduce to a plain FeatureMultiplier (talent% × ATK). Verified numerically
 *   against the fixture (normal_hit_1.normal = 1023.205 matches the un-boosted value).
 *   So the normals are modelled as ordinary multipliers, identical to any ATK scaler.
 *
 * normal_hit_4: raw FeatureDamageMultihit({ items:[{ hits:2, multipliers:[p4] }] }) —
 *   the same p4 multiplier landing twice. Modelled as the multiplier listed twice
 *   (fixture: normal_hit_4.normal = 1453.67 = 2 × normal_hit_4_1.normal = 726.84).
 * normal_hit_4_1: raw FeatureDamageNormal(isChild:true). The fixture asserts it as an
 *   INDEPENDENT feature (attack.normal_hit_4_1), so it is emitted as a standalone
 *   single-hit feature (isChild dropped) per the harness contract.
 *
 * wriothesley_vaulting_fist_dmg: a charged-attack variant (damageType charged) using
 *   the SAME charged_hit talent (s1.p7) but with charged-only bonuses layered on:
 *     - damageBonuses:    ['dmg_charged_wriothesley'] — A1 "There Shall Be a Plea for
 *       Justice" gives +50% (ConditionAscensionChar(1) → auto-active at canonical A6).
 *       (C6 would add +150 more, but C0 → only the A1 +50.)
 *     - critRateBonuses:  ['crit_rate_charged_wriothesley'] — C6 only → 0 at C0.
 *     - critDamageBonuses:['crit_dmg_charged_wriothesley']  — C6 only → 0 at C0.
 *   The folded baseStats below supply dmg_charged_wriothesley = 50 (the only one
 *   active at C0/A6); the two C6 crit keys are absent → read 0.
 *
 * burst_dmg: raw FeatureDamageBurst with damageBonuses:['dmg_burst_wriothesley'] (C2
 *   only → 0 at C0). Raw wraps the burst as a 5-hit multihit
 *   (FeatureDamageBurst({ type:'multihit', hits:5 }) on the talent side) but the
 *   damage FEATURE itself is a single FeatureDamageBurst with one multiplier, and the
 *   fixture's burst.burst_dmg is the single-instance value (3372.72 normal). Modelled
 *   as one burst multiplier (s3.p1), matching the fixture.
 *
 * SKIPPED (not damage triples / not active in solo C0):
 *   - wriothesley_vaulting_fist_heal (FeatureHeal, damageType "" → display-only, the
 *     golden harness filters non-damageType entries; an HP-scaling heal, not damage).
 *   - chilling-penalty / reckoning-for-sin / redemption conditions (toggles & stacks,
 *     OFF in the fixed solo build) and all constellations (C0 build).
 *   - reaction.{superconduct,electrocharged,shatter}: emitted generically from the
 *     cryo element by reactions.ts; not declared here.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Wriothesley.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/Wriothesley.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Wriothesley)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Wriothesley)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Wriothesley as WriothesleyStatTable } from "../generated/charTables.js";
import { Wriothesley as WriothesleyTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return WriothesleyTalents.s1.p1;
      if (name === "normal_hit_2") return WriothesleyTalents.s1.p2;
      if (name === "normal_hit_3") return WriothesleyTalents.s1.p3;
      if (name === "normal_hit_4") return WriothesleyTalents.s1.p4;
      if (name === "normal_hit_5") return WriothesleyTalents.s1.p6;
      if (name === "charged_hit") return WriothesleyTalents.s1.p7;
      if (name === "plunge") return WriothesleyTalents.s1.p9;
      if (name === "plunge_low") return WriothesleyTalents.s1.p10;
      if (name === "plunge_high") return WriothesleyTalents.s1.p11;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return WriothesleyTalents.s3.p1;
    }
    throw new Error(`wriothesley talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Folded passive stats (unconditional in solo C0/A6)
// ---------------------------------------------------------------------------

// A1 "There Shall Be a Plea for Justice": +50% charged-attack DMG, applied only to
// the Vaulting Fist via the dmg_charged_wriothesley key. ConditionAscensionChar(1)
// → auto-active at canonical ascension 6.
// raw/genshin_calc_pub/src/js/db/Char/Wriothesley.js (conditions: ConditionStatic A1)
const baseStats: Readonly<Record<string, number>> = {
  dmg_charged_wriothesley: 50,
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (cryo, chilling penalty OFF → plain ATK multipliers) ---
  {
    name: "normal_hit_1",
    category: "attack",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // normal_hit_4: 2-hit multihit (p4 × 2). Parent models the total.
  // raw: FeatureDamageMultihit({ items: [{ hits: 2, multipliers: [p4] }] })
  {
    name: "normal_hit_4",
    category: "attack",
    element: "cryo",
    damageType: "normal",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
    ],
  },
  // normal_hit_4_1: single sub-hit of normal_hit_4 (raw isChild:true → dropped to emit).
  // raw/genshin_calc_pub/src/js/db/Char/Wriothesley.js (FeatureDamageNormal normal_hit_4_1)
  {
    name: "normal_hit_4_1",
    category: "attack",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  {
    name: "normal_hit_5",
    category: "attack",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
  },
  // --- Charged attacks (cryo) ---
  {
    name: "charged_hit",
    category: "attack",
    element: "cryo",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // Vaulting Fist: charged variant using the same charged_hit talent, with the A1
  // +50% charged DMG (dmg_charged_wriothesley) + C6 crit keys (0 at C0).
  {
    name: "wriothesley_vaulting_fist_dmg",
    category: "attack",
    element: "cryo",
    damageType: "charged",
    damageBonuses: ["dmg_charged_wriothesley"],
    critRateBonuses: ["crit_rate_charged_wriothesley"],
    critDamageBonuses: ["crit_dmg_charged_wriothesley"],
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (cryo) ---
  {
    name: "plunge",
    category: "attack",
    element: "cryo",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    element: "cryo",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    element: "cryo",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- wriothesley_vaulting_fist_heal: A1 HP-scaling heal (leveling:'wriothesley_heal_level') ---
  // raw: FeatureHeal({ name:'wriothesley_vaulting_fist_heal', category:'attack',
  //   multipliers:[{ scaling:'hp*', source:'ascension1', leveling:'wriothesley_heal_level',
  //     values: new ValueTable([30, 50]) }] })  Wriothesley.js:229-240.
  // wriothesley_heal_level is set to 2 by ConditionStatic C4 (always-on at canonical A6):
  //   Wriothesley.js:353-360: settings:{ wriothesley_heal_level:2 }, subConditions:[ConditionAscensionChar(1)].
  // ValueTable([30, 50]): getValue(1)=30, getValue(2)=50. Level 2 → 50% HP.
  {
    name: "wriothesley_vaulting_fist_heal",
    category: "attack",
    output: { kind: "heal" },
    multipliers: [
      {
        scaling: "hp",
        leveling: "wriothesley_heal_level",
        values: { getValue: (level: number) => (level >= 2 ? 50 : 30) },
      },
    ],
  },
  // --- Burst: Darkgold Wolfbite (cryo) ---
  // damageBonuses: ['dmg_burst_wriothesley'] — C2 only, 0 at C0.
  {
    name: "burst_dmg",
    category: "burst",
    element: "cryo",
    damageBonuses: ["dmg_burst_wriothesley"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Terror for the Evildoers": ConditionStatic with dmg_charged_wriothesley:150
//   + text_percent_dmg (display), subConditions:[ConditionAscensionChar(1)] → always-on
//   at canonical A6. Key already in wriothesley_vaulting_fist_dmg damageBonuses.
// C2 "Shackles for the Arrogant": ConditionStaticLevel keyed on wriothesley_reckoning_for_sin
//   stacks (manual setting); dmg_burst_wriothesley at level 0 is 0 — not always-on. SKIP.
// C3 "Punishment for the Innocent": +3 attack talent (char_skill_attack_bonus).
// C4 "Redemption for the Suffering": ConditionStatic (heal level) + ConditionBoolean toggles
//   (atk_speed_normal) — speed stat, SKIP.
// C5 "Mercy for the Wronged": +3 burst talent (char_skill_burst_bonus).
// C6 "Esteem for the Innocent": ConditionStatic crit_rate_charged_wriothesley:10 +
//   crit_dmg_charged_wriothesley:80, subConditions:[ConditionAscensionChar(1)] → always-on.
//   Keys already in wriothesley_vaulting_fist_dmg critRateBonuses/critDamageBonuses.
// Sources: raw/genshin_calc_pub/src/js/db/Char/Wriothesley.js:312-430

const constellationConditions: readonly Condition[] = [
  // C1 — dmg_charged_wriothesley +150% (charged attack DMG on Vaulting Fist).
  // Wired via damageBonuses:['dmg_charged_wriothesley'] on wriothesley_vaulting_fist_dmg.
  { type: "constellation", constellation: 1, stats: { dmg_charged_wriothesley: 150 } },
  // C3 — +3 Normal Attack (standard attacks/fists).
  { type: "constellation", constellation: 3, settings: { char_skill_attack_bonus: 3 } },
  // C5 — +3 Elemental Burst (Darkgold Wolfbite).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
  // C6 — crit_rate_charged_wriothesley +10%, crit_dmg_charged_wriothesley +80%.
  // Wired via critRateBonuses/critDamageBonuses on wriothesley_vaulting_fist_dmg.
  { type: "constellation", constellation: 6, stats: { crit_rate_charged_wriothesley: 10, crit_dmg_charged_wriothesley: 80 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const wriothesley: DbObjectChar = {
  name: "wriothesley",
  gameId: 10000086,
  rarity: 5,
  element: "cryo",
  weapon: "catalyst",
  origin: "fontaine",
  statTable: WriothesleyStatTable,
  talents,
  features,
  multipliers: [],
  baseStats,
  conditions: constellationConditions,
  // C4 "Redemption for the Suffering" — +10% normal ATK speed (atk_speed_normal; display-only).
  // No oracle rep (atk_speed_normal is damage-inert).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Wriothesley.js (partyData conditions)
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { atk_speed_normal: 10 },
        condition: {
          type: "boolean",
          name: "party.wriothesley_redemption_for_the_suffering_2",
        },
      },
    ],
  },
};
