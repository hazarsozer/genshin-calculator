/**
 * Yaoyao — dendro polearm ATK scaler.
 *
 * 4-hit normal combo (n3: 2-hit multihit → children _3_1/_3_2), charged hit,
 * plunge/low/high, dendro skill (yaoyao_radish_dmg), dendro burst (burst_dmg +
 * yaoyao_white_radish_dmg).
 *
 * Several features in raw have no explicit `name` — their key is derived from the
 * first multiplier's StatTable name (her Feature2 name-fallback pattern). In our
 * port, every feature gets an explicit name matching the fixture key.
 *
 * Heals (yaoyao_radish_heal, yaoyao_in_others_shoes_heal, yaoyao_white_radish_heal)
 * and other.mastery_bonus are non-damage outputs (empty damageType) → modelled as
 * output:{kind:"heal"/"static"} (P3.5.3). All HP-scaled (no healing-bonus passive).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Yaoyao.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Yaoyao)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Yaoyao)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Yaoyao as YaoyaoStatTable } from "../generated/charTables.js";
import { Yaoyao as YaoyaoTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return YaoyaoTalents.s1.p1;
      if (name === "normal_hit_2") return YaoyaoTalents.s1.p2;
      if (name === "normal_hit_3_1") return YaoyaoTalents.s1.p3;
      if (name === "normal_hit_3_2") return YaoyaoTalents.s1.p4;
      if (name === "normal_hit_4") return YaoyaoTalents.s1.p5;
      if (name === "charged_hit") return YaoyaoTalents.s1.p6;
      if (name === "plunge") return YaoyaoTalents.s1.p8;
      if (name === "plunge_low") return YaoyaoTalents.s1.p9;
      if (name === "plunge_high") return YaoyaoTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "yaoyao_radish_dmg") return YaoyaoTalents.s2.p1;
      if (name === "yaoyao_radish_heal_percent") return YaoyaoTalents.s2.p2;
      if (name === "yaoyao_radish_heal_flat") return YaoyaoTalents.s2.p3;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return YaoyaoTalents.s3.p4;
      if (name === "yaoyao_white_radish_dmg") return YaoyaoTalents.s3.p1;
      if (name === "yaoyao_white_radish_heal_percent") return YaoyaoTalents.s3.p2;
      if (name === "yaoyao_white_radish_heal_flat") return YaoyaoTalents.s3.p3;
    }
    throw new Error(`yaoyao talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
  // raw: FeatureDamageNormal normal_hit_1 (explicit name)
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_2 (explicit name)
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  // raw: FeatureDamageMultihit normal_hit_3 (parent = _3_1 + _3_2)
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }] },
    ],
  },
  // raw: FeatureDamageNormal isChild:true (name derived → 'normal_hit_3_1') → drop isChild to emit
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }],
  },
  // raw: FeatureDamageNormal isChild:true (name derived → 'normal_hit_3_2') → drop isChild to emit
  {
    name: "normal_hit_3_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }],
  },
  // raw: FeatureDamageNormal normal_hit_4 (explicit name)
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attack (no explicit name → derived 'charged_hit') ---
  // raw: FeatureDamageCharged, name from multipliers[0].getName() = 'charged_hit'
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (no explicit names → derived from talent table) ---
  // raw: FeatureDamagePlungeCollision, name → 'plunge'
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave, name → 'plunge_low'
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave, name → 'plunge_high'
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Raphanus Sky Cluster (dendro) ---
  // raw: FeatureDamageSkill, no explicit name → derived 'yaoyao_radish_dmg'
  {
    name: "yaoyao_radish_dmg",
    category: "skill",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.yaoyao_radish_dmg") }],
  },
  // --- C6 "Beneficent": cons-added skill hit (75% ATK, fixed, not talent-leveled).
  // Raw: FeatureDamageSkill, StatTable('yaoyao_megaradish_dmg', [75]),
  // source:'constellation6', ConditionConstellation(6). Yaoyao.js:265-274.
  {
    name: "yaoyao_megaradish_dmg",
    category: "skill",
    element: "dendro",
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      {
        leveling: "char_skill_elemental",
        values: { getValue: (_level: number) => 75 },
        source: "constellation6",
      },
    ],
  },
  // --- Burst: Moonjade Descent (dendro) ---
  // raw: FeatureDamageBurst, no explicit name → derived 'burst_dmg' (from s3.p4)
  {
    name: "burst_dmg",
    category: "burst",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // raw: FeatureDamageBurst, no explicit name → derived 'yaoyao_white_radish_dmg' (from s3.p1)
  {
    name: "yaoyao_white_radish_dmg",
    category: "burst",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.yaoyao_white_radish_dmg") }],
  },
  // --- Heals (FeatureHeal): skill radish + A4 in-others-shoes + burst white-radish (all HP-scaled) ---
  // skill.yaoyao_radish_heal: FeatureMultiplierList scaling hp*, getList = [s2.p2 (%), s2.p3 (flat)].
  // raw/genshin_calc_pub/src/js/db/Char/Yaoyao.js:75-82,275-284.
  {
    name: "yaoyao_radish_heal",
    category: "skill",
    output: { kind: "heal" },
    multipliers: [
      { scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.yaoyao_radish_heal_percent"), flatValues: talents.get("skill.yaoyao_radish_heal_flat") },
    ],
  },
  // skill.yaoyao_in_others_shoes_heal: A4 "Adeptal Legacy" — fixed 0.8% Max HP (ValueTable[0.8]), source
  // ascension4, auto-active at A6. raw/genshin_calc_pub/src/js/db/Char/Yaoyao.js:296-308.
  {
    name: "yaoyao_in_others_shoes_heal",
    category: "skill",
    output: { kind: "heal" },
    multipliers: [
      { scaling: "hp", leveling: "ascension4", values: { getValue: () => 0.8 } },
    ],
  },
  // burst.yaoyao_white_radish_heal: party heal, FeatureMultiplierList scaling hp*, getList = [s3.p2 (%), s3.p3 (flat)].
  // raw/genshin_calc_pub/src/js/db/Char/Yaoyao.js:108-115,325-334.
  {
    name: "yaoyao_white_radish_heal",
    category: "burst",
    output: { kind: "heal", partyHeal: true },
    multipliers: [
      { scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.yaoyao_white_radish_heal_percent"), flatValues: talents.get("burst.yaoyao_white_radish_heal_flat") },
    ],
  },
  // --- A4 "Adeptal Legacy" static readout: other.mastery_bonus = Max HP → EM (capped 120) ---
  // FeaturePostEffectValue(masteryBonusPost = PostEffectStatsHP, percent=StatTable('mastery',[0.003]),
  // statCap=StatTable('',[120])). 'mastery' name is NOT isPercent → no /100; fmt="" → no ×100; so displayed =
  // 0.003×hp_total capped at 120. values = 0.003×100 = 0.3 → (0.3/100)×hp_total = 0.003×hp_total (≈94.9). The
  // C4+winsome conditions gate APPLICATION not the readout → modelled without them (cf. emilie/itto).
  // raw/genshin_calc_pub/src/js/db/Char/Yaoyao.js:134-141,336-341.
  {
    name: "mastery_bonus",
    category: "other",
    output: { kind: "static" },
    multipliers: [
      { scaling: "hp", leveling: "", values: { getValue: () => 0.3 }, capValue: 120 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Adeptus Tutelage": ConditionBoolean toggle (dmg_dendro:15) → SKIP (toggle OFF).
// C2 "Innocent": ConditionStatic (display-only) → SKIP.
// C3: +3 levels to Raphanus Sky Cluster (elemental skill).
//   Raw cons[2] settings char_skill_elemental_bonus:3. Yaoyao.js:398-407.
// C4 "Winsome": ConditionBoolean toggle (mastery HP-bonus display) → SKIP (toggle OFF).
// C5: +3 levels to Moonjade Descent (burst).
//   Raw cons[4] settings char_skill_burst_bonus:3. Yaoyao.js:420-430.
// C6 "Beneficent": ConditionStatic (display-only text_percent_atk/heal) → SKIP.
//   The actual C6 damage is the yaoyao_megaradish_dmg feature above.
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Raphanus Sky Cluster (elemental skill).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 levels to Moonjade Descent (burst).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
  // SELF "Adeptus' Tutelage" (C1) — +15% Dendro DMG (dmg_dendro:15), lifting Yaoyao's OWN dendro hits
  // (skill yaoyao_radish_dmg, burst burst_dmg + yaoyao_white_radish_dmg, and the C6 yaoyao_megaradish_dmg).
  // ConditionBoolean gated at C1 (lives in constellation[0] → THE CONSTELLATION IS A GATE). SELF mirror of
  // party.yaoyao_adeptus_tutelage; the port modelled only the party.* version → golden-blind SKIP.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Yaoyao.js:379-387 (constellation[0], ConditionBoolean).
  {
    type: "boolean",
    name: "yaoyao_adeptus_tutelage",
    stats: { dmg_dendro: 15 },
    condition: { type: "constellation", constellation: 1 },
  },
  // ── DEFERRED (Tier-B, NOT ported) — C4 "Winsome" (yaoyao_winsome) ────────────────────────────────
  // C4 gates the masteryBonusPost: a HP→EM stat-CONVERSION postEffect (EM += min(0.3% Max HP, 120),
  // PostEffectStatsHP gated by ConditionConstellation(4) AND ConditionBoolean('yaoyao_winsome'); raw
  // Yaoyao.js:134-141 + :407-420). The yaoyao_winsome boolean itself carries only display stats
  // (text_percent_hp / text_value_max). The granted EM is INERT for Yaoyao's own ATK/physical-scaled
  // hits but boosts her EM-scaled transformative reactions (diff-parity shows reaction.burning/
  // electrocharged/rupture/shatter diverge at cons≥4 when yaoyao_winsome:true). Modelling it requires a
  // real HP→EM postEffect emit (a stat conversion) — a Tier-B engine-surface item, deferred per the
  // self-buffs DATA-port scope. The mastery_bonus *readout* feature is already modelled (display only).
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const yaoyao: DbObjectChar = {
  name: "yaoyao",
  gameId: 10000077,
  rarity: 4,
  element: "dendro",
  weapon: "polearm",
  origin: "liyue",
  statTable: YaoyaoStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // C1 "Adeptus Tutelage" — +15% Dendro DMG to party.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Yaoyao.js (partyData conditions)
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { dmg_dendro: 15 },
        condition: { type: "boolean", name: "party.yaoyao_adeptus_tutelage" },
      },
    ],
  },
};
