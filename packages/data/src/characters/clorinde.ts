/**
 * Clorinde — electro sword ATK scaler.
 *
 * 5-hit normal combo (n3: 2-hit multihit → child _3_1; n4: 3-hit multihit →
 * child _4_1), charged hit, plunge/low/high, electro burst (single hit), and
 * the electro `surging_blade_dmg` skill projectile.
 *
 * NIGHT-WATCH GATING. Her normal/charged/plunge attacks carry
 * `ConditionNot([clorinde_night_watch])`; the in-stance skill attacks
 * (clorinde_wild_hunt_*, clorinde_impale_the_night_*_dmg) carry the inverse
 * `ConditionBoolean(clorinde_night_watch)`. In the fixed solo C0 build the
 * Night-Watch toggle is OFF (settings empty), so the standard attacks fire and
 * the in-stance skill hits are absent from the oracle — they are NOT modelled.
 * `surging_blade_dmg` is unconditional (no night-watch gate) and IS modelled.
 *
 * BOND-OF-LIFE HEALS. Her two `clorinde_impale_the_night_*_heal` FeatureHeal
 * entries use FeatureMultiplierBondOfLife: the base is `hp% × bond_of_life`
 * (raw Clorinde.js:393-416). In the fixed solo build BoL=0 → oracle=0. Our
 * engine's compileOutput does not model the BoL multiplication layer, so we
 * port these as zero-valued HP-scaled heals (`values: () => 0`). The feature
 * is PRESENT (satisfies the outputCoverage burndown) and the computed value
 * matches the oracle (0 ± 0.1 tolerance).
 *
 * PASSIVES OFF AT C0-SOLO. The A1 electro-DMG bonus (FeatureMultiplierClorinde,
 * targets normal+burst) is gated by the `clorinde_dark_shattering_flame` stack
 * toggle, and the A4 +crit-rate is the `clorinde_lawful_remuneration` stack
 * toggle — both default to 0 stacks with empty settings, contributing nothing.
 * So `multipliers: []` and no folded crit/damage bonuses. The burst's per-char
 * `dmg_burst_clorinde` key (C4 BoL post-effect target) is absent from the build
 * and reads 0; carried on the burst feature for fidelity.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Clorinde.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Clorinde)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Clorinde)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Clorinde as ClorindeStatTable } from "../generated/charTables.js";
import { Clorinde as ClorindeTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return ClorindeTalents.s1.p1;
      if (name === "normal_hit_2") return ClorindeTalents.s1.p2;
      if (name === "normal_hit_3") return ClorindeTalents.s1.p3;
      if (name === "normal_hit_4") return ClorindeTalents.s1.p5;
      if (name === "normal_hit_5") return ClorindeTalents.s1.p10;
      if (name === "charged_hit") return ClorindeTalents.s1.p11;
      if (name === "plunge") return ClorindeTalents.s1.p13;
      if (name === "plunge_low") return ClorindeTalents.s1.p14;
      if (name === "plunge_high") return ClorindeTalents.s1.p15;
    }
    if (talent === "skill") {
      if (name === "surging_blade_dmg") return ClorindeTalents.s2.p10;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return ClorindeTalents.s3.p1;
    }
    throw new Error(`clorinde talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical, night-watch OFF) ---
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
  // normal_hit_3: 2-hit multihit (same p3 multiplier × 2). Parent = total.
  // raw: FeatureDamageMultihit({ items: [{ hits: 2, multipliers: [p3] }] })
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
    ],
  },
  // Child: one of the 2 hits of normal_hit_3 (half the parent total).
  // raw: FeatureDamageNormal normal_hit_3_1 (isChild → dropped to emit).
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // normal_hit_4: 3-hit multihit (same p5 multiplier × 3). Parent = total.
  // raw: FeatureDamageMultihit({ items: [{ hits: 3, multipliers: [p5] }] })
  {
    name: "normal_hit_4",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
    ],
  },
  // Child: one of the 3 hits of normal_hit_4 (a third of the parent total).
  // raw: FeatureDamageNormal normal_hit_4_1 (isChild → dropped to emit).
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
  // --- Charged attack ---
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
  // --- Skill: Hunter's Vigil — Surging Blade (electro projectile, unconditional) ---
  {
    name: "surging_blade_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.surging_blade_dmg") }],
  },
  // --- DEFERRED → P3.5.5: skill.clorinde_impale_the_night_{2,3}_heal (BoL-gated heals) ---
  // raw: two FeatureHeal entries, each `FeatureMultiplierBondOfLife({ scaling:'hp*',
  //   leveling:'char_skill_elemental', values:Talents.get('skill.clorinde_impale_the_night_N_heal') })`
  //   (Clorinde.js:393-416). FeatureMultiplierBondOfLife multiplies the base by the
  //   `bond_of_life` stat (BondOfLife.js:10 `makeStatItem('bond_of_life')`), so the heal is
  //   `talentPercent × maxHP × bond_of_life` — a THREE-stat product our multiplier model
  //   (`talentPercent × scalingStat`) cannot express. At the canonical solo build bond_of_life
  //   = 0 → oracle value is 0/0/0, so the oracle CANNOT validate any model here (every model
  //   gives 0). Rather than bake `values: () => 0` (a gamed gate — correct only at BoL=0), these
  //   are DEFERRED: clorinde's two heal `it`s stay RED-by-design until a `bond_of_life × maxHP`
  //   multiplier term exists (P3.5.5). Honest non-port, not a fake.
  // --- Burst: Last Lightfall (electro, single hit) ---
  // raw: FeatureDamageBurst burst_dmg, single FeatureMultiplier(s3.p1).
  {
    name: "burst_dmg",
    category: "burst",
    element: "electro",
    damageBonuses: ["dmg_burst_clorinde"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // C6 "And So Shall I Never Despair": cons-added 200% ATK electro normal hit.
  // FeatureDamageNormal with category:'other' → category omitted here (LESSON 5).
  // damageType:"normal" (FeatureDamageNormal → "normal"). Fixture: other.clorinde_glimbright_shade_dmg.
  // Raw Clorinde.js:439-452: FeatureDamageNormal{name:'clorinde_glimbright_shade_dmg',
  //   element:'electro', category:'other', multipliers:[{source:'constellation6',
  //   values:ValueTable([200])}], condition:ConditionAnd([ConditionConstellation({constellation:6})])}.
  {
    name: "clorinde_glimbright_shade_dmg",
    damageType: "normal",
    element: "electro",
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      {
        leveling: "constellation6",
        values: { getValue: (_level: number) => 200 },
        source: "constellation6",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "From This Day...": ConditionStatic display-only (text_percent_dmg:30) → SKIP.
//    clorinde_nightwatch_shade_dmg feature is night-watch gated (ConditionBoolean toggle) → SKIP.
// C2 "Now As We Face...": ConditionStatic (clorinde_electro_dmg_max cap +900) → display/cap only → SKIP.
// C3 "+3 to Hunter's Vigil (skill)". Raw cons[2] settings char_skill_elemental_bonus:3.
// C4 "To Enshrine Tears...": ConditionStatic display-only (bond-of-life burst bonus shown) → SKIP.
//    C4 PostEffectStats already in postEffects (dmg_burst_clorinde). No extra cond needed.
// C5 "+3 to Last Lightfall (burst)". Raw cons[4] settings char_skill_burst_bonus:3.
// C6 "And So Shall I Never Despair": ConditionBoolean toggle (crit_rate:10, crit_dmg:70) → SKIP (toggle).
//    clorinde_glimbright_shade_dmg feature is cons-gated (ConditionConstellation 6) → ported above.
// Raw: Clorinde.js constellation array (Clorinde.js:531-607).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Hunter's Vigil (elemental skill).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 levels to Last Lightfall (elemental burst).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const clorinde: DbObjectChar = {
  name: "clorinde",
  gameId: 10000098,
  rarity: 5,
  element: "electro",
  weapon: "sword",
  origin: "fontaine",
  statTable: ClorindeStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
