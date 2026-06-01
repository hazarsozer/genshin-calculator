/**
 * Mualani — hydro catalyst HP scaler (Nightsoul surfboard shark-rider).
 *
 * Normal attacks (Cooling Treatment): 3-hit hydro combo + charged hit, plunge /
 * plunge_low / plunge_high — all ATK-scaled, char_skill_attack. Mualani's plunge
 * tables live at s1.p6/p7/p8 (NOT p7/p8/p9 like most chars — she has no separate
 * p9/p10 entries; p5 is the charged stamina cost).
 *
 * Skill (Surfshark Wavebreaker): the shark bite, raw class
 * FeatureDamageNormalMualani — `category:'skill'` but `damageType:'normal'`
 * (extends FeatureDamageNormal, which forces damageType='normal'). So it groups
 * under the `skill.` key yet picks up the NORMAL DMG-bonus (dmg_normal), NOT
 * dmg_skill. HP-scaled off s2.p1 (mualani_shark_base_dmg). Confirmed against the
 * fixture: damageType:"normal", category:"skill", normal=2157.32.
 *   - FeatureDamageNormalMualani.getReactionMultipliers adds an extra
 *     bite-ratio multiplier ONLY when settings.mualani_byte_targets > 1. The
 *     ConditionDropdown defaults to 1 in the fixed solo build → no extra factor.
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Damage/Normal/Mualani.js
 *
 * Burst (Boomsharka-laka): burst_dmg, hydro, HP-scaled off s3.p1.
 *   damageBonuses:['dmg_burst_mualani'] — only ever set by C4
 *   (mualani_sharky_eats_puffies, 75%), inactive at C0 → reads 0.
 *   The second burst multiplier (A1/A4 "Natlan's Greatest Guide", 15/30/45% HP)
 *   is gated by ConditionBoolean(mualani_natlans_greatest_guide), a stacks toggle
 *   default 0 in the fixed build → OFF, omitted.
 *
 * Features OFF at baseline (not in fixture → omitted, mis-key guard would fail):
 *   - mualani_shark_missile_dmg: ConditionBooleanValue mualani_byte_targets >= 2;
 *     dropdown default 1 → OFF. Same talent as the bite (s2.p1).
 *
 * Char-level multipliers (global `multipliers[]`, all target tags:['shark_byte'])
 * contribute nothing at baseline, so omitted entirely:
 *   - mualani_wave_monentum_dmg: stacksLeveling mualani_wave_momentum, stacks
 *     default 0 → adds 0.
 *   - mualani_shark_add_dmg: ConditionBooleanValue mualani_wave_momentum >= 3,
 *     default 0 → OFF.
 *   - C1 mualani_the_leisurely_meztli (66% HP): constellation-gated → OFF at C0.
 *
 * Reaction features (electrocharged / rupture / shatter) are emitted generically
 * by the engine from element=hydro — not declared here (cf. neuvillette.ts).
 *
 * Constellations skipped (C0 build).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Mualani.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Damage/Normal/Mualani.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Mualani)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Mualani)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Mualani as MualaniStatTable } from "../generated/charTables.js";
import { Mualani as MualaniTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return MualaniTalents.s1.p1;
      if (name === "normal_hit_2") return MualaniTalents.s1.p2;
      if (name === "normal_hit_3") return MualaniTalents.s1.p3;
      if (name === "charged_hit")  return MualaniTalents.s1.p4;
      if (name === "plunge")       return MualaniTalents.s1.p6;
      if (name === "plunge_low")   return MualaniTalents.s1.p7;
      if (name === "plunge_high")  return MualaniTalents.s1.p8;
    }
    if (talent === "skill") {
      if (name === "mualani_shark_base_dmg") return MualaniTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return MualaniTalents.s3.p1;
    }
    throw new Error(`mualani talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (hydro infusion implied; raw declares element:'hydro') ---
  // raw: FeatureDamageNormal normal_hit_1 (ATK-scaled, hydro)
  {
    name: "normal_hit_1",
    category: "attack",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // --- Charged attack ---
  // raw: FeatureDamageCharged charged_hit (ATK-scaled, hydro)
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks ---
  // raw: FeatureDamagePlungeCollision plunge
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_low
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Surfshark Wavebreaker (the shark bite) ---
  // raw: FeatureDamageNormalMualani mualani_shark_bite_dmg —
  //   category:'skill', damageType:'normal' (forced by FeatureDamageNormal),
  //   HP-scaled off s2.p1. byte-ratio extra multiplier OFF at mualani_byte_targets=1.
  {
    name: "mualani_shark_bite_dmg",
    category: "skill",
    damageType: "normal",
    element: "hydro",
    multipliers: [
      { scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.mualani_shark_base_dmg") },
    ],
  },
  // --- Burst: Boomsharka-laka ---
  // raw: FeatureDamageBurst burst_dmg (HP-scaled, hydro)
  //   damageBonuses:['dmg_burst_mualani'] — C4-only, reads 0 at C0.
  //   A1/A4 second multiplier gated by mualani_natlans_greatest_guide (default 0) → omitted.
  {
    name: "burst_dmg",
    category: "burst",
    element: "hydro",
    damageBonuses: ["dmg_burst_mualani"],
    multipliers: [
      { scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "The Leisurely Meztli": ConditionBoolean toggle (hp bonus to shark bites) → SKIP.
// C2 "Mualani, Going All Out!": ConditionStatic with no real stats → SKIP.
// C3 "Surfing Atop Jaws": +3 Elemental Skill talent levels.
//    Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
// C4 "Sharky Eats Puffies": ConditionBoolean toggle (dmg_burst_mualani) → SKIP.
// C5 "Same Day Returns": +3 Elemental Burst talent levels.
//    Raw cons[4]: Condition{ settings:{ char_skill_burst_bonus:3 } }
// C6 "Spirit of the Spring's People": ConditionStatic with no real stats → SKIP.
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/Mualani.js:332-393

const constellationConditions: readonly Condition[] = [
  // C3: +3 Elemental Skill (Surfshark Wavebreaker).
  // Raw cons[2]: new Condition({ settings: { char_skill_elemental_bonus: 3 } }).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 Elemental Burst (Boomsharka-laka).
  // Raw cons[4]: new Condition({ settings: { char_skill_burst_bonus: 3 } }).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const mualani: DbObjectChar = {
  name: "mualani",
  gameId: 10000102,
  rarity: 5,
  element: "hydro",
  weapon: "catalyst",
  origin: "natlan",
  statTable: MualaniStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
