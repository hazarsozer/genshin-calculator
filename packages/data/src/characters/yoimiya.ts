/**
 * Yoimiya — pyro bow ATK scaler.
 *
 * Niwabi Fire-Dance ("yoimiya_teika_enshou") is a TOGGLE: while active it pyro-infuses
 * the normal attacks AND adds the s2.p4 "yoimiya_bonus_dmg" Niwabi DMG bonus (her
 * FeatureMultiplierYoimiya.getTreeBonusMultiplier only fires when
 * `settings.yoimiya_teika_enshou` is set — raw Multiplier/Yoimiya.js:23). In the fixed
 * solo build the harness passes `settings: {}`, so the toggle is OFF: the special
 * multiplier degrades to a plain FeatureMultiplier (no bonus), and the normals/charged/
 * plunge stay PHYSICAL (the fixture lists them with damageType "normal"/"charged"/"plunge"
 * and no pyro element). Verified numerically against the fixture (e.g. aimed picks up
 * dmg_charged+dmg_phys; charged_aimed picks up dmg_charged only, element pyro). So the
 * Yoimiya-specific multiplier needs no special engine support here — plain multipliers
 * reproduce the oracle exactly.
 *
 * Normal combo: n1 (2-hit multihit → child _1_1), n2, n3 (single each), n4 (2-hit
 * multihit → child _4_1), n5 (single). Aimed (physical charged), charged_aimed +
 * kindling_arrow (pyro charged). Plunge / low / high (physical). Pyro burst: burst_dmg
 * (Ryuukin Saxifrage hit) + yoimiya_aurous_blaze_dmg (Aurous Blaze explosion).
 *
 * SKIPPED (not in solo-C0 fixed build):
 *   - skill has no damage feature (Niwabi is the infusion toggle; only the bonus table).
 *   - yoimiya_normal_hit_* features are ALL C6-gated (ConditionAnd[boolean, constellation 6]) → omitted (C0 build).
 *   - A1 "Tricks of the Trouble-Maker" = ConditionStacks (stacking dmg_pyro, OFF at 0 stacks).
 *   - A4 "Summer Night's Dawn" = ConditionStatic text-only / party-gated → no solo stat.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Yoimiya.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/Yoimiya.js (toggle-gated bonus)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Yoimiya)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Yoimiya)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
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
    if (talent === "burst") {
      if (name === "burst_dmg") return YoimiyaTalents.s3.p1;
      if (name === "yoimiya_aurous_blaze_dmg") return YoimiyaTalents.s3.p2;
    }
    throw new Error(`yoimiya talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical when Niwabi toggle OFF) ---
  // normal_hit_1: 2-hit multihit parent (p1 × 2). raw Yoimiya.js:135-152
  {
    name: "normal_hit_1",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }] },
    ],
  },
  // Child: one hit of normal_hit_1 (half the parent). raw Yoimiya.js:153-166 (isChild dropped so it emits)
  {
    name: "normal_hit_1_1",
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
  // normal_hit_4: 2-hit multihit parent (p4 × 2). raw Yoimiya.js:178-195
  {
    name: "normal_hit_4",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
    ],
  },
  // Child: one hit of normal_hit_4 (half the parent). raw Yoimiya.js:196-209
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
  // --- Charged (aimed) attacks ---
  // aimed: untargeted aim shot — physical (no element override). raw Yoimiya.js:355-362
  {
    name: "aimed",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // charged_aimed: fully-charged aim shot — pyro. raw Yoimiya.js:363-371
  {
    name: "charged_aimed",
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
// C6: ConditionStatic with text_percent_* (display-only) → SKIP.
//   yoimiya_normal_hit_* features are gated by ConditionAnd[toggle, constellation 6] → cons-feature wave.

const constellationConditions: readonly Condition[] = [
  // C3 — char_skill_elemental_bonus +3 (skill talent level up).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 — char_skill_burst_bonus +3 (burst talent level up).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
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
  conditions: constellationConditions,
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
