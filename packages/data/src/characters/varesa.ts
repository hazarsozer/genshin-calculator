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

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
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
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
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
    // raw feature damageBonuses: ['dmg_burst_varesa'] (Varesa.js:289) — base-inert (the key reads 0
    // until C4 "The Courage to Press On" toggles varesa_the_courage_to_press_on_2 → dmg_burst_varesa:100).
    damageBonuses: ["dmg_burst_varesa"],
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.varesa_flying_kick_dmg") },
    ],
  },
  // Volcanic Collapse — burst-category PLUNGE shockwave (damageType "plunge").
  // raw: FeatureDamagePlungeShockWave (Varesa.js:303) → tags:["plunge_shockwave"].
  {
    name: "varesa_volcanic_collapse_dmg",
    tags: ["plunge_shockwave"],
    category: "burst",
    damageType: "plunge",
    element: "electro",
    // raw feature damageBonuses: ['dmg_burst_varesa'] (Varesa.js:306) — base-inert (see flying kick).
    damageBonuses: ["dmg_burst_varesa"],
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.varesa_volcanic_collapse_dmg") },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Undying Passion": ConditionStatic text_percent (display-only) — SKIP.
// C2 "Beyond the Edge of Light": ConditionStatic, no real stats — SKIP.
// C3 "The Hero's Call": +3 burst talent (char_skill_burst_bonus).
// C4 "The Courage to Press On": ConditionBoolean toggle (dmg_burst_varesa) — SKIP.
// C5 "Blazing Justice": +3 attack talent (char_skill_attack_bonus).
// C6 "A Hero of Justice's Triumph": ConditionBoolean toggle (crit_rate/dmg_plunge/burst) — SKIP.
// Sources: raw/genshin_calc_pub/src/js/db/Char/Varesa.js:401-480

const constellationConditions: readonly Condition[] = [
  // C3 — +3 Elemental Burst (Guardian Vent).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5 — +3 Normal Attack (standard attacks).
  { type: "constellation", constellation: 5, settings: { char_skill_attack_bonus: 3 } },
  // SELF C4 "The Courage to Press On" part 2 (raw cons[3] conditions[1], Varesa.js:443-451) — boolean
  // varesa_the_courage_to_press_on_2 → +100% burst DMG (dmg_burst_varesa = C4BurstBonus), gated on
  // constellation 4. Lifts the two burst features (flying kick + volcanic collapse) via the restored
  // damageBonuses key. Was golden-blind SKIPPED. (Part 1's ATK-scaled plunge multiplier
  // [varesa_plunge_c4 tags + capValue] stays Tier-B — feature-tags + cap surface.)
  {
    type: "boolean",
    name: "varesa_the_courage_to_press_on_2",
    stats: { dmg_burst_varesa: 100 },
    condition: { type: "constellation", constellation: 4 },
  },
  // SELF C6 "A Hero of Justice's Triumph" (raw cons[5], Varesa.js:465-474) — boolean
  // varesa_a_hero_of_justices_triumph → +10% crit rate / +100% crit DMG to plunge AND burst
  // (C6CritRate / C6CritDmg), gated on constellation 6. The damageType-scoped crit keys apply to her
  // plunge (plunge/plunge_low/plunge_high + volcanic collapse) and burst (flying kick) features.
  {
    type: "boolean",
    name: "varesa_a_hero_of_justices_triumph",
    stats: {
      crit_rate_plunge: 10,
      crit_rate_burst: 10,
      crit_dmg_plunge: 100,
      crit_dmg_burst: 100,
    },
    condition: { type: "constellation", constellation: 6 },
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
  conditions: constellationConditions,
};
