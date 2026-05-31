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
 * SKIPPED: C2 features `ayaka_add_slashing_dmg` / `ayaka_add_bladestorm_dmg`
 * (constellation, off at C0). Reactions (superconduct/electrocharged/shatter) are
 * auto-emitted by the loader from element=cryo — not declared here.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Ayaka.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Ayaka)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Ayaka)
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
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
};
