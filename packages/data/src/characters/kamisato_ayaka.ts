/**
 * Kamisato Ayaka — cryo sword ATK scaler.
 *
 * 5-hit normal combo (n4: 3-hit multihit → child normal_hit_4_1 is one hit),
 * 3-hit charged (charged_hit_total multihit parent → child charged_hit is one
 * hit), plunge/low/high, cryo skill (Kamisato Art: Hyouka), cryo burst
 * (Kamisato Art: Soumetsu = slashing + bladestorm hits).
 *
 * NORMAL/CHARGED ELEMENT: physical (no `element` field). Ayaka's cryo infusion
 * (`attack_infusion_cryo` on the Senho ConditionBoolean) is a TOGGLE, OFF in the
 * fixed solo build, so the oracle computes normals/charged as physical. The
 * unconditional `allowed_infusion_cryo` Condition only ENABLES infusion; it does
 * not apply it. Leaving these features un-elemented matches the fixture.
 *
 * No always-on passive DMG bonuses folded: A1 (`dmg_normal`/`dmg_charged` +30) is
 * the `ayaka_amatsumi…` ConditionBoolean toggle; A4 (`dmg_cryo` +18) is the
 * `ayaka_kanten…` ConditionBoolean toggle. Both are OFF in the solo build, so no
 * baseStats. The ascension crit-DMG secondary is already folded into the stat
 * table via the generated charTables (oracle stats.crit_dmg = 138.4 ✓).
 *
 * C2 adds `ayaka_add_slashing_dmg` / `ayaka_add_bladestorm_dmg` (20% scalingMultiplier
 * on the burst talent, FeatureDamageBurst, gated at constellation≥2). C3/C5 are
 * talent-bump conditions (+3 burst/skill). C4/C6 are toggle booleans — SKIP.
 * Reactions (superconduct/electrocharged/shatter) are auto-emitted by the loader
 * from element=cryo — not declared here.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Ayaka.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Ayaka)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Ayaka)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Ayaka as AyakaStatTable } from "../generated/charTables.js";
import { Ayaka as AyakaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return AyakaTalents.s1.p1;
      if (name === "normal_hit_2") return AyakaTalents.s1.p2;
      if (name === "normal_hit_3") return AyakaTalents.s1.p3;
      if (name === "normal_hit_4") return AyakaTalents.s1.p4;
      if (name === "normal_hit_5") return AyakaTalents.s1.p7;
      if (name === "charged_hit") return AyakaTalents.s1.p8;
      if (name === "plunge") return AyakaTalents.s1.p10;
      if (name === "plunge_low") return AyakaTalents.s1.p11;
      if (name === "plunge_high") return AyakaTalents.s1.p12;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return AyakaTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "ayaka_slashing_dmg") return AyakaTalents.s4.p1;
      if (name === "ayaka_bladestorm_dmg") return AyakaTalents.s4.p2;
    }
    throw new Error(`kamisato_ayaka talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical — infusion toggle off in solo build) ---
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // normal_hit_4: 3-hit multihit (same multiplier × 3). Parent models the total.
  // raw: FeatureDamageMultihit({ items: [{ hits: 3, multipliers: [p4] }] })
  {
    name: "normal_hit_4",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
    ],
  },
  // Child hit: one of the 3 hits of normal_hit_4 (a third of the parent total).
  // raw: FeatureDamageNormal({ name: 'normal_hit_4_1', isChild: true, hits: 3, [p4] })
  // isChild DROPPED so it emits as its own fixture row attack.normal_hit_4_1.
  {
    name: "normal_hit_4_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  {
    name: "normal_hit_5",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
  },
  // --- Charged attack (3-hit cyclonic slash) ---
  // charged_hit_total: 3-hit multihit (same multiplier × 3). Parent models the total.
  // raw: FeatureDamageMultihit({ damageType: 'charged', items: [{ hits: 3, multipliers: [p8] }] })
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }] },
    ],
  },
  // Child hit: one of the 3 hits of charged_hit_total (a third of the parent).
  // raw: FeatureDamageCharged({ name: 'charged_hit', isChild: true, hits: 3, [p8] })
  // isChild DROPPED so it emits as its own fixture row attack.charged_hit.
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
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
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Kamisato Art: Hyouka (cryo) ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Kamisato Art: Soumetsu (cryo) ---
  {
    name: "ayaka_slashing_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.ayaka_slashing_dmg") }],
  },
  {
    name: "ayaka_bladestorm_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.ayaka_bladestorm_dmg") }],
  },
  // --- C2 "Blizzard Blade Seki no To": two additional burst hits dealing 20% of the
  // base slashing/bladestorm DMG each. FeatureDamageBurst gated by ConditionConstellation(2).
  // C2BurstDamage = 20; scalingMultiplier = 20/100 = 0.20. Raw Ayaka.js:294-319.
  {
    name: "ayaka_add_slashing_dmg",
    category: "burst",
    element: "cryo",
    condition: { type: "constellation", constellation: 2 },
    multipliers: [
      {
        leveling: "char_skill_burst",
        values: talents.get("burst.ayaka_slashing_dmg"),
        scalingMultiplier: 0.2,
        source: "constellation2",
      },
    ],
  },
  {
    name: "ayaka_add_bladestorm_dmg",
    category: "burst",
    element: "cryo",
    condition: { type: "constellation", constellation: 2 },
    multipliers: [
      {
        leveling: "char_skill_burst",
        values: talents.get("burst.ayaka_bladestorm_dmg"),
        scalingMultiplier: 0.2,
        source: "constellation2",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Snowswept Sakura": ConditionStatic text_percent_chance:50 — display-only, SKIP.
// C2 "Blizzard Blade Seki no To": ConditionStatic text_percent_dmg:20 — display-only
//   (the actual C2 damage comes from ayaka_add_slashing_dmg / ayaka_add_bladestorm_dmg above).
// C3: +3 levels to Kamisato Art: Soumetsu (burst). Raw cons[2] char_skill_burst_bonus:3.
// C4 "Ebb and Flow": ConditionBoolean toggle (enemy_def_reduce:30) — SKIP (toggle OFF).
// C5: +3 levels to Kamisato Art: Hyouka (skill). Raw cons[4] char_skill_elemental_bonus:3.
// C6 "Dance of Suigetsu": ConditionBoolean toggle (dmg_charged:298) — SKIP (toggle OFF).
// Raw: db/Char/Ayaka.js constellation array (Ayaka.js:364-431).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Kamisato Art: Soumetsu (burst).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 levels to Kamisato Art: Hyouka (skill).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const kamisatoAyaka: DbObjectChar = {
  name: "kamisato_ayaka",
  gameId: 10000002,
  rarity: 5,
  element: "cryo",
  weapon: "sword",
  origin: "inazuma",
  statTable: AyakaStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // C4 "Ebb and Flow" — enemy DEF -30%.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Ayaka.js (partyData conditions)
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { enemy_def_reduce: 30 },
        condition: { type: "boolean", name: "party.ayaka_eikyo_ryuuhan" },
      },
    ],
  },
};
