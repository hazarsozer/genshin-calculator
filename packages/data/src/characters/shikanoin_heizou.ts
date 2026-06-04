/**
 * Shikanoin Heizou — anemo catalyst ATK scaler.
 *
 * 5-hit normal combo where n4 is a 3-hit multihit (children _4_1/_4_2/_4_3),
 * charged hit, plunge/low/high — all ANEMO (catalyst infuses innately).
 * Anemo skill (Heartstopper Strike) with the four Declension variants, and the
 * anemo burst (Windmuster Kick) plus its Windmuster Iris absorbed-element hits.
 *
 * DECLENSION SKILL FAMILY (the load-bearing port detail):
 *   Her skill emits four named features, each a SUM of talent tables:
 *     heizo_skill_1_dmg = skill_dmg + declension
 *     heizo_skill_2_dmg = skill_dmg + declension × 2
 *     heizo_skill_3_dmg = skill_dmg + declension × 3
 *     heizo_skill_4_dmg = skill_dmg + declension × 4 + conviction
 *   The ×2/×3/×4 come from `scalingMultiplier: N` on the declension multiplier.
 *   CRITICAL: in her engine `scalingMultiplier` is a plain CONSTANT factor —
 *   `Multiplier.getTreeBonusMultiplier` returns `CConst({value: scalingMultiplier})`
 *   when the value is numeric (raw/.../Feature2/Multiplier.js:259-275). The paired
 *   `scalingSource: 'stacks'` is only a CConst *comment*, NOT a settings/stacks
 *   lookup — the declension-stacks ConditionStacks never feeds these multipliers.
 *   So each declension/conviction term is deterministic; I reproduce the ×N by
 *   wrapping the table (the engine has no `scalingMultiplier` field) — exact, the
 *   same technique used for Eula's A1 ×0.5.
 *
 * Verified against the oracle: ours/oracle was a constant 1.6923 ratio across all
 * five skill features before accounting for def-mult + the always-on weapon bonus,
 * confirming the multiplier STRUCTURE is exact (the engine supplies def-mult,
 * res-mult, and the Solar Pearl normal↔skill DMG bonus).
 *
 * CRIT-BONUS KEYS (C6-only, read 0 here): the declension features carry her
 * `critRateBonuses: ['crit_rate_heizouN']` (and `crit_dmg_heizou4`). Those keys are
 * populated only by C6 (skipped — solo C0 build), so they read 0: crit = normal × 2.0
 * and avg uses the base 37.564% crit rate (confirmed numerically against the fixture).
 * Kept for fidelity, exactly as Eula keeps `dmg_burst_eula`.
 *
 * SKIPPED (not modelled in the solo-C0 fixture, all benign):
 *   - A1 Paradoxical Practice (text-only swirl-on-skill enabler), A4 Penetrative
 *     Reasoning (party EM share / text), all constellations (C0 build).
 *   - reaction.* fixture entries (swirl/overload/electrocharged/hyperbloom/burgeon/
 *     burning/superconduct/shatter/rupture): her engine auto-generates these from the
 *     reaction system, NOT from char features, and the golden harness runs with
 *     `settings: {}`. They are reported as coverage gaps (same as Venti), not failures.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Heizou.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Heizou)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Heizou)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier.js (getTreeBonusMultiplier, scalingMultiplier)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver, TalentTable } from "@genshin/types";
import { Heizou as HeizouStatTable } from "../generated/charTables.js";
import { Heizou as HeizouTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return HeizouTalents.s1.p1;
      if (name === "normal_hit_2") return HeizouTalents.s1.p2;
      if (name === "normal_hit_3") return HeizouTalents.s1.p3;
      if (name === "normal_hit_4_1") return HeizouTalents.s1.p4;
      if (name === "normal_hit_4_2") return HeizouTalents.s1.p5;
      if (name === "normal_hit_4_3") return HeizouTalents.s1.p6;
      if (name === "normal_hit_5") return HeizouTalents.s1.p7;
      if (name === "charged_hit") return HeizouTalents.s1.p8;
      if (name === "plunge") return HeizouTalents.s1.p10;
      if (name === "plunge_low") return HeizouTalents.s1.p11;
      if (name === "plunge_high") return HeizouTalents.s1.p12;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return HeizouTalents.s2.p1;
      if (name === "heizou_declension_dmg") return HeizouTalents.s2.p2;
      if (name === "heizou_conviction_dmg") return HeizouTalents.s2.p3;
    }
    if (talent === "burst") {
      if (name === "heizou_vacuum_slugger_dmg") return HeizouTalents.s3.p1;
      if (name === "heizou_windmuster_iris_dmg") return HeizouTalents.s3.p2;
    }
    throw new Error(`shikanoin_heizou talents: unknown path '${path}'`);
  },
};

// Declension table scaled by a constant stack factor (her scalingMultiplier: N).
// Reproduces the CConst factor exactly without an engine `scalingMultiplier` field.
const declensionTimes = (n: number): TalentTable => ({
  getValue: (level: number) => HeizouTalents.s2.p2.getValue(level) * n,
});

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (anemo catalyst, always anemo) ---
  {
    name: "normal_hit_1",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // normal_hit_4: 3-hit multihit parent (three distinct sub-tables p4/p5/p6).
  // raw: FeatureDamageMultihit({ items: [{p4},{p5},{p6}] })
  {
    name: "normal_hit_4",
    category: "attack",
    damageType: "normal",
    element: "anemo",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4_2") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4_3") }] },
    ],
  },
  // Child sub-hits of normal_hit_4. Her isChild rows dropped → modelled as their
  // own features so they emit. raw: Heizou.js normal_hit_4_1/_2/_3 (isChild:true).
  {
    name: "normal_hit_4_1",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4_1") }],
  },
  {
    name: "normal_hit_4_2",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4_2") }],
  },
  {
    name: "normal_hit_4_3",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4_3") }],
  },
  {
    name: "normal_hit_5",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
  },
  // --- Charged attack (anemo) ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (anemo catalyst) ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Heartstopper Strike (anemo) ---
  // skill_dmg: charge-0 base hit.
  {
    name: "skill_dmg",
    category: "skill",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // Declension variants: base skill + N× declension (constant scalingMultiplier).
  // crit_rate_heizouN / crit_dmg_heizou4 are C6-only (read 0 at C0); kept for fidelity.
  {
    name: "heizo_skill_1_dmg",
    category: "skill",
    element: "anemo",
    critRateBonuses: ["crit_rate_heizou1"],
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") },
      { leveling: "char_skill_elemental", values: talents.get("skill.heizou_declension_dmg") },
    ],
  },
  {
    name: "heizo_skill_2_dmg",
    category: "skill",
    element: "anemo",
    critRateBonuses: ["crit_rate_heizou2"],
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") },
      { leveling: "char_skill_elemental", values: declensionTimes(2) },
    ],
  },
  {
    name: "heizo_skill_3_dmg",
    category: "skill",
    element: "anemo",
    critRateBonuses: ["crit_rate_heizou3"],
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") },
      { leveling: "char_skill_elemental", values: declensionTimes(3) },
    ],
  },
  {
    name: "heizo_skill_4_dmg",
    category: "skill",
    element: "anemo",
    critRateBonuses: ["crit_rate_heizou4"],
    critDamageBonuses: ["crit_dmg_heizou4"],
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") },
      { leveling: "char_skill_elemental", values: declensionTimes(4) },
      { leveling: "char_skill_elemental", values: talents.get("skill.heizou_conviction_dmg") },
    ],
  },
  // --- Burst: Windmuster Kick ---
  // heizou_vacuum_slugger_dmg: the anemo kick.
  {
    name: "heizou_vacuum_slugger_dmg",
    category: "burst",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.heizou_vacuum_slugger_dmg") }],
  },
  // Windmuster Iris absorbed-element variants: pyro/hydro/cryo/electro, each sharing s3.p2.
  // raw: FeatureDamageBurst({ name:'anemoskill_<elem>_dmg', element:<elem>, ... })
  {
    name: "anemoskill_pyro_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.heizou_windmuster_iris_dmg") }],
  },
  {
    name: "anemoskill_hydro_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.heizou_windmuster_iris_dmg") }],
  },
  {
    name: "anemoskill_cryo_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.heizou_windmuster_iris_dmg") }],
  },
  {
    name: "anemoskill_electro_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.heizou_windmuster_iris_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Named Juvenile Casebook": ConditionBoolean (atk_speed_normal toggle) → SKIP.
// C2 "Investigative Collection": ConditionStatic no real stats → SKIP.
// C3 "Tome of Lies": wait — raw has C3=elemental_bonus, C4=ConditionStatic, C5=burst_bonus.
//   Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus:3 } } → C3.
//   Raw cons[4]: Condition{ settings:{ char_skill_burst_bonus:3 } } → C5.
// C4 "Tome of Lies": ConditionStatic no real stats → SKIP.
// C6 "Curious Casefiles": ConditionStatic with crit_rate_heizou1/2/3/4 + crit_dmg_heizou4.
//   These suffixed keys are ALREADY wired into the heizo_skill_*_dmg features above
//   (critRateBonuses / critDamageBonuses). The C6 stat grant populates the keys so
//   they contribute. At C<6 the keys read 0 → features remain base-correct.
//
// TalentValues: C6CritRate=4, C6CritDmg=32.
// crit_rate_heizou1 = 4, crit_rate_heizou2 = 8, crit_rate_heizou3 = 12,
// crit_rate_heizou4 = 16, crit_dmg_heizou4 = 32.
// Sources: raw/genshin_calc_pub/src/js/db/Char/Heizou.js:436-499

const constellationConditions: readonly Condition[] = [
  // C3 "Tome of Lies" — +3 Elemental Skill talent levels (Heartstopper Strike).
  // Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 "Curious Casefiles" — wait, raw cons[4] = char_skill_burst_bonus.
  // C5 "Astable Investigation": +3 Elemental Burst talent levels (Windmuster Kick).
  // Raw cons[4]: Condition{ settings:{ char_skill_burst_bonus:3 } }
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
  // C6 "Curious Casefiles" — crit_rate_heizou1/2/3/4 and crit_dmg_heizou4.
  // ConditionStatic always-on at C6. Keys wired into skill features above.
  // Raw cons[5]: ConditionStatic{ stats:{ crit_rate_heizou1:4, crit_rate_heizou2:8,
  //   crit_rate_heizou3:12, crit_rate_heizou4:16, crit_dmg_heizou4:32 } }
  {
    type: "constellation",
    constellation: 6,
    stats: {
      crit_rate_heizou1: 4,
      crit_rate_heizou2: 8,
      crit_rate_heizou3: 12,
      crit_rate_heizou4: 16,
      crit_dmg_heizou4: 32,
    },
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const shikanoinHeizou: DbObjectChar = {
  name: "shikanoin_heizou",
  gameId: 10000059,
  rarity: 4,
  element: "anemo",
  weapon: "catalyst",
  origin: "inazuma",
  statTable: HeizouStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // A4 "Penetrative Reasoning" — +80 EM to nearby party.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Heizou.js (partyData conditions)
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { mastery: 80 },
        condition: { type: "boolean", name: "party.shikanoin_heizou_penetrative_reasoning" },
      },
    ],
  },
};
