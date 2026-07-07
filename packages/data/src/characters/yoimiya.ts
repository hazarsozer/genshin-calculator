/**
 * Yoimiya — pyro bow ATK scaler.
 *
 * Niwabi Fire-Dance ("yoimiya_teika_enshou") is a TOGGLE: while active it pyro-infuses
 * the normal/aimed/plunge attacks (its ConditionBoolean publishes settings
 * { attack_infusion: 'pyro' }, raw Yoimiya.js:415-423) AND multiplies the s2.p4
 * "yoimiya_bonus_dmg" Niwabi DMG factor into every normal term (her
 * FeatureMultiplierYoimiya.getTreeBonusMultiplier, gated on the same toggle — raw
 * Multiplier/Yoimiya.js:16-33). The boost is ported via the gated scalingMultiplierFromTable
 * (niwabiBoost); the infusion via the teika_enshou condition. In the fixed solo build the
 * harness passes `settings: {}`, so the toggle is OFF: the table factor reverts to 1 and the
 * normals/aimed/plunge stay PHYSICAL → base-inert (the 58k goldens are unchanged).
 *
 * Normal combo: n1 (2-hit multihit → child _1_1), n2, n3 (single each), n4 (2-hit
 * multihit → child _4_1), n5 (single). Aimed (physical charged), charged_aimed +
 * kindling_arrow (pyro charged). Plunge / low / high (physical). Pyro burst: burst_dmg
 * (Ryuukin Saxifrage hit) + yoimiya_aurous_blaze_dmg (Aurous Blaze explosion).
 *
 * C6 "Naganohara Meteor Swarm" duplicate normals (yoimiya_normal_hit_1..5 + children,
 * gated c6cond = Niwabi AND constellation 6): the normal combo fires a second set at 0.6×
 * the yoimiya_bonus_dmg-boosted scaling (0.6 baked into niwabiBoostC6), pyro-infused via the
 * same toggle. raw Yoimiya.js:220-344. Her Feature2.rotationHitCount = 0.5 on these is a
 * ROTATION weight, ported here as `rotationHitMulti: 0.5` — it does not affect the
 * per-feature damage triples locked here.
 *
 * SKIPPED (not in solo-C0 fixed build):
 *   - skill has no damage feature (Niwabi is the infusion toggle; only the bonus table).
 *   - A1 "Tricks of the Trouble-Maker" = ConditionStacks (stacking dmg_pyro, OFF at 0 stacks).
 *   - A4 "Summer Night's Dawn" = ConditionStatic text-only / party-gated → no solo stat.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Yoimiya.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/Yoimiya.js (toggle-gated bonus)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Yoimiya)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Yoimiya)
 */

