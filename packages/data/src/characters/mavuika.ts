/**
 * Mavuika — pyro claymore ATK scaler (Natlan, Flamestrider "ride the bike" kit).
 *
 * FLAMESTRIDER STANCE (`mavuika_stance`): when ON, her on-foot physical normal/charged/
 * plunge combo is NOT-gated OFF and a parallel PYRO Flamestrider moveset (char_skill_elemental,
 * category 'skill', tags 'flamestrider') is gated ON. Both are modelled per-feature (the on-foot
 * set carries `condition: NOT_STANCE`, the Flamestrider set `condition: STANCE`); OFF in the fixed
 * solo build → only the on-foot set fires (byte-identical goldens). raw Mavuika.js:182-441.
 *
 * On-foot multihit shape (unchanged): normal_hit_2/3 are FeatureDamageMultihit (2/3 hits) with the
 * standalone children normal_hit_2_1/3_1 (raw isChild dropped). Flamestrider normals are plain
 * single-hit FeatureDamageNormal.
 *
 * FLAMESTRIDER feature keys are auto-named by their talent-table name (her engine keys an un-named
 * FeatureDamage by its multiplier's StatTable name): skill.mavuika_flamestrider_normal_hit_1..5,
 * _charged_spin/_charged_final, _plunge_dmg, _sprint_dmg. The sprint is a BASE FeatureDamage →
 * damageType 'none' (no dmg_<type> bonus; her `params.damageType || 'none'`).
 *
 * GLOBAL BURST/NORMAL/CHARGED MULTIPLIERS (`mavuika_points`, 0-200): char-level ATK-scaled additive
 * terms over the Flamestrider features (+ the burst, which is tagged 'flamestrider'), one per damage
 * type, scaled by the Fighting-Spirit point count (her `stacksLeveling` → `stacksFactor`). Gated on
 * `mavuika_crucible_of_death_and_life` AND `mavuika_points >= 100`. Each pairs with a C2 flat term
 * (60/90/120% ATK) — the C2 normal one also requires points>=100; the C2 charged/burst do not
 * (faithful to raw). raw Mavuika.js:474-559.
 *
 * A1 "Gift of Flaming Flowers" (`mavuika_gift_of_flaming_flowers`): +30% ATK toggle (ascension gate
 * dropped). A4 "Kiongozi" (`mavuika_kiongozi`, 0-40): a ConditionNumber whose clamped value lands on
 * `dmg_all` (up to +40%). Both OFF (unset) in the fixed build → inert.
 *
 * Constellations: C1 +40% ATK toggle · C2 +200 base ATK (auto) + the C2 flat damage-type terms
 * (above) + the enemy_def_reduce −20 (shared with C6, gated by either C2/C6 toggle) · C3/C5 talent
 * bumps · C4 +10% all-DMG (gated C4 + Kiongozi active) · C6 two extra skill hits (200%/500%) +
 * def-reduce toggle. raw Mavuika.js:561-722.
 *
 * Reactions emitted generically from element:'pyro'. Stats triple by buildStats.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Mavuika.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Mavuika)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Mavuika)
 */

