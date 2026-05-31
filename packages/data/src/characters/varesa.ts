/**
 * Varesa — electro catalyst, Nightsoul plunge bruiser (Natlan).
 *
 * 3-hit normal combo, charged hit, plunge / plunge_low (shockwave) /
 * plunge_high (shockwave); electro skill (Riding the Night Rainbow rush);
 * electro burst (Guardian Vent flying kick) plus a burst-category plunge
 * shockwave (Volcanic Collapse). All hits electro (catalyst infuses innately;
 * raw sets element:'electro' on every Varesa damage feature).
 *
 * STANCE — `varesa_fiery_passion` (Fiery Passion / Nightsoul) is a manual
 * ConditionBoolean toggle, OFF in the fixed solo-C0 build. Every damage feature
 * in raw carries TWO multipliers: a non-stance one (condition: stanceRevCond)
 * and a Fiery-Passion one (condition: stanceCond). With the stance OFF only the
 * non-stance multiplier fires, so we port ONLY the non-stance talent slots:
 *   normal_hit_1/2/3 → s1.p1/p2/p3   (NOT the varesa_* p9/p10/p11 stance slots)
 *   charged_hit      → s1.p4         (stance: s1.p12)
 *   plunge           → s1.p6         (stance: s1.p14)
 *   plunge_low       → s1.p7         (stance: s1.p15)
 *   plunge_high      → s1.p8         (stance: s1.p16)
 *   skill rush       → s2.p1         (stance: s2.p2)
 *   burst flying kick→ s3.p1         (stance: s3.p2)
 *   volcanic collapse→ s3.p5         (no stance variant; single multiplier)
 *
 * VOLCANIC COLLAPSE is a burst-category PLUNGE shockwave: raw
 * `FeatureDamagePlungeShockWave({category:'burst', ...})` → fixture key
 * `burst.varesa_volcanic_collapse_dmg` with damageType "plunge". So
 * category:'burst' (key prefix + dmg_burst), damageType:'plunge' (RES/plunge
 * keys), element:'electro'. Leveling is char_skill_burst (burst slot).
 *
 * PASSIVES / BONUSES — all OFF in the fixed solo-C0 build, so none folded:
 *   - A1 `varesa_tag_team_triple_jump`: a manual ConditionBoolean ALSO gated on
 *     a constellation; its +plunge-DMG multiplier is OFF (toggle off, C0).
 *   - A4 `varesa_the_hero_twice_returned`: a ConditionStacks (+35% ATK ×2),
 *     OFF by default (no stacks set in the fixed build).
 *   - damageBonuses on raw features — `dmg_plunge_varesa` (plunge_low/high) and
 *     `dmg_burst_varesa` (flying kick, volcanic collapse) — are ONLY set by C4
 *     (`varesa_the_courage_to_press_on_2`, +100% burst DMG) and the C4 ATK-scaled
 *     plunge bonus. Both are constellation effects, OFF at C0 → those keys read 0,
 *     so the features are plain hits and the bonus stat keys are omitted.
 *   - C3/C5 talent-level bumps (char_skill_burst_bonus / char_skill_attack_bonus)
 *     and C6 crit keys are all C0-excluded.
 *
 * Reactions (electrocharged / overloaded / superconduct / hyperbloom / shatter)
 * are emitted generically by the loader from element:'electro'. Stats triple
 * (atk/crit/def/hp/mastery/recharge) is produced by buildStats.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Varesa.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Varesa)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Varesa)
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Varesa as VaresaStatTable } from "../generated/charTables.js";
import { Varesa as VaresaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver — non-stance (Fiery Passion OFF) slots only.
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return VaresaTalents.s1.p1;
      if (name === "normal_hit_2") return VaresaTalents.s1.p2;
      if (name === "normal_hit_3") return VaresaTalents.s1.p3;
      if (name === "charged_hit") return VaresaTalents.s1.p4;
      if (name === "plunge") return VaresaTalents.s1.p6;
      if (name === "plunge_low") return VaresaTalents.s1.p7;
      if (name === "plunge_high") return VaresaTalents.s1.p8;
    }
    if (talent === "skill") {
      if (name === "varesa_rush_dmg") return VaresaTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "varesa_flying_kick_dmg") return VaresaTalents.s3.p1;
      if (name === "varesa_volcanic_collapse_dmg") return VaresaTalents.s3.p5;
    }
    throw new Error(`varesa talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (electro catalyst, always electro) ---
  {
    name: "normal_hit_1",
    category: "attack",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // --- Charged attack (electro) ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (electro). plunge_low / plunge_high are shockwaves. ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Riding the Night Rainbow (electro rush) ---
  {
    name: "varesa_rush_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.varesa_rush_dmg") }],
  },
  // --- Burst: Guardian Vent (electro flying kick) ---
  {
    name: "varesa_flying_kick_dmg",
    category: "burst",
    element: "electro",
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.varesa_flying_kick_dmg") },
    ],
  },
  // Volcanic Collapse — burst-category PLUNGE shockwave (damageType "plunge").
  {
    name: "varesa_volcanic_collapse_dmg",
    category: "burst",
    damageType: "plunge",
    element: "electro",
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.varesa_volcanic_collapse_dmg") },
    ],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const varesa: DbObjectChar = {
  name: "varesa",
  gameId: 10000111,
  rarity: 5,
  element: "electro",
  weapon: "catalyst",
  origin: "natlan",
  statTable: VaresaStatTable,
  talents,
  features,
  multipliers: [],
};
