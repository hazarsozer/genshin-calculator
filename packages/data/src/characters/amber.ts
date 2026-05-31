/**
 * Amber — pyro bow ATK scaler.
 *
 * 5-hit normal combo, physical aimed shot, pyro fully charged aimed shot,
 * plunge, pyro skill (Baron Bunny explosion), pyro burst (Fiery Rain).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Amber.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Amber)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Amber)
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Amber as AmberStatTable } from "../generated/charTables.js";
import { Amber as AmberTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return AmberTalents.s1.p1;
      if (name === "normal_hit_2") return AmberTalents.s1.p2;
      if (name === "normal_hit_3") return AmberTalents.s1.p3;
      if (name === "normal_hit_4") return AmberTalents.s1.p4;
      if (name === "normal_hit_5") return AmberTalents.s1.p5;
      if (name === "aimed") return AmberTalents.s1.p6;
      if (name === "charged_aimed") return AmberTalents.s1.p7;
      if (name === "plunge") return AmberTalents.s1.p8;
      if (name === "plunge_low") return AmberTalents.s1.p9;
      if (name === "plunge_high") return AmberTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "explosion_dmg") return AmberTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "wave_dmg") return AmberTalents.s3.p1;
    }
    throw new Error(`amber talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
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
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  {
    name: "normal_hit_5",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
  },
  // --- Charged attacks (bow aimed shots) ---
  // aimed: physical charged shot (FeatureDamageChargedAimed → damageType="charged")
  {
    name: "aimed",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // charged_aimed: fully charged pyro arrow
  {
    name: "charged_aimed",
    category: "attack",
    damageType: "charged",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_aimed") }],
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
  // --- Skill: Explosive Puppet — Baron Bunny explosion (pyro) ---
  {
    name: "explosion_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.explosion_dmg") }],
  },
  // --- Burst: Fiery Rain (pyro) ---
  // A1 "Every Arrow Finds Its Target" gives +10% crit rate to the burst; it is
  // auto-active at A6 (ConditionStatic gated only by ConditionAscensionChar, no
  // toggle), so it folds in via critRateBonuses + the char's baseStats.
  {
    name: "wave_dmg",
    category: "burst",
    element: "pyro",
    critRateBonuses: ["crit_rate_amber"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.wave_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const amber: DbObjectChar = {
  name: "amber",
  gameId: 10000021,
  rarity: 4,
  element: "pyro",
  weapon: "bow",
  origin: "mondstadt",
  statTable: AmberStatTable,
  talents,
  features,
  multipliers: [],
  // A1 "Every Arrow Finds Its Target": +10% crit rate to Fiery Rain (burst).
  // Auto-active at A6 (ConditionStatic gated only by ConditionAscensionChar),
  // so it is part of the baseline build. Raw: db/Char/Amber.js:289-300.
  baseStats: { crit_rate_amber: 10 },
};
