/**
 * Sigewinne — hydro bow, HP-scaling bubble bombardment.
 *
 * Normal attacks (Targeted Treatment): 3-hit bow combo (physical, ATK-scaled),
 * plus the aimed-shot family:
 *   aimed         — physical aimed shot (FeatureDamageChargedAimed, ATK, charged)
 *   charged_aimed — fully-charged aimed shot (hydro, ATK, charged)
 *   sigewinnne_mini_stration_bubble_dmg — Bubbly Bombs charged hit (hydro, ATK,
 *     charged). NOTE the triple-n typo in the talent/fixture key; preserved verbatim.
 * Plunge: plunge / plunge_low / plunge_high (physical, char_skill_attack).
 *
 * FeatureDamageChargedAimed only overrides crit rate when settings.enemy_weak_shot
 * is set (off in the canonical build) → behaves as a plain charged attack here.
 * FeatureDamageCharged forces damageType:'charged' + allowInfusion; modelled as
 * damageType:"charged". Its extra dmg_charged_enemy bonus is 0 in the fixed build
 * (not in STAT_BLOCK), matching the established charged-attack pattern (cf. neuvillette).
 *
 * Skill (Rebound Hydrotherapy):
 *   sigewinne_bolstering_bubblebalm_dmg — hydro, HP-scaled (scaling:'hp*', s2.p1)
 *   surging_blade_dmg                   — hydro, HP-scaled (s2.p7). raw flags
 *     cannotReact; that only suppresses reaction toggling and is irrelevant to the
 *     non-reacted damage triple the fixture asserts → no field needed.
 *
 * Burst (Super Saturated Syringing):
 *   burst_dmg — hydro, HP-scaled (scaling:'hp*', s3.p1)
 *
 * Non-damage outputs modelled (P3.5.3): the two skill heals
 * (sigewinne_bolstering_bubblebalm_heal — s2.p2 % + s2.p3 flat; sigewinne_bounce_end_heal —
 * s2.p4 % only) and other.sigewinne_hp_buff (A1/C1 DMG she grants, driven by her OWN
 * hp_total above 30000: min(buff%×max(hp_total−30000,0), cap) — buff% + cap BOTH level-indexed
 * by sigewinne_buff_level: A1 tier min(0.08×…, 2800), C1 tier (buff_level 2) min(0.1×…, 3500)).
 *
 * Conditions/post-effects OFF at the canonical solo-C0 build (omitted):
 *   - A1 "Requires Appropriate Rest" — a ConditionBoolean toggle granting
 *     dmg_hydro:8; boolean toggles are OFF at baseline → NOT folded into baseStats.
 *   - A1 sigewinne_hp_buff PostEffectStatsHP — party-HP-total-gated (exceed 30000,
 *     levelSetting sigewinne_buff_level); no party HP set in the solo build → off.
 *   - A4 "Detailed Diagnosis" — ConditionNumber healing-bonus, toggle off + healing
 *     (irrelevant to damage).
 *   - All constellations (C0 build): C1/C2/C6 HP-buff/shield/crit, etc.
 *
 * Reaction features (electrocharged / rupture / shatter) are emitted generically
 * by the engine from the hydro element — not declared on the character
 * (cf. neuvillette, same set: hydro → rupture + universal electrocharged/shatter).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Sigewinne.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Damage/Charged.js (damageType:'charged', allowInfusion)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Damage/Charged/Aimed.js (crit override only on enemy_weak_shot)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Sigewinne)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Sigewinne)
 */

