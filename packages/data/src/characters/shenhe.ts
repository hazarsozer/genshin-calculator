/**
 * Shenhe — cryo polearm ATK scaler.
 *
 * 5-hit normal combo (n4: 2-hit multihit → child normal_hit_4_1), physical
 * charged hit, plunge/low/high (physical polearm), cryo skill (press_dmg +
 * hold_dmg), cryo burst (burst_dmg + dot_dmg).
 *
 * Icy Quill (shenhe_dmg_bonus, skill.shenhe_dmg_bonus): the self-readout VALUE (talent% × ATK)
 * is modelled as output:{kind:"static"} (P3.5.3).
 * The Icy Quill flat-cryo-DMG buff IS a TEAMMATE buff — ported as a Bucket-C
 * `partyData.multipliers` entry (see § partyData below): an ATK-scaled, cryo-element
 * damage-instance bonus on the recipient's hits, gated by party.shenhe_icy_quill.
 * On Shenhe's own self kit it is OFF at baseline (boolean toggle) → not included here.
 *
 * A4 (shenhe_talisman_spirit) res shred is a boolean toggle — OFF at baseline.
 * A1 (shenhe_deific_embrace) +15% cryo DMG is conditional on shenhe_spirit_field — OFF.
 * A4 (shenhe_spirit_seal_*) skill/burst/normal/charged/plunge DMG bonuses are boolean
 * toggles — OFF at baseline.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Shenhe.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Shenhe)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Shenhe)
 */

