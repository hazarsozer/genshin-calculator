/**
 * Yumemizuki Mizuki — anemo catalyst (Dreamdrifter stance swirl support).
 *
 * 3-hit normal combo (anemo), anemo charged hit, plunge/low/high (anemo).
 * Skill "Aisa Utamakura Pilgrimage" (anemo):
 *   skill_dmg                     — char_skill_elemental, s2.p4
 *   mizuki_continuous_attack_dmg  — char_skill_elemental, s2.p1
 * Burst "Anraku Secret Spring Therapy" (anemo):
 *   burst_dmg                     — char_skill_burst, s3.p1
 *   mizuki_munen_shockwave_dmg    — char_skill_burst, s3.p2
 *
 * All anemo transformative reactions (swirl×4, burning, superconduct, overloaded,
 * rupture, burgeon, hyperbloom, + universal electrocharged/shatter) are emitted
 * generically from element:'anemo' by the loader — not declared here.
 *
 * NON-DAMAGE OUTPUTS modelled (P3.5.3 — all EM-scaled):
 *   - mizuki_snack_other_heal: FeatureHeal mastery*, getList = [s3.p3 (%), s3.p7 (flat)].
 *   - mizuki_snack_self_heal: 2× the snack heal (her scalingMultiplier:2 doubles the WHOLE
 *     List → both % and flat ×2; fixture self = 2×other exactly).
 *   - mizuki_swirl_bonus: A-passive Dreamdrifter swirl-DMG% from EM — PostEffectStatsMastery,
 *     percent=getAlias('skill.mizuki_em_buff'→dmg_reaction_swirl). em_buff(s2.p2)=0.45 per EM →
 *     0.45×mastery_total (≈76.59). The mizuki_dreamdrifter toggle gates APPLICATION not the readout.
 *   - mizuki_elemental_bonus: C2 static readout, EM → pyro/hydro/electro/cryo DMG% — 0.04×mastery_total,
 *     gated ConditionConstellation(2) (feature-level; the mizuki_dreamdrifter toggle is ignored per
 *     the same FeaturePostEffectValue precedent as mizuki_swirl_bonus).
 *
 * STANCE / PASSIVES (all conditional → OFF in the fixed solo C0 build):
 *   - "Dreamdrifter" (ConditionBoolean) toggles the swirl-EM buff + C1/C2/C6 riders.
 *   - A4 "Thoughts by Day, Bring Dreams by Night" (+100 EM) is a ConditionBoolean
 *     gated by ConditionAscensionChar(4) — OFF at settings={}. Confirmed by the
 *     fixture EM: stats.mastery=170.2 = mastery ascension @A6 (115.2) + sample
 *     block mastery_base (55); the +100 A4 is NOT folded in. So no baseStats.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Mizuki.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Mizuki)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Mizuki)
 */