import type { CharMultiplier, CharPostEffect, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Sigewinne as SigewinneStatTable } from "../generated/charTables.js";
import { Sigewinne as SigewinneTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1")                          return SigewinneTalents.s1.p1;
      if (name === "normal_hit_2")                          return SigewinneTalents.s1.p2;
      if (name === "normal_hit_3")                          return SigewinneTalents.s1.p3;
      if (name === "aimed")                                 return SigewinneTalents.s1.p7;
      if (name === "charged_aimed")                         return SigewinneTalents.s1.p8;
      if (name === "sigewinnne_mini_stration_bubble_dmg")   return SigewinneTalents.s1.p9;
      if (name === "plunge")                                return SigewinneTalents.s1.p4;
      if (name === "plunge_low")                            return SigewinneTalents.s1.p5;
      if (name === "plunge_high")                           return SigewinneTalents.s1.p6;
    }
    if (talent === "skill") {
      if (name === "sigewinne_bolstering_bubblebalm_dmg")   return SigewinneTalents.s2.p1;
      if (name === "sigewinne_bolstering_bubblebalm_heal_percent") return SigewinneTalents.s2.p2;
      if (name === "sigewinne_bolstering_bubblebalm_heal_flat")    return SigewinneTalents.s2.p3;
      if (name === "sigewinne_bounce_end_heal")             return SigewinneTalents.s2.p4;
      if (name === "surging_blade_dmg")                     return SigewinneTalents.s2.p7;
    }
    if (talent === "burst") {
      if (name === "burst_dmg")                             return SigewinneTalents.s3.p1;
    }
    throw new Error(`sigewinne talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// A1/C1 "Requires Appropriate Rest" buff tables — shared by the SELF hp-buff readout
// (other.sigewinne_hp_buff) and the teammate skill-DMG multiplier (partyData). Both are
// (buff% × max(HP − 30000, 0)) capped, indexed by `sigewinne_buff_level` (1 = A1 tier,
// 2 = C1 tier, set by C1). raw Sigewinne.js:124-131,278-289,526-538.
// ---------------------------------------------------------------------------

// values — her `new ValueTable([A1DmgBonus / 10, C1DmgBonus / 10])` = [8, 10], 1-indexed by
// `sigewinne_buff_level`. Replicates ValueTable.getValue exactly (raw/.../classes/ValueTable.js):
// level <= 0 → 0; level > length → last; else values[level-1]. baseDamageTerm reads
// `leveling: "sigewinne_buff_level"` from settings (not a char-skill slot → the
// `settings[leveling]` path, defaulting to 1) and calls getValue on it.
const SIGEWINNE_BUFF_VALUES = [8, 10] as const; // [A1DmgBonus/10, C1DmgBonus/10]
const sigewinneBuffValues = {
  getValue: (level: number): number =>
    level > 0 ? SIGEWINNE_BUFF_VALUES[Math.min(level, SIGEWINNE_BUFF_VALUES.length) - 1]! : 0,
};
// caps — her `new ValueTable([A1DmgBonusMax, C1DmgBonusMax])` = [2800, 3500], 1-indexed by the
// SAME `sigewinne_buff_level` (her capValue.getValue(getLevel), Multiplier.js:233-237 /
// PostEffect statCap). Fed to the capValueFromTable field (level-indexed cap, buff_level 1→2800,
// 2→3500).
const SIGEWINNE_BUFF_CAPS = [2800, 3500] as const; // [A1DmgBonusMax, C1DmgBonusMax]

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical bow combo) ---
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
  // --- Aimed shots (charged) ---
  // raw: FeatureDamageChargedAimed aimed (physical, ATK-scaled, damageType charged)
  {
    name: "aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // raw: FeatureDamageChargedAimed charged_aimed (hydro, ATK-scaled, charged)
  {
    name: "charged_aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_aimed") }],
  },
  // raw: FeatureDamageCharged sigewinnne_mini_stration_bubble_dmg (hydro, ATK, charged)
  {
    name: "sigewinnne_mini_stration_bubble_dmg",
    category: "attack",
    damageType: "charged",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.sigewinnne_mini_stration_bubble_dmg") }],
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
  // --- Skill: Rebound Hydrotherapy (hydro, HP-scaled) ---
  // raw: FeatureDamageSkill sigewinne_bolstering_bubblebalm_dmg (hydro, scaling 'hp*')
  {
    name: "sigewinne_bolstering_bubblebalm_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.sigewinne_bolstering_bubblebalm_dmg") }],
  },
  // raw: FeatureDamageSkill surging_blade_dmg (hydro, scaling 'hp*', cannotReact)
  {
    name: "surging_blade_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.surging_blade_dmg") }],
  },
  // --- Burst: Super Saturated Syringing (hydro, HP-scaled) ---
  // raw: FeatureDamageBurst burst_dmg (hydro, scaling 'hp*')
  {
    name: "burst_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // --- Skill heals (FeatureHeal, HP-scaled) ---
  // sigewinne_bolstering_bubblebalm_heal: party heal (noSelfHeal), getList = [s2.p2 (%), s2.p3 (flat)].
  // raw/genshin_calc_pub/src/js/db/Char/Sigewinne.js:74-80,235-246. No healing-bonus passive (HP% ascension).
  {
    name: "sigewinne_bolstering_bubblebalm_heal",
    category: "skill",
    output: { kind: "heal", partyHeal: true },
    multipliers: [
      { scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.sigewinne_bolstering_bubblebalm_heal_percent"), flatValues: talents.get("skill.sigewinne_bolstering_bubblebalm_heal_flat") },
    ],
  },
  // sigewinne_bounce_end_heal: end-of-bounce heal, % of HP only (s2.p4). raw/.../Char/Sigewinne.js:247-256.
  {
    name: "sigewinne_bounce_end_heal",
    category: "skill",
    output: { kind: "heal" },
    multipliers: [
      { scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.sigewinne_bounce_end_heal") },
    ],
  },
  // --- A1/C1 "Requires Appropriate Rest" static readout: other.sigewinne_hp_buff = HP-above-30000 → DMG (capped) ---
  // FeaturePostEffectValue(PostEffectStatsHP, exceed=A1MinHP=30000, percent=StatTable('',[A1DmgBonus/1000=0.08,
  // C1DmgBonus/1000=0.1]), statCap=ValueTable([A1DmgBonusMax=2800, C1DmgBonusMax=3500]), levelSetting
  // sigewinne_buff_level). '' name not isPercent + fmt="" → displayed = min(0.08×max(hp_total−30000,0), 2800) at the
  // A1 tier (buff_level 1) and min(0.1×…, 3500) at the C1 tier (buff_level 2, set by C1). Both the value AND the cap
  // are level-indexed by sigewinne_buff_level: values = SIGEWINNE_BUFF_VALUES[8,10]×… via `leveling`; cap =
  // capValueFromTable(SIGEWINNE_BUFF_CAPS[2800,3500]). exceedStatValue = 30000. At C0 (buff_level absent → level 1)
  // the value is 8% / cap 2800 (byte-identical to the prior A1-only port). raw/.../Char/Sigewinne.js:124-131,278-289.
  {
    name: "sigewinne_hp_buff",
    category: "other",
    output: { kind: "static" },
    multipliers: [
      {
        scaling: "hp",
        leveling: "sigewinne_buff_level",
        values: sigewinneBuffValues,
        exceedStatValue: 30000,
        capValueFromTable: { table: SIGEWINNE_BUFF_CAPS, levelSetting: "sigewinne_buff_level" },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Can the Happiest of Spirits Understand Anxiety": ConditionStatic with
//   text_value_hp/dmg/max (display-only stats) + settings:{sigewinne_buff_level:2}.
//   The buff_level setting controls the PostEffectStatsHP tier (A1DmgBonus vs C1DmgBonus)
//   but the PostEffect is a partyData multiplier gated on party.sigewinne_requires_
//   appropriate_rest toggle → OFF in canonical fixture. Inert for the damage triple.
//   Ported for correctness (setting is real, display stats skipped).
// C2 "Can the Most Merciful of Spirits Defeat Its Foes": ConditionStatic text_percent
//   (display) + ConditionBoolean enemy_res_hydro (toggle) → SKIP.
// C3 "Can the Loveliest of Spirits Keep Decay at Bay": +3 Elemental Skill levels.
//   Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
// C4: ConditionStatic no real stats → SKIP.
// C5 "Can the Most Radiant of Spirits Pray for Me": +3 Elemental Burst levels.
//   Raw cons[4]: Condition{ settings:{ char_skill_burst_bonus:3 } }
// C6: ConditionBoolean (crit_rate/crit_dmg toggle) → SKIP.
// Sources: raw/genshin_calc_pub/src/js/db/Char/Sigewinne.js:388-460

const constellationConditions: readonly Condition[] = [
  // SELF "Requires Appropriate Rest" (A1) — +8% Hydro DMG while Sigewinne's HP is full (modelled as
  // the toggle, the engine gate is only ascension), lifting every Sigewinne hydro feature (skill/
  // burst + reaction.rupture/electrocharged). ConditionBoolean ascension passive (rep at A6 →
  // modelled ungated, the toggle is the gate). The port modelled the party.* HP→skill-dmg
  // multiplier but SKIPPED this self dmg_hydro toggle → golden-blind SKIP. A1HydroDmg = 8.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Sigewinne.js:317-330 (char.conditions[0], info.ascension 1).
  { type: "boolean", name: "sigewinne_requires_appropriate_rest", stats: { dmg_hydro: 8 } },
  // C1 "Can the Happiest of Spirits Understand Anxiety" — sigewinne_buff_level→2.
  // Upgrades PostEffectStatsHP from A1 tier to C1 tier; inert in damage fixture
  // (partyData toggle OFF). Ported for engine fidelity.
  { type: "constellation", constellation: 1, settings: { sigewinne_buff_level: 2 } },
  // C3 "Can the Loveliest of Spirits Keep Decay at Bay" — +3 Elemental Skill.
  // Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 "Can the Most Radiant of Spirits Pray for Me" — +3 Elemental Burst.
  // Raw cons[4]: Condition{ settings:{ char_skill_burst_bonus:3 } }
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// partyData — teammate kit buff (P3.5.2 engine-extension pass).
// Source: raw/genshin_calc_pub/src/js/db/Char/Sigewinne.js:468-540
// "Requires Appropriate Rest" (A1): a Skill-DMG bonus added to each SKILL hit of
// the recipient, scaled off the teammate's max HP ABOVE a 30000 threshold —
// `(buff% × max(HP_total − 30000, 0))`, capped. The threshold subtraction rides the
// new FeatureMultiplierEntry.exceedStatValue field (her FeatureMultiplier
// .getTreeStatValue → `CMax([CSubtract([HP, 30000]), 0])`, Multiplier.js:281-301).
// Conditions ported = ONLY the HP-total lift the multiplier `scaling`-reads + the
// gate it checks; constellation/passive booleans (C1 buff-level, C2 res-shred, A4/C6)
// are deferred to the P3.5.2 variant-rep pass.
//
// The cap is a buff_level-indexed ValueTable([A1DmgBonusMax, C1DmgBonusMax]) = [2800, 3500]
// (the C1 tier raises both the buff% AND its cap). Ported via the level-indexed
// `capValueFromTable` field (SIGEWINNE_BUFF_CAPS), so buff_level 1 → 2800 and 2 → 3500 are BOTH
// EXACT (the prior port deferred the C1 cap tier to a constant 2800; now un-deferred).
// ---------------------------------------------------------------------------

// "Requires Appropriate Rest": (buff% × max(HP_total − 30000, 0)) added to each SKILL hit
// of the recipient, capped by SIGEWINNE_BUFF_CAPS[buff_level]. raw Sigewinne.js:526-538.
//   scaling: 'sigewinne_hp_total'  (the lifted teammate max HP, read VERBATIM via cStat)
//   exceedStatValue: A1MinHP (30000) → the scaling factor is max(HP − 30000, 0)
//   leveling: 'sigewinne_buff_level' → values.getValue (8% at buff_level 1, 10% at 2)
//   capValueFromTable: [2800, 3500] by sigewinne_buff_level (1 → 2800, 2 → 3500)
//   target: { damageTypes: ['skill'] }  (load-bearing — non-skill hits stay unbuffed)
//   condition: ConditionBoolean('party.sigewinne_requires_appropriate_rest') master gate
const sigewinnePartyMultipliers: readonly CharMultiplier[] = [
  {
    source: "sigewinne",
    scaling: "sigewinne_hp_total",
    leveling: "sigewinne_buff_level",
    values: sigewinneBuffValues,
    capValueFromTable: { table: SIGEWINNE_BUFF_CAPS, levelSetting: "sigewinne_buff_level" },
    exceedStatValue: 30000, // A1MinHP
    target: { damageTypes: ["skill"] },
    condition: { type: "boolean", name: "party.sigewinne_requires_appropriate_rest" },
  } satisfies CharMultiplier,
];

// ---------------------------------------------------------------------------
// SELF C6 "Would the Most Radiant of Spirits Pray for Me" — own max-HP → crit, gated by the C6 toggle
// sigewinne_would_the_most_radiant_of_spirits_pray_for_me AND constellation 6. Two PostEffectStatsHP
// (raw Sigewinne.js:371-386). These emit as RAW percents (/100 at emit), so `ratio` is her un-/100'd
// StatTable value and `capValue` is the raw cap (her statCap; the /100 of both happens once at emit):
//   crit_rate ratio = C6CritRate/10 = 0.04 (cap C6CritRateMax 20)
//   crit_dmg  ratio = C6CritDmgMax/10 = 11 (cap C6CritDmgMax 110)
// FAITHFUL asymmetry: her crit_dmg StatTable keys off C6CritDmgMax/10, NOT C6CritDmg/10 as crit_rate
// does off C6CritRate/10 (Sigewinne.js:372,380). Both bonuses cap for any realistic HP (her cap is
// reached at HP≥500 / HP≥10), so the net crit gain is ~+20% rate / +110% DMG. The SELF mirror of the
// crit battery; was golden-blind SKIPPED. (The A1/C1 HP→DMG level-indexed cap is now ported via the
// capValueFromTable field — see the sigewinne_hp_buff readout + the partyData multiplier above.)
// ---------------------------------------------------------------------------
const sigewinneSelfPostEffects: readonly CharPostEffect[] = [
  {
    fromStat: "hp",
    toStat: "crit_rate",
    ratio: 0.04, // C6CritRate(0.4)/10 (raw percent per HP; /100 at emit)
    capValue: 20, // C6CritRateMax (raw percent)
    conditions: [
      { type: "boolean", name: "sigewinne_would_the_most_radiant_of_spirits_pray_for_me" },
      { type: "constellation", constellation: 6 },
    ],
  },
  {
    fromStat: "hp",
    toStat: "crit_dmg",
    ratio: 11, // C6CritDmgMax(110)/10 (raw percent per HP; /100 at emit)
    capValue: 110, // C6CritDmgMax (raw percent)
    conditions: [
      { type: "boolean", name: "sigewinne_would_the_most_radiant_of_spirits_pray_for_me" },
      { type: "constellation", constellation: 6 },
    ],
  },
];

export const sigewinne: DbObjectChar = {
  name: "sigewinne",
  gameId: 10000095,
  rarity: 5,
  element: "hydro",
  weapon: "bow",
  origin: "fontaine",
  statTable: SigewinneStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  postEffects: sigewinneSelfPostEffects,
  partyData: {
    // Descriptive metadata mirroring her loadStats (the teammate input contract).
    // raw Sigewinne.js:469-471 → stats:['hp_total'].
    loadStats: {
      stats: ["hp_total"],
    },
    conditions: [
      // Lift Sigewinne's hp_total into the recipient bag as `sigewinne_hp_total` (a
      // RAW_BAG_SCALING key) so the multiplier's `scaling` reads it verbatim via cStat.
      // raw: ConditionNumber({name:'sigewinne_hp_total', partyStat:'hp_total', max:150000}).
      { type: "number", name: "sigewinne_hp_total", max: 150000 },
      // Master toggle the multiplier's gate checks. Carries no stats of its own (its
      // display text_value_* are skipped). raw: ConditionBoolean({name:
      // 'party.sigewinne_requires_appropriate_rest'}), Sigewinne.js:482-494.
      { type: "boolean", name: "party.sigewinne_requires_appropriate_rest" },
    ],
    multipliers: sigewinnePartyMultipliers,
  },
};
