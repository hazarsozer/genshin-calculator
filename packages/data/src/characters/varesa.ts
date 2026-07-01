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
 * ConditionBoolean toggle, OFF in the fixed solo-C0 golden build. Every
 * stance-swappable damage feature in raw carries TWO multipliers: a non-stance
 * one (condition: stanceRevCond = NOT fiery_passion) and a Fiery-Passion one
 * (condition: stanceCond = fiery_passion). Both are modelled per-feature (raiden
 * baal_musou pattern): the base multiplier gated NOT_STANCE, the Fiery-Passion
 * multiplier gated STANCE, reading the varesa_* talent slots:
 *   normal_hit_1/2/3 : s1.p1/p2/p3   (stance s1.p9/p10/p11)
 *   charged_hit      : s1.p4         (stance s1.p12)
 *   plunge           : s1.p6         (stance s1.p14)
 *   plunge_low       : s1.p7         (stance s1.p15)
 *   plunge_high      : s1.p8         (stance s1.p16)
 *   skill rush       : s2.p1         (stance s2.p2)
 *   burst flying kick: s3.p1         (stance s3.p2)
 * With the stance OFF only the NOT_STANCE multiplier fires → byte-identical to
 * the old single-multiplier port (the goldens are unchanged).
 *
 * VOLCANIC COLLAPSE is a burst-category PLUNGE shockwave (raw
 * `FeatureDamagePlungeShockWave({category:'burst', ...})` → fixture key
 * `burst.varesa_volcanic_collapse_dmg`, damageType "plunge"). It has NO stance
 * variant — a single base multiplier (s3.p5, char_skill_burst) — plus a
 * per-feature A1 term gated on C1 (see A1 below). element 'electro'.
 *
 * A1 "Tag-Team, Triple Jump" (`varesa_tag_team_triple_jump`, a manual boolean):
 *   an ATK-scaled additive plunge-DMG term (her char-level FeatureMultiplier,
 *   leveling `varesa_a1_level` over ValueTable([50,180])), targeting the
 *   `varesa_plunge` tag (plunge_low/plunge_high). `varesa_a1_level` is published
 *   =2 by a ConditionStatic gated on the toggle AND (stance OR C1) → getValue(2)
 *   = 180%; when neither stance nor C1 hold it stays 1 → getValue(1) = 50%
 *   (her `getLevel` `|| 1`). Volcanic Collapse (tagged only `varesa_plunge_c4`,
 *   NOT `varesa_plunge`) carries its OWN A1 term gated additionally on C1. All
 *   ascension gates (her ConditionAscensionChar asc1) are dropped — always true
 *   at the fixed ascension-6 build.
 *
 * C4-part1 "The Courage to Press On" (`varesa_the_courage_to_press_on_1`, ≥C4):
 *   an ATK-scaled additive term (500% ATK) capped at 20000, targeting the
 *   `varesa_plunge_c4` tag (plunge_low/plunge_high + Volcanic Collapse). Her
 *   char-level FeatureMultiplier with capValue ValueTable([20000]).
 *   (C4-part2 `varesa_the_courage_to_press_on_2` dmg_burst_varesa + C6 crit are
 *   below in constellationConditions — ported in the earlier arc.)
 *
 * A4 "The Hero, Twice Returned" (`varesa_the_hero_twice_returned`, ConditionStacks,
 *   +35% ATK ×2): a global atk_percent stacks buff. OFF (0 stacks) in the fixed
 *   build → inert. The ascension-4 gate is dropped (always true at ascension 6).
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