import type { Condition, DbObjectChar, Feature, FeatureMultiplierEntry, FeatureMultiplierTarget, TalentResolver } from "@genshin/types";
import { Mavuika as MavuikaStatTable } from "../generated/charTables.js";
import { Mavuika as MavuikaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return MavuikaTalents.s1.p1;
      if (name === "normal_hit_2") return MavuikaTalents.s1.p2;
      if (name === "normal_hit_3") return MavuikaTalents.s1.p3;
      if (name === "normal_hit_4") return MavuikaTalents.s1.p4;
      if (name === "charged_hit") return MavuikaTalents.s1.p5;
      if (name === "plunge") return MavuikaTalents.s1.p7;
      if (name === "plunge_low") return MavuikaTalents.s1.p8;
      if (name === "plunge_high") return MavuikaTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return MavuikaTalents.s2.p1;
      if (name === "mavuika_rings_of_searing_radiance_dmg") return MavuikaTalents.s2.p2;
      // Flamestrider stance moveset (char_skill_elemental).
      if (name === "mavuika_flamestrider_normal_hit_1") return MavuikaTalents.s2.p4;
      if (name === "mavuika_flamestrider_normal_hit_2") return MavuikaTalents.s2.p5;
      if (name === "mavuika_flamestrider_normal_hit_3") return MavuikaTalents.s2.p6;
      if (name === "mavuika_flamestrider_normal_hit_4") return MavuikaTalents.s2.p7;
      if (name === "mavuika_flamestrider_normal_hit_5") return MavuikaTalents.s2.p8;
      if (name === "mavuika_flamestrider_sprint_dmg") return MavuikaTalents.s2.p9;
      if (name === "mavuika_flamestrider_charged_spin") return MavuikaTalents.s2.p10;
      if (name === "mavuika_flamestrider_charged_final") return MavuikaTalents.s2.p11;
      if (name === "mavuika_flamestrider_plunge_dmg") return MavuikaTalents.s2.p12;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return MavuikaTalents.s3.p1;
      // Per-point damage-type bonus tables (char-level multipliers).
      if (name === "mavuika_burst_bonus") return MavuikaTalents.s3.p3;
      if (name === "mavuika_normal_bonus") return MavuikaTalents.s3.p4;
      if (name === "mavuika_charged_bonus") return MavuikaTalents.s3.p5;
    }
    throw new Error(`mavuika talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Flamestrider stance + point gates
// ---------------------------------------------------------------------------
const STANCE: Condition = { type: "boolean", name: "mavuika_stance" };
const NOT_STANCE: Condition = { type: "not", items: [{ type: "boolean", name: "mavuika_stance" }] };
const CRUCIBLE: Condition = { type: "boolean", name: "mavuika_crucible_of_death_and_life" };
const POINTS_100: Condition = { type: "boolean-value", setting: "mavuika_points", cond: "ge", value: 100 };

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- On-foot normal attacks (physical claymore) — NOT_STANCE-gated (OFF while riding) ---
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
    condition: NOT_STANCE,
  },
  // raw: FeatureDamageMultihit normal_hit_2, items:[{ hits: 2, multipliers:[p2] }] → 2 items
  {
    name: "normal_hit_2",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }] },
    ],
    condition: NOT_STANCE,
  },
  // raw: FeatureDamageNormal normal_hit_2_1 (isChild:true, hits:2 → drop isChild to emit; one hit)
  {
    name: "normal_hit_2_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
    condition: NOT_STANCE,
  },
  // raw: FeatureDamageMultihit normal_hit_3, items:[{ hits: 3, multipliers:[p3] }] → 3 items
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
    ],
    condition: NOT_STANCE,
  },
  // raw: FeatureDamageNormal normal_hit_3_1 (isChild:true, hits:3 → drop isChild to emit; one hit)
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
    condition: NOT_STANCE,
  },
  // raw: FeatureDamageNormal normal_hit_4
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
    condition: NOT_STANCE,
  },
  // --- Charged attack (physical, damageType charged) — NOT_STANCE ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
    condition: NOT_STANCE,
  },
  // --- Plunge attacks (physical) — NOT_STANCE ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
    condition: NOT_STANCE,
  },
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
    condition: NOT_STANCE,
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
    condition: NOT_STANCE,
  },
  // --- Skill: The Named Moment (pyro) — unconditional ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  {
    name: "mavuika_rings_of_searing_radiance_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.mavuika_rings_of_searing_radiance_dmg") },
    ],
  },
  // ========================================================================
  // FLAMESTRIDER moveset (STANCE-gated): pyro, category 'skill', char_skill_elemental.
  // Normals/charged carry the 'flamestrider' tag (the char-level per-point multipliers target them).
  // raw Mavuika.js:336-441.
  // ========================================================================
  {
    name: "mavuika_flamestrider_normal_hit_1",
    category: "skill",
    damageType: "normal",
    element: "pyro",
    tags: ["flamestrider"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.mavuika_flamestrider_normal_hit_1") }],
    condition: STANCE,
  },
  {
    name: "mavuika_flamestrider_normal_hit_2",
    category: "skill",
    damageType: "normal",
    element: "pyro",
    tags: ["flamestrider"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.mavuika_flamestrider_normal_hit_2") }],
    condition: STANCE,
  },
  {
    name: "mavuika_flamestrider_normal_hit_3",
    category: "skill",
    damageType: "normal",
    element: "pyro",
    tags: ["flamestrider"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.mavuika_flamestrider_normal_hit_3") }],
    condition: STANCE,
  },
  {
    name: "mavuika_flamestrider_normal_hit_4",
    category: "skill",
    damageType: "normal",
    element: "pyro",
    tags: ["flamestrider"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.mavuika_flamestrider_normal_hit_4") }],
    condition: STANCE,
  },
  {
    name: "mavuika_flamestrider_normal_hit_5",
    category: "skill",
    damageType: "normal",
    element: "pyro",
    tags: ["flamestrider"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.mavuika_flamestrider_normal_hit_5") }],
    condition: STANCE,
  },
  // Charged spin/final (FeatureDamageCharged → damageType 'charged'), tagged flamestrider.
  {
    name: "mavuika_flamestrider_charged_spin",
    category: "skill",
    damageType: "charged",
    element: "pyro",
    tags: ["flamestrider"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.mavuika_flamestrider_charged_spin") }],
    condition: STANCE,
  },
  {
    name: "mavuika_flamestrider_charged_final",
    category: "skill",
    damageType: "charged",
    element: "pyro",
    tags: ["flamestrider"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.mavuika_flamestrider_charged_final") }],
    condition: STANCE,
  },
  // Sprint (BASE FeatureDamage → damageType 'none'), NO flamestrider tag.
  {
    name: "mavuika_flamestrider_sprint_dmg",
    category: "skill",
    damageType: "none",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.mavuika_flamestrider_sprint_dmg") }],
    condition: STANCE,
  },
  // Flamestrider plunge (FeatureDamagePlungeShockWave → damageType 'plunge'), NO flamestrider tag.
  {
    name: "mavuika_flamestrider_plunge_dmg",
    tags: ["plunge_shockwave"],
    category: "skill",
    damageType: "plunge",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.mavuika_flamestrider_plunge_dmg") }],
    condition: STANCE,
  },
  // --- Burst: Hour of Burning Skies (pyro) — tagged 'flamestrider' (the burst-bonus multiplier targets it) ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "pyro",
    tags: ["flamestrider"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // --- C6 "Humanity's Name, Unfettered": two cons-added FeatureDamageSkill hits (pyro), gated C6 ---
  {
    name: "mavuika_c6_flamestrider_dmg",
    category: "skill",
    element: "pyro",
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      { leveling: "char_skill_elemental", values: { getValue: (_level: number) => 200 }, source: "constellation6" },
    ],
  },
  {
    name: "mavuika_c6_ring_dmg",
    category: "skill",
    element: "pyro",
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      { leveling: "char_skill_elemental", values: { getValue: (_level: number) => 500 }, source: "constellation6" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Char-level (targeted) per-point damage-type multipliers — over Flamestrider normals/charged + burst.
// Each: talent% × ATK × mavuika_points (stacksFactor), gated crucible + points>=100; the C2 flat term
// (60/90/120% ATK) pairs each. raw Mavuika.js:474-559.
// ---------------------------------------------------------------------------
const FS_NORMAL: FeatureMultiplierTarget = { damageTypes: ["normal"], tags: ["flamestrider"] };
const FS_CHARGED: FeatureMultiplierTarget = { damageTypes: ["charged"], tags: ["flamestrider"] };
const FS_BURST: FeatureMultiplierTarget = { damageTypes: ["burst"], tags: ["flamestrider"] };
const POINTS_STACKS = { setting: "mavuika_points", maxStacks: 200 } as const;

const multipliers: readonly FeatureMultiplierEntry[] = [
  // NORMAL — per-point (crucible + points>=100) + C2 flat 60% (crucible + points>=100 + C2).
  {
    scaling: "atk",
    leveling: "char_skill_burst",
    values: talents.get("burst.mavuika_normal_bonus"),
    stacksFactor: POINTS_STACKS,
    source: "talent_burst",
    target: FS_NORMAL,
    condition: { type: "and", items: [CRUCIBLE, POINTS_100] },
  },
  {
    scaling: "atk",
    leveling: "",
    values: { getValue: (): number => 60 },
    source: "talent_burst",
    target: FS_NORMAL,
    condition: { type: "and", items: [CRUCIBLE, POINTS_100, { type: "constellation", constellation: 2 }] },
  },
  // CHARGED — per-point (crucible + points>=100) + C2 flat 90% (crucible + C2, NO points gate — raw).
  {
    scaling: "atk",
    leveling: "char_skill_burst",
    values: talents.get("burst.mavuika_charged_bonus"),
    stacksFactor: POINTS_STACKS,
    source: "talent_burst",
    target: FS_CHARGED,
    condition: { type: "and", items: [CRUCIBLE, POINTS_100] },
  },
  {
    scaling: "atk",
    leveling: "",
    values: { getValue: (): number => 90 },
    source: "talent_burst",
    target: FS_CHARGED,
    condition: { type: "and", items: [CRUCIBLE, { type: "constellation", constellation: 2 }] },
  },
  // BURST — per-point (crucible + points>=100) + C2 flat 120% (crucible + C2, NO points gate — raw).
  {
    scaling: "atk",
    leveling: "char_skill_burst",
    values: talents.get("burst.mavuika_burst_bonus"),
    stacksFactor: POINTS_STACKS,
    source: "talent_burst",
    target: FS_BURST,
    condition: { type: "and", items: [CRUCIBLE, POINTS_100] },
  },
  {
    scaling: "atk",
    leveling: "",
    values: { getValue: (): number => 120 },
    source: "talent_burst",
    target: FS_BURST,
    condition: { type: "and", items: [CRUCIBLE, { type: "constellation", constellation: 2 }] },
  },
];

// ---------------------------------------------------------------------------
// Character + constellation conditions
// ---------------------------------------------------------------------------
const conditions: readonly Condition[] = [
  // C2 "The Ashen Price" / C6 "Humanity's Name, Unfettered" enemy DEF −20%, active if EITHER toggle
  // is on (her top-level Condition, ungated — the OR checks the two cons toggles). raw Mavuika.js:562-572.
  {
    type: "static",
    stats: { enemy_def_reduce: 20 },
    condition: {
      type: "or",
      items: [
        { type: "boolean", name: "mavuika_the_ashen_price" },
        { type: "boolean", name: "mavuika_humanitys_name_unfettered" },
      ],
    },
  },
  // A1 "Gift of Flaming Flowers" — +30% ATK toggle (ascension-1 gate dropped). raw Mavuika.js:592-604.
  { type: "boolean", name: "mavuika_gift_of_flaming_flowers", stats: { atk_percent: 30 } },
  // A4 "Kiongozi" — a ConditionNumber whose clamped value (0-40) lands on dmg_all (her stat:'dmg_all',
  // max:BurstMaxBonus=40). ascension-4 gate dropped. raw Mavuika.js:605-620.
  { type: "number", name: "mavuika_kiongozi", stat: "dmg_all", max: 40 },
  // C1 "The Night Lord's Explication" — +40% ATK toggle, gated C1. raw Mavuika.js:625-633.
  { type: "boolean", name: "mavuika_the_night_lords_explication", stats: { atk_percent: 40 }, condition: { type: "constellation", constellation: 1 } },
  // C2 "The Ashen Price" — +200 base ATK (auto-active ConditionStatic in the C2 slot). raw Mavuika.js:638-644.
  { type: "constellation", constellation: 2, stats: { atk_base: 200 } },
  // C3: +3 levels to Hour of Burning Skies (burst).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C4 "The Leader's Resolve" — +10% all-DMG, gated C4 AND Kiongozi active. raw Mavuika.js:674-687.
  {
    type: "static",
    stats: { dmg_all: 10 },
    condition: { type: "and", items: [{ type: "constellation", constellation: 4 }, { type: "boolean", name: "mavuika_kiongozi" }] },
  },
  // C5: +3 levels to The Named Moment (skill).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const mavuika: DbObjectChar = {
  name: "mavuika",
  gameId: 10000106,
  rarity: 5,
  element: "pyro",
  weapon: "claymore",
  origin: "natlan",
  statTable: MavuikaStatTable,
  talents,
  features,
  multipliers,
  conditions,
  // partyData (P3.5.2 A-straggler) — Mavuika's teammate buffs.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Mavuika.js:723-788.
  partyData: {
    conditions: [
      // C2 "The Ashen Price" / C6 "Humanity's Name, Unfettered" — enemy DEF -20%,
      // active if EITHER constellation toggle is on. raw: Condition{enemy_def_reduce:C2DefReduce,
      // subConditions:[Or(party.mavuika_the_ashen_price, party.mavuika_humanitys_name_unfettered)]}.
      {
        type: "static",
        stats: { enemy_def_reduce: 20 },
        condition: {
          type: "or",
          items: [
            { type: "boolean", name: "party.mavuika_the_ashen_price" },
            { type: "boolean", name: "party.mavuika_humanitys_name_unfettered" },
          ],
        },
      },
      // A4 "Kiongozi" — shared all-DMG bonus, a slider keyed `party_mavuika_kiongozi`
      // whose clamped value lands on `dmg_all` (her ConditionNumber `stat:'dmg_all'`,
      // capped at BurstMaxBonus=40%). The text_* display stats are filtered (not modelled).
      // raw: ConditionNumber{name:'party_mavuika_kiongozi', stat:'dmg_all', max:BurstMaxBonus}.
      { type: "number", name: "party_mavuika_kiongozi", stat: "dmg_all", max: 40 },
      // C4 "The Leader's Resolve" — a TOGGLE adding +10% all-DMG, only while Kiongozi is active.
      // raw: ConditionBoolean{name:'mavuika_the_leaders_resolve', stats:{dmg_all:C4DmgBonus},
      // subConditions:[Boolean(party_mavuika_kiongozi)]} — requires its OWN toggle ON (not just
      // kiongozi>0). OFF in the rep → not applied (faithful: the oracle omits it at C0).
      {
        type: "boolean",
        name: "mavuika_the_leaders_resolve",
        stats: { dmg_all: 10 },
        condition: { type: "boolean", name: "party_mavuika_kiongozi" },
      },
    ],
  },
};
