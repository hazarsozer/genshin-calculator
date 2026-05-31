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
 * Non-damage fixture features (empty damageType → not damage-triple asserted, not
 * modelled): the two skill heals (sigewinne_bolstering_bubblebalm_heal,
 * sigewinne_bounce_end_heal) and other.sigewinne_hp_buff (A1 party-HP→hydro-DMG
 * display value). cf. neuvillette: heals not declared on the character.
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

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
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
      if (name === "surging_blade_dmg")                     return SigewinneTalents.s2.p7;
    }
    if (talent === "burst") {
      if (name === "burst_dmg")                             return SigewinneTalents.s3.p1;
    }
    throw new Error(`sigewinne talents: unknown path '${path}'`);
  },
};

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
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // raw: FeatureDamageChargedAimed charged_aimed (hydro, ATK-scaled, charged)
  {
    name: "charged_aimed",
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
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

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
};