import type { CharPostEffect, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Mizuki as MizukiStatTable } from "../generated/charTables.js";
import { Mizuki as MizukiTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return MizukiTalents.s1.p1;
      if (name === "normal_hit_2") return MizukiTalents.s1.p2;
      if (name === "normal_hit_3") return MizukiTalents.s1.p3;
      if (name === "charged_hit")  return MizukiTalents.s1.p4;
      if (name === "plunge")       return MizukiTalents.s1.p6;
      if (name === "plunge_low")   return MizukiTalents.s1.p7;
      if (name === "plunge_high")  return MizukiTalents.s1.p8;
    }
    if (talent === "skill") {
      if (name === "skill_dmg")                     return MizukiTalents.s2.p4;
      if (name === "mizuki_continuous_attack_dmg")  return MizukiTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg")                  return MizukiTalents.s3.p1;
      if (name === "mizuki_munen_shockwave_dmg") return MizukiTalents.s3.p2;
      if (name === "mizuki_snack_heal_percent")  return MizukiTalents.s3.p3;
      if (name === "mizuki_snack_heal_flat")     return MizukiTalents.s3.p7;
    }
    throw new Error(`yumemizuki_mizuki talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (anemo catalyst — all anemo) ---
  // raw: FeatureDamageNormal × 3 (element:'anemo', Mizuki.js)
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
  // --- Charged attack (anemo catalyst) ---
  // raw: FeatureDamageCharged charged_hit (element:'anemo')
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (anemo catalyst) ---
  // raw: FeatureDamagePlungeCollision plunge; FeatureDamagePlungeShockWave low/high
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Aisa Utamakura Pilgrimage (anemo) ---
  // raw: FeatureDamageSkill skill_dmg (s2.p4) + mizuki_continuous_attack_dmg (s2.p1)
  {
    name: "skill_dmg",
    category: "skill",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  {
    name: "mizuki_continuous_attack_dmg",
    category: "skill",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.mizuki_continuous_attack_dmg") }],
  },
  // --- Burst: Anraku Secret Spring Therapy (anemo) ---
  // raw: FeatureDamageBurst burst_dmg (s3.p1) + mizuki_munen_shockwave_dmg (s3.p2)
  {
    name: "burst_dmg",
    category: "burst",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  {
    name: "mizuki_munen_shockwave_dmg",
    category: "burst",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.mizuki_munen_shockwave_dmg") }],
  },
  // --- Heals (FeatureHeal, EM-scaled): Snacks party heal + 2× self heal ---
  // burst.mizuki_snack_other_heal: scaling mastery*, getList('burst.mizuki_snack_heal') = [s3.p3 (%), s3.p7 (flat)].
  // base = (s3.p3/100)×mastery_total + s3.p7; no healing-bonus passive. raw/.../Char/Mizuki.js:101-106,261-273.
  {
    name: "mizuki_snack_other_heal",
    category: "burst",
    output: { kind: "heal", partyHeal: true },
    multipliers: [
      { scaling: "mastery", leveling: "char_skill_burst", values: talents.get("burst.mizuki_snack_heal_percent"), flatValues: talents.get("burst.mizuki_snack_heal_flat") },
    ],
  },
  // burst.mizuki_snack_self_heal: her scalingMultiplier:2 (scalingSource mizuki_selfheal) doubles the WHOLE List
  // → both % and flat ×2 (fixture self = 2×other exactly). raw/.../Char/Mizuki.js:274-285.
  {
    name: "mizuki_snack_self_heal",
    category: "burst",
    output: { kind: "heal" },
    multipliers: [
      {
        scaling: "mastery",
        leveling: "char_skill_burst",
        values: { getValue: (lv: number) => MizukiTalents.s3.p3.getValue(lv) * 2 },
        flatValues: { getValue: (lv: number) => MizukiTalents.s3.p7.getValue(lv) * 2 },
      },
    ],
  },
  // --- A-passive static readout: skill.mizuki_swirl_bonus = EM → Swirl DMG% (Dreamdrifter) ---
  // buffSwirl = PostEffectStatsMastery, levelSetting char_skill_elemental, percent=getAlias('skill.mizuki_em_buff'
  // → 'dmg_reaction_swirl'). 'dmg_reaction_swirl' isPercent → /100 and the format ×100 CANCEL → displayed =
  // em_buff × mastery_total. em_buff (s2.p2) = 0.45 per EM at skill lv10 (level-scaled) → values = em_buff×100 (=45
  // at lv10) → (values/100)×mastery = 0.45×170.2 = 76.59. dreamdrifter toggle gates APPLICATION not the readout.
  // raw/genshin_calc_pub/src/js/db/Char/Mizuki.js:129-135,285-291.
  {
    name: "mizuki_swirl_bonus",
    category: "skill",
    output: { kind: "static" },
    multipliers: [
      { scaling: "mastery", leveling: "char_skill_elemental", values: { getValue: (lv: number) => MizukiTalents.s2.p2.getValue(lv) * 100 } },
    ],
  },
  // --- C2 static readout: other.mizuki_elemental_bonus = EM → pyro/hydro/electro/cryo DMG% ---
  // buffElemental = PostEffectStatsMastery, percent=[StatTable('dmg_pyro'|'dmg_hydro'|'dmg_electro'|
  // 'dmg_cryo', [C2ElemBonus/100=0.04])], gated conditions:[mizuki_dreamdrifter, ConditionConstellation(2)]
  // AND feature condition:ConditionConstellation(2) (Mizuki.js:137-147,293-297). 'dmg_<element>' isPercent
  // (Stats.js `dmg_` prefix) → her /100 and format:'percent' ×100 CANCEL → displayed = 0.04×mastery_total.
  // values = C2ElemBonus (=4) folds the percent-format ×100 in, same convention as mizuki_swirl_bonus /
  // kazuha_crimson_momiji. No levelSetting on buffElemental (a plain constant, not talent-leveled) →
  // leveling:"" (level is irrelevant since values ignores it). Modelled WITHOUT the mizuki_dreamdrifter
  // toggle (FeaturePostEffectValue ignores the postEffect's own conditions — the Hu Tao atk-bonus /
  // kazuha_crimson_momiji precedent) but WITH the feature-level ConditionConstellation(2) gate (both the
  // postEffect's bonusCondition-equivalent AND the FeaturePostEffectValue's own `condition` are C2 here).
  {
    name: "mizuki_elemental_bonus",
    category: "other",
    output: { kind: "static" },
    condition: { type: "constellation", constellation: 2 },
    multipliers: [
      { scaling: "mastery", leveling: "", values: { getValue: () => 4 } },
    ],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Post-effects (Dreamdrifter EM → Swirl DMG% — APPLIED buff)
// ---------------------------------------------------------------------------
// Her A-passive "buffSwirl" (Mizuki.js:129-135) is a PostEffectStatsMastery that
// writes dmg_reaction_swirl = mastery_total × em_buff, gated by the dreamdrifter
// toggle. em_buff is the s2.p2 talent table (getAlias('skill.mizuki_em_buff',
// 'dmg_reaction_swirl'), Mizuki.js:80) — level-scaled by char_skill_elemental
// (so C3's +3 skill levels lift it: 0.45 @lv10 → 0.54 @lv13). PostEffectStatsMastery
// derives its base from getTotal('mastery') (PostEffect/Stats/Mastery.js). The
// mizuki_swirl_bonus FEATURE above is the display READOUT of this same value; this
// post-effect is its APPLICATION (the toggle gates application, not the readout).
// `multi:1` → ratio = s2.p2.getValue(level); bonus = mastery_total × ratio lands as
// a RAW percent in the bag (e.g. 170.2 × 0.54 = 91.908), then /100'd by buildStats'
// REACTION_BONUS_PERCENT_KEYS emit loop (dmg_reaction_swirl is listed there) → the
// 0.91908 fraction the 4 swirl reaction defs read. Base-inert: gated on
// mizuki_dreamdrifter (OFF in every golden + the constellations fixture).
// raw/genshin_calc_pub/src/js/db/Char/Mizuki.js:80,129-135;
// raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/Mastery.js.
const postEffects: readonly CharPostEffect[] = [
  {
    fromStat: "mastery",
    toStat: "dmg_reaction_swirl",
    ratioFromTalent: { table: MizukiTalents.s2.p2, levelSetting: "char_skill_elemental", multi: 1 },
    conditions: [{ type: "boolean", name: "mizuki_dreamdrifter" }],
  },
  // C1 "In Mist-Like Waters" — SELF flat additive swirl bonus, 11.00 × EM
  // (C1SwirlBonus=1100, values.getValue()/100 = 11.00; her FeatureMultiplier
  // scaling:'mastery*' target:{tags:['swirl'], options:['reaction_flat']}).
  // Writes the raw bag `reaction_flat_swirl` key (buildStats' REACTION_FLAT_KEYS
  // pass-through), read by cTransformativeDamage's reactionFlatKeys on all 4
  // swirl_<element> features via reactionFlatOverrides below. Gated C1 AND
  // dreamdrifter AND the C1 toggle itself (her ConditionAnd of all three).
  // The party-scope C1 variant (Mizuki.js:507-514) is teammate-buff scope,
  // deferred (see partyData comment below).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Mizuki.js:328-343.
  {
    fromStat: "mastery",
    toStat: "reaction_flat_swirl",
    ratio: 11,
    conditions: [
      { type: "constellation", constellation: 1 },
      { type: "boolean", name: "mizuki_dreamdrifter" },
      { type: "boolean", name: "mizuki_in_mist_like_waters" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "In Mist-Like Waters" — the ConditionBoolean toggle itself carries only a
//   display-only `text_percent_dmg` stat (SKIPPED, matches house convention for
//   non-real stats). The REAL effect is a separate FeatureMultiplier in her
//   `multipliers:` list (Mizuki.js:328-343, target tags:['swirl']
//   options:['reaction_flat']) — a genuine gap, now ported below as a
//   `reaction_flat_swirl` post-effect + `reactionFlatOverrides` on all 4
//   swirl_<element> reaction features (11.00 × EM, self-scope only).
// C2: ConditionStatic with text_percent_dmg only (display-only, no real stat) → SKIP.
//   Raw: (C2ElemBonus/100 = 0.04 is a fractional dmg multiplier but text_percent_dmg only)
// C3 "Boundless Blossoming" — +3 Elemental Skill talent levels.
//   raw/genshin_calc_pub/src/js/db/Char/Mizuki.js:376-383 (constellation[2]).
// C4: ConditionStatic display-only → SKIP.
// C5 "Sleep Awaits" — +3 Burst talent levels.
//   raw/genshin_calc_pub/src/js/db/Char/Mizuki.js:393-400 (constellation[4]).
// C6 "The Heart Lingers Long" — ConditionStatic{crit_rate_swirl:30, crit_dmg_swirl:100}
//   gated by a ConditionBoolean(dreamdrifter) subCondition (consts C6SwirlCritRate=30 /
//   C6SwirlCritDmg=100, Mizuki.js:126-127; entry Mizuki.js:402-416). Fires only at
//   char_constellation>=6 AND mizuki_dreamdrifter=true → both crit keys feed all 4 swirl
//   instances. Modeled as a `static` condition gated on an `and` of the C6 constellation
//   and the dreamdrifter toggle. (Her party-path variant Mizuki.js:491-501 is partyData
//   scope — not this task.)

const constellationConditions: readonly Condition[] = [
  // SELF A4 "Thoughts by Day, Bring Dreams by Night" (raw conditions, Mizuki.js:314-324) — +100 EM
  // (A4Mastery), a ConditionBoolean gated only by ConditionAscensionChar({ascension:4}) (auto-true at
  // A6 → the toggle is the gate). Plain mastery stat (proven mirror) — lifts every Mizuki reaction
  // output (swirl + transformative, all EM-scaled). Was golden-blind SKIPPED (the +100 was noted as
  // "NOT folded in" at the C0 baseline).
  { type: "boolean", name: "mizuki_thoughts_by_day_bring_dreams_by_night", stats: { mastery: 100 } },
  // C3 — char_skill_elemental_bonus +3 (skill talent level up).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 — char_skill_burst_bonus +3 (burst talent level up).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
  // C6 — swirl crit (raw Mizuki.js:402-416, consts :126-127), gated C6 AND dreamdrifter.
  {
    type: "static",
    stats: { crit_rate_swirl: 30, crit_dmg_swirl: 100 },
    condition: {
      type: "and",
      items: [
        { type: "constellation", constellation: 6 },
        { type: "boolean", name: "mizuki_dreamdrifter" },
      ],
    },
  },
];

// partyData (Bucket C) DEFERRED — out of P3.5.2 DAMAGE scope (not an engine-
// extension case): her teammate buff is a swirl-reaction bonus, its multiplier
// targeting tags:['swirl'] options:['reaction_flat'] and emitting dmg_reaction_swirl
// (raw Mizuki.js partyData), plus party_burst_energy_cost (energy). Transformative-
// reaction outputs aren't a compared damage output here (cf. Baizhu/Nilou/Ifa), and
// energy is its own sub-project → transformative-reaction sub-project, not this arc.
export const yumemizukiMizuki: DbObjectChar = {
  name: "yumemizuki_mizuki",
  gameId: 10000109,
  rarity: 5,
  element: "anemo",
  weapon: "catalyst",
  origin: "inazuma",
  statTable: MizukiStatTable,
  talents,
  features,
  multipliers: [],
  postEffects,
  conditions: constellationConditions,
  // C1's flat swirl bonus applies to all 4 swirl_<element> outputs uniformly
  // (her FeatureMultiplier target has no per-element split — Mizuki.js:328-343).
  reactionFlatOverrides: {
    swirl_pyro: ["reaction_flat_swirl"],
    swirl_hydro: ["reaction_flat_swirl"],
    swirl_electro: ["reaction_flat_swirl"],
    swirl_cryo: ["reaction_flat_swirl"],
  },
};