import type { Condition, DbObjectChar, Feature, TalentResolver, TalentTable } from "@genshin/types";
import { Varesa as VaresaStatTable } from "../generated/charTables.js";
import { Varesa as VaresaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver — base + Fiery-Passion (stance) slots.
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
      // Fiery-Passion (stance) normal/charged/plunge slots.
      if (name === "varesa_normal_hit_1") return VaresaTalents.s1.p9;
      if (name === "varesa_normal_hit_2") return VaresaTalents.s1.p10;
      if (name === "varesa_normal_hit_3") return VaresaTalents.s1.p11;
      if (name === "varesa_charged_hit") return VaresaTalents.s1.p12;
      if (name === "varesa_plunge") return VaresaTalents.s1.p14;
      if (name === "varesa_plunge_low") return VaresaTalents.s1.p15;
      if (name === "varesa_plunge_high") return VaresaTalents.s1.p16;
    }
    if (talent === "skill") {
      if (name === "varesa_rush_dmg") return VaresaTalents.s2.p1;
      if (name === "varesa_fiery_passion_rush_dmg") return VaresaTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "varesa_flying_kick_dmg") return VaresaTalents.s3.p1;
      if (name === "varesa_fiery_passion_flying_kick_dmg") return VaresaTalents.s3.p2;
      if (name === "varesa_volcanic_collapse_dmg") return VaresaTalents.s3.p5;
    }
    throw new Error(`varesa talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Fiery Passion (Nightsoul) STANCE toggle
// ---------------------------------------------------------------------------
// raw: stanceCond = ConditionBoolean(varesa_fiery_passion); stanceRevCond = ConditionNot([it]).
// Each stance-swappable feature carries its base multiplier gated NOT_STANCE and its Fiery-Passion
// multiplier gated STANCE. No infusion published (every Varesa hit is innately electro).
const STANCE: Condition = { type: "boolean", name: "varesa_fiery_passion" };
const NOT_STANCE: Condition = { type: "not", items: [{ type: "boolean", name: "varesa_fiery_passion" }] };

// A1 additive-plunge ValueTable([A1PlungeDmg=50, A1PlungeDmg2=180]), leveled by `varesa_a1_level`
// (published =2 by the ConditionStatic below when the toggle AND (stance OR C1) hold; else 1). Replicates
// her ValueTable.getValue: level <= 0 → 0; level > length → last; else values[level-1].
const A1_PLUNGE_VALUES = [50, 180] as const;
const a1PlungeTable: TalentTable = {
  getValue: (level: number): number =>
    level > 0 ? A1_PLUNGE_VALUES[Math.min(level, A1_PLUNGE_VALUES.length) - 1]! : 0,
};

// A1 additive plunge term (per-feature copy for Volcanic Collapse, gated additionally on C1) and the
// char-level version (over the varesa_plunge tag). Both drop the always-true ascension-1 gate.
const A1_TAG_TEAM: Condition = { type: "boolean", name: "varesa_tag_team_triple_jump" };

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (electro catalyst, always electro) — stance swap ---
  {
    name: "normal_hit_1",
    category: "attack",
    element: "electro",
    multipliers: [
      { leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1"), condition: NOT_STANCE },
      { leveling: "char_skill_attack", values: talents.get("attack.varesa_normal_hit_1"), condition: STANCE },
    ],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    element: "electro",
    multipliers: [
      { leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2"), condition: NOT_STANCE },
      { leveling: "char_skill_attack", values: talents.get("attack.varesa_normal_hit_2"), condition: STANCE },
    ],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    element: "electro",
    multipliers: [
      { leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3"), condition: NOT_STANCE },
      { leveling: "char_skill_attack", values: talents.get("attack.varesa_normal_hit_3"), condition: STANCE },
    ],
  },
  // --- Charged attack (electro) — stance swap ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "electro",
    multipliers: [
      { leveling: "char_skill_attack", values: talents.get("attack.charged_hit"), condition: NOT_STANCE },
      { leveling: "char_skill_attack", values: talents.get("attack.varesa_charged_hit"), condition: STANCE },
    ],
  },
  // --- Plunge attacks (electro). plunge_low / plunge_high are shockwaves. Stance swap. ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "electro",
    multipliers: [
      { leveling: "char_skill_attack", values: talents.get("attack.plunge"), condition: NOT_STANCE },
      { leveling: "char_skill_attack", values: talents.get("attack.varesa_plunge"), condition: STANCE },
    ],
  },
  {
    name: "plunge_low",
    // raw tags: ['varesa_plunge','varesa_plunge_c4'] + FeatureDamagePlungeShockWave pushes 'plunge_shockwave'.
    // varesa_plunge → the A1 char-multiplier target; varesa_plunge_c4 → the C4 char-multiplier target.
    tags: ["plunge_shockwave", "varesa_plunge", "varesa_plunge_c4"],
    category: "attack",
    damageType: "plunge",
    element: "electro",
    multipliers: [
      { leveling: "char_skill_attack", values: talents.get("attack.plunge_low"), condition: NOT_STANCE },
      { leveling: "char_skill_attack", values: talents.get("attack.varesa_plunge_low"), condition: STANCE },
    ],
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave", "varesa_plunge", "varesa_plunge_c4"],
    category: "attack",
    damageType: "plunge",
    element: "electro",
    multipliers: [
      { leveling: "char_skill_attack", values: talents.get("attack.plunge_high"), condition: NOT_STANCE },
      { leveling: "char_skill_attack", values: talents.get("attack.varesa_plunge_high"), condition: STANCE },
    ],
  },
  // --- Skill: Riding the Night Rainbow (electro rush) — stance swap ---
  {
    name: "varesa_rush_dmg",
    category: "skill",
    element: "electro",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.varesa_rush_dmg"), condition: NOT_STANCE },
      { leveling: "char_skill_elemental", values: talents.get("skill.varesa_fiery_passion_rush_dmg"), condition: STANCE },
    ],
  },
  // --- Burst: Guardian Vent (electro flying kick) — stance swap ---
  {
    name: "varesa_flying_kick_dmg",
    category: "burst",
    element: "electro",
    // raw feature damageBonuses: ['dmg_burst_varesa'] (Varesa.js:289) — base-inert (the key reads 0
    // until C4 "The Courage to Press On" toggles varesa_the_courage_to_press_on_2 → dmg_burst_varesa:100).
    damageBonuses: ["dmg_burst_varesa"],
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.varesa_flying_kick_dmg"), condition: NOT_STANCE },
      { leveling: "char_skill_burst", values: talents.get("burst.varesa_fiery_passion_flying_kick_dmg"), condition: STANCE },
    ],
  },
  // Volcanic Collapse — burst-category PLUNGE shockwave (damageType "plunge"). No stance variant.
  // raw: FeatureDamagePlungeShockWave (Varesa.js:303) → tags:['varesa_plunge_c4'] + 'plunge_shockwave'.
  // Second multiplier = the A1 additive plunge term, gated (tag_team AND C1) — its own copy because
  // Volcanic Collapse is NOT tagged 'varesa_plunge' (so the char-level A1 multiplier misses it).
  {
    name: "varesa_volcanic_collapse_dmg",
    tags: ["plunge_shockwave", "varesa_plunge_c4"],
    category: "burst",
    damageType: "plunge",
    element: "electro",
    // raw feature damageBonuses: ['dmg_burst_varesa'] (Varesa.js:306) — base-inert (see flying kick).
    damageBonuses: ["dmg_burst_varesa"],
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.varesa_volcanic_collapse_dmg") },
      {
        leveling: "varesa_a1_level",
        values: a1PlungeTable,
        source: "ascension1",
        condition: { type: "and", items: [A1_TAG_TEAM, { type: "constellation", constellation: 1 }] },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Char-level (targeted) multipliers — A1 + C4-part1 additive plunge terms
// ---------------------------------------------------------------------------
// raw Varesa.js:375-399. Both drop the always-true ConditionAscensionChar(asc1) / (asc handled by cons).
const multipliers = [
  // A1 "Tag-Team, Triple Jump" — ATK-scaled additive term over the `varesa_plunge` tag
  // (plunge_low/plunge_high). leveling `varesa_a1_level` (published =2 by the static below when
  // stance OR C1; else 1). getValue(2)=180% / getValue(1)=50%. Gated on the tag_team toggle.
  {
    source: "ascension1",
    leveling: "varesa_a1_level",
    values: a1PlungeTable,
    target: { damageTypes: [] as string[], tags: ["varesa_plunge"] },
    condition: A1_TAG_TEAM,
  },
  // C4-part1 "The Courage to Press On" — 500% ATK additive term capped at 20000, over the
  // `varesa_plunge_c4` tag (plunge_low/plunge_high + Volcanic Collapse). Gated C4 + courage_1 boolean.
  // raw capValue: ValueTable([C4BonusMax=20000]); values ValueTable([C4AtkScale=500]).
  {
    source: "constellation4",
    leveling: "",
    values: { getValue: (): number => 500 },
    capValue: 20000,
    target: { damageTypes: [] as string[], tags: ["varesa_plunge_c4"] },
    condition: {
      type: "and" as const,
      items: [
        { type: "constellation" as const, constellation: 4 },
        { type: "boolean" as const, name: "varesa_the_courage_to_press_on_1" },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Undying Passion": ConditionStatic text_percent (display-only) — SKIP.
// C2 "Beyond the Edge of Light": ConditionStatic, no real stats — SKIP.
// C3 "The Hero's Call": +3 burst talent (char_skill_burst_bonus).
// C4 "The Courage to Press On": part-1 ATK-scaled plunge multiplier (above) + part-2 dmg_burst (below).
// C5 "Blazing Justice": +3 attack talent (char_skill_attack_bonus).
// C6 "A Hero of Justice's Triumph": ConditionBoolean toggle (crit_rate/dmg_plunge/burst) — below.
// Sources: raw/genshin_calc_pub/src/js/db/Char/Varesa.js:401-480

const constellationConditions: readonly Condition[] = [
  // C3 — +3 Elemental Burst (Guardian Vent).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5 — +3 Normal Attack (standard attacks).
  { type: "constellation", constellation: 5, settings: { char_skill_attack_bonus: 3 } },
  // SELF C4 "The Courage to Press On" part 2 (raw cons[3] conditions[1], Varesa.js:443-451) — boolean
  // varesa_the_courage_to_press_on_2 → +100% burst DMG (dmg_burst_varesa = C4BurstBonus), gated on
  // constellation 4. Lifts the two burst features (flying kick + volcanic collapse) via the restored
  // damageBonuses key.
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

// A1 `varesa_a1_level` publisher — her ConditionStatic (Varesa.js:343-361) sets varesa_a1_level:2 when
// the tag_team toggle AND (stance OR C1) hold (the ascension-1 gate dropped). Read by the A1 additive
// plunge multipliers above (leveling `varesa_a1_level` → getValue(2)=180; unset → getValue(1)=50).
const a1LevelPublisher: Condition = {
  type: "static",
  settings: { varesa_a1_level: 2 },
  condition: {
    type: "and",
    items: [
      A1_TAG_TEAM,
      { type: "or", items: [STANCE, { type: "constellation", constellation: 1 }] },
    ],
  },
};

// A4 "The Hero, Twice Returned" (raw Varesa.js:362-373) — ConditionStacks, +35% ATK per stack (max 2).
// The ascension-4 gate is dropped (always true at ascension 6). 0 stacks → inert.
const a4Stacks: Condition = {
  type: "stacks",
  name: "varesa_the_hero_twice_returned",
  maxStacks: 2,
  stats: { atk_percent: 35 },
};

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
  multipliers,
  conditions: [a1LevelPublisher, a4Stacks, ...constellationConditions],
};