import type {
  Condition,
  DbObjectChar,
  Feature,
  FeatureMultiplierEntry,
  TalentResolver,
  TalentTable,
} from "@genshin/types";
import { Yoimiya as YoimiyaStatTable } from "../generated/charTables.js";
import { Yoimiya as YoimiyaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return YoimiyaTalents.s1.p1;
      if (name === "normal_hit_2") return YoimiyaTalents.s1.p2;
      if (name === "normal_hit_3") return YoimiyaTalents.s1.p3;
      if (name === "normal_hit_4") return YoimiyaTalents.s1.p4;
      if (name === "normal_hit_5") return YoimiyaTalents.s1.p5;
      if (name === "aimed") return YoimiyaTalents.s1.p6;
      if (name === "charged_aimed") return YoimiyaTalents.s1.p7;
      if (name === "yoimiya_kindling_arrow_dmg") return YoimiyaTalents.s1.p8;
      if (name === "plunge") return YoimiyaTalents.s1.p9;
      if (name === "plunge_low") return YoimiyaTalents.s1.p10;
      if (name === "plunge_high") return YoimiyaTalents.s1.p11;
    }
    if (talent === "skill") {
      // Niwabi Fire-Dance normal-attack DMG bonus (s2.p4) — the WINDFAVORED-style factor.
      if (name === "yoimiya_bonus_dmg") return YoimiyaTalents.s2.p4;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return YoimiyaTalents.s3.p1;
      if (name === "yoimiya_aurous_blaze_dmg") return YoimiyaTalents.s3.p2;
    }
    throw new Error(`yoimiya talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Niwabi Fire-Dance (yoimiya_teika_enshou) normal-attack boost
// ---------------------------------------------------------------------------
// While the toggle is ON, her FeatureMultiplierYoimiya multiplies a yoimiya_bonus_dmg
// (s2.p4) factor into every normal-attack term — `bonus = scalingValues.getValue(
// getLevel('char_skill_elemental'))/100` (raw Multiplier/Yoimiya.js:16-33). Ported via the
// gated scalingMultiplierFromTable: the yoimiya_bonus_dmg fractions (÷100) keyed by
// char_skill_elemental, gated by yoimiya_teika_enshou; the base normal% stays the `values`
// path. char_skill_elemental HAS a C3 `_bonus` (char_skill_elemental_bonus:3) → the
// bonus-aware level read is exercised at C3+. OFF in every base build → the table factor
// reverts to 1 → base-inert.
const frac = (t: TalentTable): readonly number[] =>
  Array.from({ length: 15 }, (_unused, i) => t.getValue(i + 1) / 100);
const TEIKA_ENSHOU: Condition = { type: "boolean", name: "yoimiya_teika_enshou" };
const niwabiBoost: NonNullable<FeatureMultiplierEntry["scalingMultiplierFromTable"]> = {
  table: frac(talents.get("skill.yoimiya_bonus_dmg")),
  levelSetting: "char_skill_elemental",
  condition: TEIKA_ENSHOU,
};

// C6 "Naganohara Meteor Swarm" duplicate normals (raw Yoimiya.js:220-344): while Niwabi is
// active, each normal hit fires a SECOND set at 0.6× the base scaling. Her
// FeatureMultiplierYoimiya stacks getTreeBonusMultiplier = CMulti([CConst(0.6, source
// constellation6), CConst(yoimiya_bonus_dmg/100)]) — the scalingMultiplier 0.6 (ungated)
// times the Niwabi factor. The feature only emits under c6cond (Niwabi AND C6), so that
// product is always 0.6 × yoimiya_bonus_dmg; the port bakes the 0.6 into the table (the
// primitive forbids a constant scalingMultiplier alongside the table form, and the
// observable result is identical because the feature never emits with Niwabi OFF).
const niwabiBoostC6: NonNullable<FeatureMultiplierEntry["scalingMultiplierFromTable"]> = {
  table: frac(talents.get("skill.yoimiya_bonus_dmg")).map((x) => x * 0.6),
  levelSetting: "char_skill_elemental",
  condition: TEIKA_ENSHOU,
};
// The C6 duplicate-normal gate: Niwabi (yoimiya_teika_enshou) AND constellation 6
// (raw c6cond, ConditionAnd([ConditionBoolean, ConditionConstellation(6)])).
const c6cond: Condition = {
  type: "and",
  items: [TEIKA_ENSHOU, { type: "constellation", constellation: 6 }],
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical when Niwabi toggle OFF; pyro-infused + ×yoimiya_bonus_dmg
  //     while yoimiya_teika_enshou is ON — the gated niwabiBoost, inert while OFF) ---
  // normal_hit_1: 2-hit multihit parent (p1 × 2). raw Yoimiya.js:135-152
  {
    name: "normal_hit_1",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1"), scalingMultiplierFromTable: niwabiBoost }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1"), scalingMultiplierFromTable: niwabiBoost }] },
    ],
  },
  // Child: one hit of normal_hit_1 (half the parent). raw Yoimiya.js:153-166 (isChild dropped so it emits)
  {
    name: "normal_hit_1_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1"), scalingMultiplierFromTable: niwabiBoost }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2"), scalingMultiplierFromTable: niwabiBoost }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3"), scalingMultiplierFromTable: niwabiBoost }],
  },
  // normal_hit_4: 2-hit multihit parent (p4 × 2). raw Yoimiya.js:178-195
  {
    name: "normal_hit_4",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4"), scalingMultiplierFromTable: niwabiBoost }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4"), scalingMultiplierFromTable: niwabiBoost }] },
    ],
  },
  // Child: one hit of normal_hit_4 (half the parent). raw Yoimiya.js:196-209
  {
    name: "normal_hit_4_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4"), scalingMultiplierFromTable: niwabiBoost }],
  },
  {
    name: "normal_hit_5",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5"), scalingMultiplierFromTable: niwabiBoost }],
  },
  // --- C6 duplicate normals (gated c6cond = Niwabi AND C6): the same normal combo again
  //     at 0.6× scaling (0.6 baked into the yoimiya_bonus_dmg table). Pyro-infused via the
  //     same teika_enshou attack_infusion. raw Yoimiya.js:220-344 ---
  {
    name: "yoimiya_normal_hit_1",
    category: "attack",
    condition: c6cond,
    // raw Yoimiya.js:222 rotationHitCount: 0.5 — the C6 dup normals count as half a hit in a rotation.
    rotationHitMulti: 0.5,
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1"), scalingMultiplierFromTable: niwabiBoostC6 }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1"), scalingMultiplierFromTable: niwabiBoostC6 }] },
    ],
  },
  {
    name: "yoimiya_normal_hit_1_1",
    category: "attack",
    condition: c6cond,
    // raw Yoimiya.js:245 rotationHitCount: 0.5 — the C6 dup normals count as half a hit in a rotation.
    rotationHitMulti: 0.5,
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1"), scalingMultiplierFromTable: niwabiBoostC6 }],
  },
  {
    name: "yoimiya_normal_hit_2",
    category: "attack",
    condition: c6cond,
    // raw Yoimiya.js:262 rotationHitCount: 0.5 — the C6 dup normals count as half a hit in a rotation.
    rotationHitMulti: 0.5,
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2"), scalingMultiplierFromTable: niwabiBoostC6 }],
  },
  {
    name: "yoimiya_normal_hit_3",
    category: "attack",
    condition: c6cond,
    // raw Yoimiya.js:277 rotationHitCount: 0.5 — the C6 dup normals count as half a hit in a rotation.
    rotationHitMulti: 0.5,
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3"), scalingMultiplierFromTable: niwabiBoostC6 }],
  },
  {
    name: "yoimiya_normal_hit_4",
    category: "attack",
    condition: c6cond,
    // raw Yoimiya.js:292 rotationHitCount: 0.5 — the C6 dup normals count as half a hit in a rotation.
    rotationHitMulti: 0.5,
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4"), scalingMultiplierFromTable: niwabiBoostC6 }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4"), scalingMultiplierFromTable: niwabiBoostC6 }] },
    ],
  },
  {
    name: "yoimiya_normal_hit_4_1",
    category: "attack",
    condition: c6cond,
    // raw Yoimiya.js:315 rotationHitCount: 0.5 — the C6 dup normals count as half a hit in a rotation.
    rotationHitMulti: 0.5,
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4"), scalingMultiplierFromTable: niwabiBoostC6 }],
  },
  {
    name: "yoimiya_normal_hit_5",
    category: "attack",
    condition: c6cond,
    // raw Yoimiya.js:332 rotationHitCount: 0.5 — the C6 dup normals count as half a hit in a rotation.
    rotationHitMulti: 0.5,
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5"), scalingMultiplierFromTable: niwabiBoostC6 }],
  },
  // --- Charged (aimed) attacks ---
  // aimed: untargeted aim shot — physical (no element override). raw Yoimiya.js:355-362
  {
    name: "aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // charged_aimed: fully-charged aim shot — pyro. raw Yoimiya.js:363-371
  {
    name: "charged_aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_aimed") }],
  },
  // yoimiya_kindling_arrow_dmg: Kindling Arrow follow-up — pyro charged. raw Yoimiya.js:372-380
  {
    name: "yoimiya_kindling_arrow_dmg",
    category: "attack",
    damageType: "charged",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.yoimiya_kindling_arrow_dmg") }],
  },
  // --- Plunge attacks (physical) ---
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
  // --- Burst: Ryuukin Saxifrage (pyro) ---
  // burst_dmg: the launch hit. raw Yoimiya.js:404-412
  {
    name: "burst_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // yoimiya_aurous_blaze_dmg: Aurous Blaze explosion DoT. raw Yoimiya.js:413-421
  {
    name: "yoimiya_aurous_blaze_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.yoimiya_aurous_blaze_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1: ConditionBoolean toggle (atk_percent:20) → SKIP.
// C2: ConditionBoolean toggle (dmg_pyro:25) → SKIP.
// C3 "Summer Festival" — +3 Elemental Skill talent levels.
//   raw/genshin_calc_pub/src/js/db/Char/Yoimiya.js:480-487 (constellation[2]).
// C4: ConditionStatic display-only → SKIP.
// C5 "Summer War" — +3 Burst talent levels.
//   raw/genshin_calc_pub/src/js/db/Char/Yoimiya.js:496-503 (constellation[4]).
// C6 "Naganohara Meteor Swarm": ConditionStatic with text_percent_* (display-only) → SKIP;
//   its damage effect is the yoimiya_normal_hit_* duplicate features above (gated c6cond).

const constellationConditions: readonly Condition[] = [
  // C3 — char_skill_elemental_bonus +3 (skill talent level up).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 — char_skill_burst_bonus +3 (burst talent level up).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// Self toggles.
// Niwabi Fire-Dance (yoimiya_teika_enshou): pyro-infuses the normals/aimed/plunge (her
// ConditionBoolean publishes settings { attack_infusion: 'pyro' }, raw Yoimiya.js:415-423).
// The yoimiya_bonus_dmg normal-attack boost it also grants is applied per-multiplier via
// niwabiBoost above (her FeatureMultiplierYoimiya, gated on the same toggle).
const selfToggles: readonly Condition[] = [
  { type: "boolean", name: "yoimiya_teika_enshou", settings: { attack_infusion: "pyro" } },
];

export const yoimiya: DbObjectChar = {
  name: "yoimiya",
  gameId: 10000049,
  rarity: 5,
  element: "pyro",
  weapon: "bow",
  origin: "inazuma",
  statTable: YoimiyaStatTable,
  talents,
  features,
  multipliers: [],
  conditions: [...selfToggles, ...constellationConditions],
  // partyData — teammate kit buffs (P3.5.2 Bucket A)
  // A4 "Summer Nights Dawn": 2-part buff — flat +10% ATK (master toggle) + 1% ATK per stack
  //   when toggle is on. text_percent/text_percent_2 are display-only, skipped.
  //   Source: raw/genshin_calc_pub/src/js/db/Char/Yoimiya.js partyData
  partyData: {
    conditions: [
      // A4 master toggle: +10% ATK.
      {
        type: "boolean",
        name: "party.yoimiya_summer_scorch",
        stats: { atk_percent: 10 },
      },
      // A4 stack bonus: +1% ATK per stack (max 10), gated on master toggle.
      {
        type: "stacks",
        name: "party.yoimiya_summer_scorch_stack",
        maxStacks: 10,
        stats: { atk_percent: 1 },
        condition: { type: "boolean", name: "party.yoimiya_summer_scorch" },
      },
    ],
  },
};
