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
 * BOND-OF-LIFE. Her two `clorinde_impale_the_night_*_heal` FeatureHeal entries
 * use FeatureMultiplierBondOfLife. The oracle lists both at value 0 with empty
 * `damageType` (display-only, filtered by the golden harness), and BoL is 0 in
 * the fixed solo build, so no BoL→damage scaling is exercised — nothing to port.
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

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
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
  // --- Skill: Hunter's Vigil — Surging Blade (electro projectile, unconditional) ---
  {
    name: "surging_blade_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.surging_blade_dmg") }],
  },
  // --- Burst: Last Lightfall (electro, single hit) ---
  // raw: FeatureDamageBurst burst_dmg, single FeatureMultiplier(s3.p1).
  {
    name: "burst_dmg",
    category: "burst",
    element: "electro",
    damageBonuses: ["dmg_burst_clorinde"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
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
};
