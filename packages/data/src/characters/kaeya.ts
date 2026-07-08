/**
 * Kaeya — cryo sword ATK scaler.
 *
 * Standard 5-hit normal combo with 2-hit charged (multihit), plunge,
 * cryo skill (single hit), cryo burst (single hit). No post-effects at C0.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Kaeya.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Kaeya)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Kaeya)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Kaeya as KaeyaStatTable } from "../generated/charTables.js";
import { Kaeya as KaeyaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return KaeyaTalents.s1.p1;
      if (name === "normal_hit_2") return KaeyaTalents.s1.p2;
      if (name === "normal_hit_3") return KaeyaTalents.s1.p3;
      if (name === "normal_hit_4") return KaeyaTalents.s1.p4;
      if (name === "normal_hit_5") return KaeyaTalents.s1.p5;
      if (name === "charged_hit_1") return KaeyaTalents.s1.p6;
      if (name === "charged_hit_2") return KaeyaTalents.s1.p7;
      if (name === "plunge") return KaeyaTalents.s1.p9;
      if (name === "plunge_low") return KaeyaTalents.s1.p10;
      if (name === "plunge_high") return KaeyaTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return KaeyaTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return KaeyaTalents.s3.p1;
    }
    throw new Error(`kaeya talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
  // All normal + charged hits declare critRateBonuses:['crit_rate_kaeya'] (raw Kaeya.js:126-218)
  // → the C1 "Excellent Blood" +15% Crit Rate (the self condition below) reaches their crit term.
  // Base-inert until the C1 toggle fires (absent key reads 0).
  {
    name: "normal_hit_1",
    category: "attack",
    critRateBonuses: ["crit_rate_kaeya"],
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    critRateBonuses: ["crit_rate_kaeya"],
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    critRateBonuses: ["crit_rate_kaeya"],
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  {
    name: "normal_hit_4",
    category: "attack",
    critRateBonuses: ["crit_rate_kaeya"],
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  {
    name: "normal_hit_5",
    category: "attack",
    critRateBonuses: ["crit_rate_kaeya"],
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
  },
  // --- Charged attacks (2-hit multihit combo, plus individual child hits) ---
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    critRateBonuses: ["crit_rate_kaeya"],
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }] },
    ],
  },
  {
    name: "charged_hit_1",
    category: "attack",
    damageType: "charged",
    critRateBonuses: ["crit_rate_kaeya"],
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }],
  },
  {
    name: "charged_hit_2",
    category: "attack",
    damageType: "charged",
    critRateBonuses: ["crit_rate_kaeya"],
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }],
  },
  // --- Plunge attacks ---
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
  // --- Skill: Frostgnaw (cryo) ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Glacial Waltz (cryo) ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // --- C4 "Frozen Kiss" shield: other.kaeya_shield ---
  // FeatureShield, HP-scaled constant (no talent leveling — source:'constellation4',
  // values:ValueTable([C4Shield=30])). Gated ConditionConstellation(4). The constellation
  // comment block below flags this cons's shield as "not in the golden fixture → SKIP" —
  // that was true of the old damage-only golden gate; the display-gap sweep added a
  // non-damage `other.kaeya_shield` fixture entry this feature must satisfy.
  // raw/genshin_calc_pub/src/js/db/Char/Kaeya.js:279-290. TalentValues.C4Shield = 30 (Kaeya.js:109).
  {
    name: "kaeya_shield",
    category: "other",
    output: { kind: "shield" },
    condition: { type: "constellation", constellation: 4 },
    multipliers: [
      { scaling: "hp", leveling: "", values: { getValue: () => 30 } },
    ],
  },
  // --- A1 "Cold-Blooded Strike" heal: skill.kaeya_coldblooded_strike = 15% of ATK (FeatureHeal) ---
  // FeatureMultiplier source:'ascension1', ValueTable([A1Heal=15]), no scaling → ATK-default, auto-active at A6.
  // raw/genshin_calc_pub/src/js/db/Char/Kaeya.js:259-270,107
  {
    name: "kaeya_coldblooded_strike",
    category: "skill",
    output: { kind: "heal" },
    multipliers: [
      { leveling: "ascension1", values: { getValue: () => 15 } },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Excellent Blood": ConditionBoolean toggle (crit_rate_kaeya=15) on enemies affected by
//   Cryo/frozen — modelled below (SELF condition; was golden-blind SKIPPED — no golden toggles it,
//   so the 58k DAMAGE goldens are blind; a diff-parity sweep surfaced the 8 normal/charged avg rows
//   diverging from cons 1). No party.* mirror exists (self-only). raw Kaeya.js:315-324.
// C2 "Never-Ending Performance": ConditionStatic, no real stats → SKIP.
// C4 "Frozen Kiss": FeatureShield gated by ConditionConstellation(4). Not a damage triple
//   (no element/damageType multiplier) — absent from the DAMAGE golden gate, but the
//   display-gap browser sweep exercises non-damage shield outputs too; ported as
//   other.kaeya_shield in the features list above (Task 2, display-gap burndown).
// C6 "Glacial Whirlwind": ConditionStatic, no real stats → SKIP.
//
// Always-on: C3 (+3 skill talent), C5 (+3 burst talent).
// Sources: raw/genshin_calc_pub/src/js/db/Char/Kaeya.js:313-370

const constellationConditions: readonly Condition[] = [
  // C3 "Heart of the Abyss" — +3 Elemental Skill (Frostgnaw).
  // Raw cons[2]: new Condition({ settings: { char_skill_elemental_bonus: 3 } }).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 "Praise of Ice" — +3 Elemental Burst (Glacial Waltz).
  // Raw cons[4]: new Condition({ settings: { char_skill_burst_bonus: 3 } }).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
  // SELF "Excellent Blood" (C1) — +15% Crit Rate (crit_rate_kaeya) to every normal + charged hit
  // (each declares critRateBonuses:['crit_rate_kaeya']). ConditionBoolean gated at C1 (constellation[0]
  // → THE CONSTELLATION IS A GATE; base-inert below C1 / when untoggled). Self-only → golden-blind SKIP.
  // raw Kaeya.js:315-324 (constellation[0], ConditionBoolean stats:{crit_rate_kaeya:15}).
  {
    type: "boolean",
    name: "kaeya_excellent_blood",
    stats: { crit_rate_kaeya: 15 },
    condition: { type: "constellation", constellation: 1 },
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const kaeya: DbObjectChar = {
  name: "kaeya",
  gameId: 10000015,
  rarity: 4,
  element: "cryo",
  weapon: "sword",
  origin: "mondstadt",
  statTable: KaeyaStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
