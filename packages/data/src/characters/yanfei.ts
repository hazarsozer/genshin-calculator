/**
 * Yanfei — pyro catalyst ATK scaler.
 *
 * 3-hit normal combo (pyro, catalyst infuses innately), a charged hit plus the
 * Scarlet-Seal-consuming charged variants (yanfei_charged_1/2/3 — one per seal
 * consumed; the 4-seal variant yanfei_charged_4 is C6-gated → skipped at C0),
 * the A4 Blazing Eye charged follow-up (flat 80% ATK), plunge, pyro skill,
 * pyro burst. All normals/charged/plunge are pyro.
 *
 * yanfei_blazing_eye: A4 passive (Blazing Eye). Her FeatureMultiplier carries
 * `source: 'ascension4'` with a constant ValueTable [80] — no talent leveling,
 * so it is a flat 80%-of-ATK charged hit (modelled with a 1-entry constant
 * table). raw: FeatureDamageChargedYanfei → damageType 'charged'.
 *
 * SOLO C0 fixed-build modelling notes:
 *   - Ascension secondary is Pyro DMG (`dmg_pyro_base`, +24% at A6) — always on,
 *     auto-folded by buildStats from the generated stat table. NOT modelled here.
 *   - A1 Proviso (`text_percent_dmg`) and A4 Blazing Eye's `text_percent_dmg: 80`
 *     are display-only text rows, not stat bonuses → nothing to fold.
 *   - A1's conditional `dmg_pyro` flat bonus is Scarlet-Seal-gated (OFF in the
 *     fixed solo build with no seal toggle) → not folded.
 *   - Constellations skipped (C0): yanfei_charged_4 (C6), C4 shield, C1/C2/C3/C5.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/YanFei.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js:1428 (YanFei)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (YanFei)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver, TalentTable } from "@genshin/types";
import { YanFei as YanFeiStatTable } from "../generated/charTables.js";
import { YanFei as YanFeiTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return YanFeiTalents.s1.p1;
      if (name === "normal_hit_2") return YanFeiTalents.s1.p2;
      if (name === "normal_hit_3") return YanFeiTalents.s1.p3;
      if (name === "charged_hit") return YanFeiTalents.s1.p4;
      if (name === "yanfei_charged_1") return YanFeiTalents.s1.p5;
      if (name === "yanfei_charged_2") return YanFeiTalents.s1.p6;
      if (name === "yanfei_charged_3") return YanFeiTalents.s1.p7;
      if (name === "yanfei_charged_4") return YanFeiTalents.s1.p8;
      if (name === "plunge") return YanFeiTalents.s1.p16;
      if (name === "plunge_low") return YanFeiTalents.s1.p17;
      if (name === "plunge_high") return YanFeiTalents.s1.p18;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return YanFeiTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return YanFeiTalents.s3.p1;
    }
    throw new Error(`yanfei talents: unknown path '${path}'`);
  },
};

// A4 Blazing Eye: flat 80% ATK, no talent leveling (raw: source 'ascension4',
// ValueTable [80]). Constant 1-entry table → getValue ignores the level.
const blazingEyeValues: TalentTable = { getValue: (_level: number) => 80 };

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (pyro catalyst) ---
  {
    name: "normal_hit_1",
    category: "attack",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // --- Charged attacks (pyro) ---
  // charged_hit = 0-seal charged; yanfei_charged_N = N-seal-consuming variants.
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  {
    name: "yanfei_charged_1",
    category: "attack",
    damageType: "charged",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.yanfei_charged_1") }],
  },
  {
    name: "yanfei_charged_2",
    category: "attack",
    damageType: "charged",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.yanfei_charged_2") }],
  },
  {
    name: "yanfei_charged_3",
    category: "attack",
    damageType: "charged",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.yanfei_charged_3") }],
  },
  // --- C6 "Extra Clause": unlocks a 4th Scarlet Seal slot → yanfei_charged_4 (4-seal consume).
  // Raw FeatureDamageCharged with element 'pyro', Talents.get('attack.yanfei_charged_4'),
  // ConditionConstellation({constellation:6}). YanFei.js:212-222.
  {
    name: "yanfei_charged_4",
    category: "attack",
    damageType: "charged",
    element: "pyro",
    condition: { type: "constellation", constellation: 6 },
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.yanfei_charged_4") }],
  },
  // --- A4 Blazing Eye: flat 80% ATK charged follow-up ---
  {
    name: "yanfei_blazing_eye",
    category: "attack",
    damageType: "charged",
    element: "pyro",
    multipliers: [{ leveling: "ascension4", values: blazingEyeValues }],
  },
  // --- Plunge attacks (pyro catalyst) ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Signed Edict ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Done Deal ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1: ConditionStatic stats:{text_percent:10} — display-only, SKIP.
// C2: ConditionBoolean toggle stats:{crit_rate_charged:20} — toggle OFF, SKIP.
// C3: +3 levels to Signed Edict (skill). Raw cons[2] settings char_skill_elemental_bonus:3.
// C4: ConditionStatic stats:{text_percent_hp:45} — display-only; shield feature has damageType:""
//     → skipped per brief (no damage triple, category 'other' in fixture).
// C5: +3 levels to Done Deal (burst). Raw char-level condition with
//     subConditions:[ConditionConstellation({constellation:5})].
// C6: cons-ADDED feature yanfei_charged_4 handled above in features array.
//     Raw cons[5] has ConditionStatic — display only, SKIP.
// Raw: db/Char/YanFei.js constellation array + conditions array (YanFei.js:365-420, 292-364).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to elemental skill talent.
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 levels to burst talent (raw: char conditions entry gated by ConditionConstellation(5)).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const yanfei: DbObjectChar = {
  name: "yanfei",
  gameId: 10000048,
  rarity: 4,
  element: "pyro",
  weapon: "catalyst",
  origin: "liyue",
  statTable: YanFeiStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