import type { CharMultiplier, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Shenhe as ShenheStatTable } from "../generated/charTables.js";
import { Shenhe as ShenheTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return ShenheTalents.s1.p1;
      if (name === "normal_hit_2") return ShenheTalents.s1.p2;
      if (name === "normal_hit_3") return ShenheTalents.s1.p3;
      if (name === "normal_hit_4") return ShenheTalents.s1.p4;
      if (name === "normal_hit_5") return ShenheTalents.s1.p6;
      if (name === "charged_hit")  return ShenheTalents.s1.p7;
      if (name === "plunge")       return ShenheTalents.s1.p9;
      if (name === "plunge_low")   return ShenheTalents.s1.p10;
      if (name === "plunge_high")  return ShenheTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "press_dmg") return ShenheTalents.s2.p1;
      if (name === "hold_dmg")  return ShenheTalents.s2.p2;
      // Icy Quill DMG bonus %: the Spring Spirit Summoning passive's stacking
      // damage bonus, scaled by Shenhe's ATK as a teammate (Bucket-C partyData).
      // raw/genshin_calc_pub/src/js/db/Char/Shenhe.js — skill.shenhe_dmg_bonus (s2.p3)
      if (name === "shenhe_dmg_bonus") return ShenheTalents.s2.p3;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return ShenheTalents.s3.p1;
      if (name === "dot_dmg")   return ShenheTalents.s3.p3;
    }
    throw new Error(`shenhe talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical polearm) ---
  // raw/genshin_calc_pub/src/js/db/Char/Shenhe.js — FeatureDamageNormal × 3
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
  // normal_hit_4: 2-hit multihit parent (same multiplier × 2 hits).
  // raw/genshin_calc_pub/src/js/db/Char/Shenhe.js — FeatureDamageMultihit normal_hit_4
  // items: [{ hits: 2, multipliers: [s1.p4] }] → parent sums both.
  {
    name: "normal_hit_4",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
    ],
  },
  // Child hit: one of the 2 hits of normal_hit_4 (half the parent total).
  // raw/genshin_calc_pub/src/js/db/Char/Shenhe.js — FeatureDamageNormal isChild normal_hit_4_1
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
  // --- Charged attack (physical polearm) ---
  // raw/genshin_calc_pub/src/js/db/Char/Shenhe.js — FeatureDamageCharged charged_hit
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (physical polearm) ---
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
  // --- Skill: Spring Spirit Summoning (cryo) ---
  // press_dmg / hold_dmg both cryo, no conditional damageBonuses at baseline.
  // shenhe_icy_quill damageBonuses OFF (boolean toggle at baseline).
  // raw/genshin_calc_pub/src/js/db/Char/Shenhe.js — FeatureDamageSkill press_dmg, hold_dmg
  {
    name: "press_dmg",
    category: "skill",
    element: "cryo",
    critDamageBonuses: ["crit_dmg_cryo"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.press_dmg") }],
  },
  {
    name: "hold_dmg",
    category: "skill",
    element: "cryo",
    critDamageBonuses: ["crit_dmg_cryo"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.hold_dmg") }],
  },
  // --- Burst: Divine Maiden's Deliverance (cryo) ---
  // raw/genshin_calc_pub/src/js/db/Char/Shenhe.js — FeatureDamageBurst burst_dmg + dot_dmg
  {
    name: "burst_dmg",
    category: "burst",
    element: "cryo",
    critDamageBonuses: ["crit_dmg_cryo"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  {
    name: "dot_dmg",
    category: "burst",
    element: "cryo",
    critDamageBonuses: ["crit_dmg_cryo"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.dot_dmg") }],
  },
  // --- Skill static readout: skill.shenhe_dmg_bonus = Icy Quill flat-DMG-bonus value (talent% × ATK) ---
  // FeaturePostEffectValue(PostEffectStatsAtk, percent=talent×0.01), char_skill_elemental, format="" (no ×100).
  // Self-readout of the quill value; the teammate-buff APPLICATION is the partyData multiplier below.
  // raw/genshin_calc_pub/src/js/db/Char/Shenhe.js:266-280
  {
    name: "shenhe_dmg_bonus",
    category: "skill",
    output: { kind: "static" },
    multipliers: [
      { scaling: "atk", leveling: "char_skill_elemental", values: talents.get("skill.shenhe_dmg_bonus") },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Clarity of Heart": ConditionStatic no real stats → SKIP.
// C2 "Centered Spirit": ConditionStatic with crit_dmg_cryo:15 BUT gated on
//   subConditions:[ConditionBoolean(shenhe_spirit_field)] — toggle → SKIP.
// C3 "Seclusion": +3 Elemental Skill talent levels.
//   Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
// C4 "Insight": ConditionNumberShenhe (stacks toggle) → SKIP.
// C5 "Divine Attainment": slot {} in raw cons[4] — no conditions → no effect.
// C6 "Mystical Abandon": ConditionStatic no real stats → SKIP.
// Sources: raw/genshin_calc_pub/src/js/db/Char/Shenhe.js:393-453

const constellationConditions: readonly Condition[] = [
  // C3 "Seclusion" — +3 levels to Spring Spirit Summoning (Elemental Skill).
  // Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 "Divine Maiden's Deliverance" — +3 levels to the Elemental Burst. In raw this is a
  // char-level Condition gated by subConditions:[ConditionConstellation(5)] (Shenhe.js:311-318),
  // NOT the cons array (whose C5 slot is empty). Modelled as the equivalent constellation condition.
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
  // C2 "Centered Spirit" — +15% Cryo CRIT DMG, gated on C2 AND the Spirit Field toggle. Raw
  // cons[1]: ConditionStatic{ stats:{crit_dmg_cryo:15}, subConditions:[shenhe_spirit_field] } (the
  // cons level is the array slot). evaluateConstellation ignores `.condition` (level-only), so the
  // C2 gate is folded via and[constellation:2, spirit_field]. Consumed by the cryo skill/burst
  // features (critDamageBonuses:['crit_dmg_cryo']). Raw Shenhe.js:403-418.
  {
    type: "static",
    stats: { crit_dmg_cryo: 15 },
    condition: {
      type: "and",
      items: [
        { type: "constellation", constellation: 2 },
        { type: "boolean", name: "shenhe_spirit_field" },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// SELF passive/kit conditions (P3.5 skip-class self-buff port)
// ---------------------------------------------------------------------------
// The port modelled the party.* mirror of the Icy Quill multiplier but SKIPPED every SELF
// condition below (the quill on Shenhe's OWN hits + her passive/A4 DMG bonuses + the talisman
// res-shred) → golden-blind SKIP (no golden toggles them). All gated OFF by default → base-inert.
// Source: raw/genshin_calc_pub/src/js/db/Char/Shenhe.js:310-392.
const selfConditions: readonly Condition[] = [
  // A4 "Spirit Communion Seal" (Rapid Hunt / press): +15% Skill DMG + +15% Burst DMG, a SELF
  // boolean toggle (A4 always active on our A6 builds). Raw Shenhe.js:363-376.
  { type: "boolean", name: "shenhe_spirit_seal_press", stats: { dmg_skill: 15, dmg_burst: 15 } },
  // A4 "Spirit Communion Seal" (Deep Pierce / hold): +15% Normal/Charged/Plunge DMG, a SELF
  // boolean toggle. Raw Shenhe.js:377-392.
  {
    type: "boolean",
    name: "shenhe_spirit_seal_hold",
    stats: { dmg_normal: 15, dmg_charged: 15, dmg_plunge: 15 },
  },
  // A1 "Deific Embrace": +15% Cryo DMG while standing in the Spirit Field. Raw ConditionStatic
  // gated [A1, shenhe_spirit_field]; A1 always-on at A6, so the live gate is the spirit_field
  // boolean. Raw Shenhe.js:349-362.
  {
    type: "static",
    name: "shenhe_deific_embrace",
    stats: { dmg_cryo: 15 },
    condition: { type: "boolean", name: "shenhe_spirit_field" },
  },
  // "Divine Maiden's Deliverance" talisman field — enemy Cryo & Physical RES −(burst talent value).
  // Raw ConditionBooleanLevels scaling enemy_res_phys/cryo off burst.shenhe_res_decrease × −1
  // (Shenhe.js:330-348). The res_decrease table (s3.p2) CAPS at 15 for every burst level ≥10, so
  // at our L10 builds (incl. C5 +3 → L13) the shred is a constant −15 on both keys — faithful, not
  // a baked approximation (the value is level-invariant across the realistic range).
  {
    type: "boolean",
    name: "shenhe_talisman_spirit",
    stats: { enemy_res_physical: -15, enemy_res_cryo: -15 },
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const shenhe: DbObjectChar = {
  name: "shenhe",
  gameId: 10000063,
  rarity: 5,
  element: "cryo",
  weapon: "polearm",
  origin: "liyue",
  statTable: ShenheStatTable,
  talents,
  features,
  // SELF Icy Quill — the wielder buffs her OWN cryo hits with a flat DMG instance
  // (shenhe_dmg_bonus% × her own ATK), gated by the shenhe_icy_quill toggle. Raw Shenhe.js:297-308
  // (FeatureMultiplier in the char `multipliers` array, default scaling 'atk*' = atk_total, leveling
  // char_skill_elemental, target cryo normal/charged/plunge/skill/burst). The port had ONLY the
  // party.shenhe_icy_quill mirror → golden-blind SKIP of the SELF quill (Shenhe's own cryo skill/
  // burst hits under-reported when icy_quill is ON). Reuses the SAME CharMultiplier surface as the
  // party version, scaled off Shenhe's own atk_total. Gated OFF by default → base-inert.
  multipliers: [
    {
      source: "talent_elemental",
      scaling: "atk*",
      leveling: "char_skill_elemental",
      values: talents.get("skill.shenhe_dmg_bonus"),
      condition: { type: "boolean", name: "shenhe_icy_quill" },
      target: {
        damageElements: ["cryo"],
        damageTypes: ["normal", "charged", "plunge", "skill", "burst"],
      },
    } satisfies CharMultiplier,
  ],
  conditions: [...constellationConditions, ...selfConditions],
  // partyData — teammate kit buff (P3.5.2 Bucket C).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Shenhe.js:451-622
  // Scope: oracle-gated core only — the Icy Quill cryo-DMG-instance multiplier
  // (Spring Spirit Summoning: a flat DMG bonus = shenhe_dmg_bonus% × Shenhe's ATK,
  // added to each cryo hit of the active char). Conditions ported = ONLY the two
  // lifts the multiplier reads + its gate's input. The many constellation/passive
  // boolean conditions (deific embrace, spirit seals, talisman res-shred, centered
  // spirit, C3/C5) are deferred to the P3.5.2 variant-rep pass.
  partyData: {
    // Descriptive metadata mirroring her loadStats (the teammate input contract).
    loadStats: {
      stats: ["atk_total"],
      settings: ["char_skill_elemental", "char_skill_burst"],
    },
    conditions: [
      // Lift Shenhe's atk_total (baked teammate setting) into the recipient's stat
      // bag as `shenhe_atk_total`, so the multiplier's `scaling` can read it via cStat.
      // raw: ConditionNumber({name:'shenhe_atk_total', partyStat:'atk_total', max:10000}).
      { type: "number", name: "shenhe_atk_total", max: 10000 },
      // Lift Shenhe's Elemental Skill talent level (baked teammate setting) — the
      // multiplier's `leveling` key. raw: ConditionNumberTalent({name:
      // 'shenhe_char_skill_elemental', partySetting:'char_skill_elemental'}). Modelled
      // with the `number` lift idiom (Bucket-B precedent); the level itself is read
      // from the merged settings by compileFeature's baseDamageTerm.
      { type: "number", name: "shenhe_char_skill_elemental" },
    ],
    multipliers: [
      // Icy Quill: shenhe_dmg_bonus% × shenhe_atk_total, summed into the base-damage
      // term of every CRYO hit (normal/charged/plunge/skill/burst) of the recipient.
      // Gated by the party.shenhe_icy_quill master toggle. The damageElements:['cryo']
      // filter (C0 extension) restricts it to cryo hits — physical normal/charged/
      // plunge attacks are NOT buffed.
      // raw/genshin_calc_pub/src/js/db/Char/Shenhe.js:609-620
      {
        source: "shenhe",
        scaling: "shenhe_atk_total",
        leveling: "shenhe_char_skill_elemental",
        values: talents.get("skill.shenhe_dmg_bonus"),
        condition: { type: "boolean", name: "party.shenhe_icy_quill" },
        target: {
          damageElements: ["cryo"],
          damageTypes: ["normal", "charged", "plunge", "skill", "burst"],
        },
      } satisfies CharMultiplier,
    ],
  },
};
