/**
 * Traveler (Hydro) — hydro sword ATK scaler with HP-side skill scaling.
 *
 * 5-hit normal combo, 2-sub-hit charged (charged_hit_total multihit parent +
 * charged_hit_1 / charged_hit_2 sub-hits), plunge/low/high, then the hydro skill
 * Aquacrest Saber (three hits) and the hydro burst Rising Waters. Normals /
 * charged / plunge are physical (sword, no innate infusion in the fixed solo
 * build); skill + burst are hydro.
 *
 * SKILL HITS (all hydro):
 *   - traveler_torrent_surge_dmg — ATK-scaling talent% PLUS the A4 "Clear Waters"
 *     HP→DMG bonus (FeatureMultiplierTravelerHydro): min(0.45 × HP_total ×
 *     traveler_clear_waters_percent, 5000), via `bonusStatFactor` + `capValue`.
 *     The slider ConditionNumber (max 100, a percent stat → /100) is 0 in the fixed
 *     solo/no-toggle build → the second term is ×0 (base-inert; the ATK-only term
 *     reproduces the golden). Exercised via the diff-parity slider (self-buffs).
 *   - traveler_dewdrop_dmg — ATK-scaling talent% PLUS the always-on Suffusion
 *     HP-scaling term (`traveler_suffusion_dmg_bonus`, scaling 'hp*'). That second
 *     multiplier carries NO condition in her data, so it folds in unconditionally
 *     (verified: ATK term + HP term reproduces the oracle dewdrop triple).
 *   - spiritbreath_thorn_dmg — ATK-scaling talent%, cannotReact (no effect on the
 *     non-reacted golden path).
 *
 * NON-DAMAGE outputs:
 *   - skill.traveler_spotless_waters_heal — A1 heal (7% HP, auto-active at A6). Ported P3.5.3.
 *   - skill.traveler_pouring_descent_shield — C4 shield, HP-scaled constant 10% (raw
 *     TravelerHydro.js:325-335, `shield_hp_scale=10`), gated ConditionConstellation(4).
 *     Ported Task 2 (display-gap burndown); see the feature comment below for the
 *     `text_percent_hp_2` verification.
 *
 * No always-on passive ATK/crit/DMG bonuses fold in: the A1 marker is a heal,
 * the A4 "Clear Waters" bonus is gated on a zero-valued slider ConditionNumber (its
 * term is ×0 until the slider is set), and both
 * `traveler_swordfighting_techniques` / `traveler_special_training` are
 * ConditionBoolean toggles (OFF in the fixed solo build). The reaction features
 * (rupture / electrocharged / shatter) are emitted generically from the hydro
 * element by the loader.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/TravelerHydro.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Traveler)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (TravelerHydro)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Traveler as TravelerStatTable } from "../generated/charTables.js";
import { TravelerHydro as TravelerHydroTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return TravelerHydroTalents.s1.p1;
      if (name === "normal_hit_2") return TravelerHydroTalents.s1.p2;
      if (name === "normal_hit_3") return TravelerHydroTalents.s1.p3;
      if (name === "normal_hit_4") return TravelerHydroTalents.s1.p4;
      if (name === "normal_hit_5") return TravelerHydroTalents.s1.p5;
      if (name === "charged_hit_1") return TravelerHydroTalents.s1.p6;
      if (name === "charged_hit_2") return TravelerHydroTalents.s1.p7;
      if (name === "plunge") return TravelerHydroTalents.s1.p9;
      if (name === "plunge_low") return TravelerHydroTalents.s1.p10;
      if (name === "plunge_high") return TravelerHydroTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "traveler_torrent_surge_dmg") return TravelerHydroTalents.s2.p2;
      if (name === "traveler_dewdrop_dmg") return TravelerHydroTalents.s2.p1;
      if (name === "traveler_suffusion_dmg_bonus") return TravelerHydroTalents.s2.p6;
      if (name === "spiritbreath_thorn_dmg") return TravelerHydroTalents.s2.p3;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return TravelerHydroTalents.s3.p1;
    }
    throw new Error(`traveler_hydro talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical, sword) ---
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
  // --- Charged attack: 2-sub-hit multihit (charged_hit_total) + the sub-hits ---
  // raw: FeatureDamageMultihit({ name:'charged_hit_total', damageType:'charged',
  //   items: [{ p6 }, { p7 }] }) plus two FeatureDamageCharged({isChild:true}).
  // The sub-hits carry isChild in her data; per the harness we drop isChild so the
  // fixture's charged_hit_1 / charged_hit_2 entries emit as standalone features.
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }] },
    ],
  },
  {
    name: "charged_hit_1",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }],
  },
  {
    name: "charged_hit_2",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }],
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
  // --- Skill: Aquacrest Saber (hydro) ---
  // Torrent surge: ATK-scaling talent% PLUS the A4 "Clear Waters" HP→DMG bonus. Her
  // FeatureMultiplierTravelerHydro (raw TravelerHydro.js:272-278): scaling 'hp*', values
  // [45], capValue [5000], getLevel()=1, getTreeBonusMultiplier → makeStatItem(
  // 'traveler_clear_waters_percent') — so the second term is
  //   min(0.45 × HP_total × traveler_clear_waters_percent, 5000),
  // where the ConditionNumber slider (0..100, a percent stat → the bag folds it /100) is
  // ported as `bonusStatFactor`. The A4 gate (ConditionAscensionChar 4) is auto-active at
  // the canonical A6 build → modelled ungated (itto/emilie precedent); the slider's own
  // value>0 gate zeroes the term when unset (base-inert: `traveler_clear_waters_percent`
  // absent → cStat 0 → min(0, 5000) = 0 → the golden torrent-surge triple is unchanged).
  {
    name: "traveler_torrent_surge_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.traveler_torrent_surge_dmg") },
      {
        scaling: "hp",
        source: "ascension4",
        leveling: "",
        values: { getValue: () => 45 },
        bonusStatFactor: "traveler_clear_waters_percent",
        capValue: 5000,
      },
    ],
  },
  // Dewdrop: ATK-scaling talent% + always-on Suffusion HP-scaling term (no condition).
  {
    name: "traveler_dewdrop_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.traveler_dewdrop_dmg") },
      { scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.traveler_suffusion_dmg_bonus") },
    ],
  },
  // --- A1 "Spotless Waters": traveler_spotless_waters_heal (7% HP, auto-active at A6) ---
  // raw: FeatureHeal({ category:'skill', multipliers:[{ scaling:'hp*', source:'ascension1',
  //   values: new StatTable('traveler_spotless_waters_heal', [dew_heal=7]) }],
  //   condition:ConditionAscensionChar({ascension:1}) })
  // source:'ascension1' → leveling='ascension1'; getValue(1)=7. Auto-active at canonical A6 build.
  {
    name: "traveler_spotless_waters_heal",
    category: "skill",
    output: { kind: "heal" },
    multipliers: [
      { scaling: "hp", leveling: "ascension1", values: { getValue: () => 7 } },
    ],
  },
  // --- C4 "Pouring Descent II" shield: skill.traveler_pouring_descent_shield ---
  // FeatureShield, HP-scaled constant (no talent leveling — source:'ascension4',
  // values:StatTable('traveler_pouring_descent_shield', [shield_hp_scale=10])). Gated
  // ConditionConstellation(4) (the `source:'ascension4'` field is display-naming only —
  // the ACTUAL gate raw checks is the constellation condition, same "source doesn't
  // match condition" quirk as her C4 torrent-surge/A4 term above).
  // VERIFIED the `text_percent_hp_2:10` flat-component question the task brief raised:
  // it does NOT belong to this FeatureShield. It lives on a SEPARATE ConditionStatic
  // display block (raw TravelerHydro.js:425-436, the C4 constellation's description
  // stats: { text_percent_hp: shield_hp_scale, text_percent_hp_2: 10 }) — a duplicate
  // display-only readout of the same 10% value (both equal `shield_hp_scale`), not a
  // second additive term in the shield's `multipliers` list (which has exactly ONE
  // FeatureMultiplier, TravelerHydro.js:325-334, no flatValues). So this is a plain
  // single-value percent-of-HP shield, no custom getValue / flatValues baking needed.
  // raw/genshin_calc_pub/src/js/db/Char/TravelerHydro.js:325-335,433. shield_hp_scale = 10 (:132).
  {
    name: "traveler_pouring_descent_shield",
    category: "skill",
    output: { kind: "shield" },
    condition: { type: "constellation", constellation: 4 },
    multipliers: [
      { scaling: "hp", leveling: "", values: { getValue: () => 10 } },
    ],
  },
  // Spiritbreath Thorn: ATK-scaling talent% (cannotReact has no effect on the non-reacted path).
  {
    name: "spiritbreath_thorn_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.spiritbreath_thorn_dmg") }],
  },
  // --- Burst: Rising Waters (hydro) ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Swelling Lake": ConditionStatic, no real stats — SKIP.
// C2 "Trickling Purity": ConditionStatic, no real stats — SKIP.
// C3 "Pouring Descent": +3 skill talent (char_skill_elemental_bonus).
// C4 "Pouring Descent II": ConditionStatic cons-array display row (text_percent_hp/_2,
//   display-only) — SKIP. The actual shield (skill.traveler_pouring_descent_shield) is a
//   separate FeatureShield in the features list above, ported (Task 2, display-gap burndown).
// C5 "Tides of Justice": +3 burst talent (char_skill_burst_bonus).
// C6 "Tides of Justice II": ConditionStatic with text_percent_hp (display-only) — SKIP.
// Sources: raw/genshin_calc_pub/src/js/db/Char/TravelerHydro.js:400-462

const constellationConditions: readonly Condition[] = [
  // C3 — +3 Elemental Skill (Aquacrest Saber).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 — +3 Elemental Burst (Rising Waters).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// A4 "Clear Waters" input: the ConditionNumber slider (0..100) whose clamped value the torrent-
// surge A4 multiplier reads via `bonusStatFactor`. Her `traveler_clear_waters_percent` is a
// percent stat (`_percent` → isPercent), so buildStats folds it /100 (slider 50 → 0.5). The raw
// ascension-4 subcondition is auto-active at A6 → omitted; the inherent value>0 gate keeps it
// inert (slider unset → no stat emitted → the A4 factor reads 0). Raw TravelerHydro.js:364-378.
const clearWatersCondition: Condition = {
  type: "number",
  name: "traveler_clear_waters_percent",
  max: 100,
};

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const travelerHydro: DbObjectChar = {
  name: "traveler_hydro",
  gameId: 10000005,
  rarity: 5,
  element: "hydro",
  weapon: "sword",
  origin: "foreign",
  statTable: TravelerStatTable,
  talents,
  features,
  multipliers: [],
  conditions: [clearWatersCondition, ...constellationConditions],
};
