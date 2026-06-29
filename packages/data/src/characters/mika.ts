/**
 * Mika — cryo polearm ATK scaler.
 *
 * 5-hit normal combo (physical polearm), n4 is a 2-hit multihit with child
 * normal_hit_4_1. Physical charged hit, plunge. Cryo skill (flowfrost arrow +
 * rimestar flare + rimestar shard). Burst is heals only (no burst damage).
 *
 * Heals (burst.heal, burst.mika_heal_dot) have no damageType; skipped by the
 * golden harness. No always-on passive stat bonuses at C0:
 *   A1 mika_suppressive_barrage is ConditionStacks (toggle) → off in fixed build.
 *   A4 mika_topographical_mapping is ConditionStatic text_only (description only).
 *
 * Note: talent table s1.p5 is the same multiplier as p4 (both model the
 * per-hit percent of the n4 2-hit; only p4 is referenced here).
 * normal_hit_5 uses s1.p6 (skips p5 in talent items list per raw).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Mika.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Mika)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Mika)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Mika as MikaStatTable } from "../generated/charTables.js";
import { Mika as MikaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return MikaTalents.s1.p1;
      if (name === "normal_hit_2") return MikaTalents.s1.p2;
      if (name === "normal_hit_3") return MikaTalents.s1.p3;
      if (name === "normal_hit_4") return MikaTalents.s1.p4;
      if (name === "normal_hit_5") return MikaTalents.s1.p6;
      if (name === "charged_hit") return MikaTalents.s1.p7;
      if (name === "plunge") return MikaTalents.s1.p9;
      if (name === "plunge_low") return MikaTalents.s1.p10;
      if (name === "plunge_high") return MikaTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "mika_flowfrost_arrow_dmg") return MikaTalents.s2.p1;
      if (name === "mika_rimestar_flare_dmg")  return MikaTalents.s2.p2;
      if (name === "mika_rimestar_shard_dmg")  return MikaTalents.s2.p3;
    }
    if (talent === "burst") {
      if (name === "heal_percent")          return MikaTalents.s3.p2;
      if (name === "heal_flat")             return MikaTalents.s3.p1;
      if (name === "mika_heal_dot_percent") return MikaTalents.s3.p4;
      if (name === "mika_heal_dot_flat")    return MikaTalents.s3.p3;
    }
    throw new Error(`mika talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

// C6 "Companion's Counsel" physical CRIT DMG key, declared on every PHYSICAL feature so the
// crit_dmg_phys:60 self condition (gated C6) reaches each hit's crit term. Her getDefaultStatsCritDamage
// auto-includes crit_dmg_<element>, but the port does NOT fold ELEMENT crit generically (compileFeature.ts
// §critBonusTypeKeys folds type-crit only) → the feature must declare it, exactly like Gorou's crit_dmg_geo.
// Base-inert: crit_dmg_phys reads 0 until the C6 toggle fires.
const PHYS_CRIT: readonly string[] = ["crit_dmg_phys"];

const features: readonly Feature[] = [
  // --- Normal attacks (physical polearm, no element override) ---
  // raw/genshin_calc_pub/src/js/db/Char/Mika.js:151-169
  {
    name: "normal_hit_1",
    critDamageBonuses: PHYS_CRIT,
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    critDamageBonuses: PHYS_CRIT,
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  {
    name: "normal_hit_3",
    critDamageBonuses: PHYS_CRIT,
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // normal_hit_4: 2-hit multihit parent (items × 2 of p4).
  // raw/genshin_calc_pub/src/js/db/Char/Mika.js:178-195
  {
    name: "normal_hit_4",
    critDamageBonuses: PHYS_CRIT,
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
    ],
  },
  // Child: individual hit of normal_hit_4.
  // raw/genshin_calc_pub/src/js/db/Char/Mika.js:196-206
  {
    name: "normal_hit_4_1",
    critDamageBonuses: PHYS_CRIT,
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  {
    name: "normal_hit_5",
    critDamageBonuses: PHYS_CRIT,
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
  },
  // --- Charged attack (physical polearm) ---
  // raw/genshin_calc_pub/src/js/db/Char/Mika.js:215-224
  {
    name: "charged_hit",
    critDamageBonuses: PHYS_CRIT,
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (physical) ---
  // raw/genshin_calc_pub/src/js/db/Char/Mika.js:225-251
  {
    name: "plunge",
    critDamageBonuses: PHYS_CRIT,
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    critDamageBonuses: PHYS_CRIT,
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    critDamageBonuses: PHYS_CRIT,
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Starfrost Swirl ---
  // mika_flowfrost_arrow_dmg: cryo flowfrost arrow hit (tap/hold).
  // raw/genshin_calc_pub/src/js/db/Char/Mika.js:251-260
  {
    name: "mika_flowfrost_arrow_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.mika_flowfrost_arrow_dmg") }],
  },
  // mika_rimestar_flare_dmg: cryo rimestar flare (AoE on arrow hit).
  // raw/genshin_calc_pub/src/js/db/Char/Mika.js:261-270
  {
    name: "mika_rimestar_flare_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.mika_rimestar_flare_dmg") }],
  },
  // mika_rimestar_shard_dmg: cryo shard hits from rimestar.
  // raw/genshin_calc_pub/src/js/db/Char/Mika.js:271-280
  {
    name: "mika_rimestar_shard_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.mika_rimestar_shard_dmg") }],
  },
  // --- FeatureHeal: burst heals — HP-scaled FeatureMultiplierList (Mika.js:281-303) ---
  // heal: s3.p2 (% HP) + s3.p1 (flat). Mika.js:281-291. talent items table:[p2, p1] → getList[0]=p2 pct, [1]=p1 flat.
  {
    name: "heal",
    category: "burst",
    output: { kind: "heal" },
    multipliers: [
      {
        scaling: "hp",
        leveling: "char_skill_burst",
        values: talents.get("burst.heal_percent"),
        flatValues: talents.get("burst.heal_flat"),
      },
    ],
  },
  // mika_heal_dot: s3.p4 (% HP) + s3.p3 (flat). Mika.js:293-302. talent items table:[p4, p3].
  {
    name: "mika_heal_dot",
    category: "burst",
    output: { kind: "heal" },
    multipliers: [
      {
        scaling: "hp",
        leveling: "char_skill_burst",
        values: talents.get("burst.mika_heal_dot_percent"),
        flatValues: talents.get("burst.mika_heal_dot_flat"),
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Factor Confluence" (ConditionStatic description-only) → SKIP.
// C2 "Companion's Ingress" (ConditionStatic description-only) → SKIP.
// C3 "Reconnaissance Report" → +3 Elemental Burst (Skyfeather Song) levels.
//   raw: constellation[2]: Condition{ settings:{char_skill_burst_bonus:3} }
// C4 "Sunfrost Encomium" (ConditionStatic description-only) → SKIP.
// C5 "Signal Arrow": +3 Elemental Skill (Starfrost Swirl) levels.
//   raw: top-level conditions array (not in constellation array which is {}):
//   Condition{ settings:{char_skill_elemental_bonus:3}, subConditions:[ConditionConstellation(5)] }
//   The constellation array entry [4] is empty {}; the talent bump lives in the char's
//   conditions array as a sub-conditioned entry. Modelled identically here.
// C6 "Companion's Counsel" (ConditionBoolean crit_dmg_phys toggle) → SKIP (off).
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/Mika.js:305-316, 373-425

const constellationConditions: readonly Condition[] = [
  // C3: +3 Elemental Burst (Skyfeather Song) levels.
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 Elemental Skill (Starfrost Swirl) levels.
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
  // SELF "Suppressive Barrage" (A1) — +10% Physical DMG per Detector stack (A1PhysBonus=10), lifting
  // every Mika PHYSICAL hit (normals/charged/plunge). ConditionStacks read from mika_suppressive_barrage.
  // Her maxStacks is gated: 3 (no A4) / 4 (A4 xor C6) / 5 (A4 and C6). At the oracle rep (ascension 6 →
  // A4 always active) that collapses to max 4 below C6 and max 5 at C6 — modelled as TWO mutually-exclusive
  // gated stacks conditions (the port's ConditionStacks maxStacks is a fixed number; the variable gate
  // can't live on one entry). SELF mirror of party.mika_suppressive_barrage (which assumes max 5); the
  // port modelled only the party.* version → golden-blind SKIP. (The asc<4 max-3 case never occurs in our
  // asc-6 surface.) Base-inert: mika_suppressive_barrage absent → 0 stacks → 0% dmg_phys.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Mika.js:324-363 (conditions[2], ConditionStacks, info.ascension 1).
  {
    type: "stacks",
    name: "mika_suppressive_barrage",
    maxStacks: 4,
    stats: { dmg_phys: 10 },
    condition: { type: "not", items: [{ type: "constellation", constellation: 6 }] }, // cons < 6 → max 4
  },
  {
    type: "stacks",
    name: "mika_suppressive_barrage",
    maxStacks: 5,
    stats: { dmg_phys: 10 },
    condition: { type: "constellation", constellation: 6 }, // C6 → max 5
  },
  // SELF "Companion's Counsel" (C6) — +60% Physical CRIT DMG (C6PhysCritDmg=60), lifting the crit/avg of
  // every Mika physical hit (via each physical feature's critDamageBonuses:['crit_dmg_phys']). ConditionBoolean
  // gated at C6 (lives in constellation[5] → THE CONSTELLATION IS A GATE). SELF mirror of
  // party.mika_companions_counsel; the port modelled only the party.* version → golden-blind SKIP.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Mika.js:414-422 (constellation[5], ConditionBoolean).
  {
    type: "boolean",
    name: "mika_companions_counsel",
    stats: { crit_dmg_phys: 60 },
    condition: { type: "constellation", constellation: 6 },
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const mika: DbObjectChar = {
  name: "mika",
  gameId: 10000080,
  rarity: 4,
  element: "cryo",
  weapon: "polearm",
  origin: "mondstadt",
  statTable: MikaStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // partyData — teammate kit buffs (P3.5.2 Bucket A)
  // Skill "Soulwind": ConditionBooleanLevels(mika_soulwind) → atk_speed_normal per talent level.
  //   Level from mika_char_skill_elemental (ConditionNumberTalent, 1-10; baked via sourceSettings).
  //   s2.p4: [13,14,15,16,17,18,19,20,21,22,23,24,25] (13 entries for C5 max=13).
  // C5 "Constellation 5" toggle: ConditionBoolean(party.mika_constellation_5)
  //   → settings: { mika_char_skill_elemental_bonus: 3 } (talent +3).
  // A1 "Suppressive Barrage": ConditionStacks(mika_suppressive_barrage) maxStacks:5
  //   → dmg_phys:10 per stack (A1PhysBonus=10).
  // C6 "Companion's Counsel": ConditionBoolean(mika_companions_counsel) → crit_dmg_phys:60.
  //   C6PhysCritDmg=60.
  //   Source: raw/genshin_calc_pub/src/js/db/Char/Mika.js partyData
  partyData: {
    conditions: [
      // C5 toggle: +3 skill talent levels to mika_char_skill_elemental.
      {
        type: "boolean",
        name: "party.mika_constellation_5",
        settings: { mika_char_skill_elemental_bonus: 3 },
      },
      // Skill "Soulwind": atk_speed_normal per skill talent level.
      // raw s2.p4: [13,14,15,16,17,18,19,20,21,22,23,24,25]
      {
        type: "static-level",
        levelSetting: "mika_char_skill_elemental",
        levelStats: { atk_speed_normal: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25] },
        condition: { type: "boolean", name: "mika_soulwind" },
      },
      // A1 "Suppressive Barrage": +10% phys DMG per stack (max 5).
      {
        type: "stacks",
        name: "mika_suppressive_barrage",
        maxStacks: 5,
        stats: { dmg_phys: 10 },
      },
      // C6 "Companion's Counsel": +60% phys CRIT DMG.
      {
        type: "boolean",
        name: "mika_companions_counsel",
        stats: { crit_dmg_phys: 60 },
      },
    ],
  },
};
