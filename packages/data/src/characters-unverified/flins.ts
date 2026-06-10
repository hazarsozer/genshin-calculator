/**
 * Flins — STAGED past-v5.8 port (lean C0, GCSim-gated). NOT in characters/ — staging is invisible
 * to the filesystem-glob vitest suites; promotion is deferred (see the POC design spec).
 *
 * Gated (GCSim fp-epsilon): base normals + charge + plunge (physical), electro skill-stance normals +
 * charge, Northland Spearstorm, Initial burst, AND the DirectLunarCharged burst hits (Mid/Final/
 * Thunderous Symphony — sub-project A, lunardirect variant). Still quarantined: the Lunar-Charged
 * reaction, A1/A4, constellations, all moonsign≥2 branches (tools/port/FLINS-QUARANTINE.md).
 * Numbers: generated/flins.gen.ts (Amber, pinned). Kit ref: /tmp/gcsim/internal/characters/flins/.
 * Talent param keys verified by value vs flins_gen.go:
 *   s1: p1..p5 = N1..N5, p6 = charge, p10 = high plunge (p8/p9 = collision/low plunge).
 *   s2: p1..p5 = skill-stance N1..N5, p6 = skill charge, p7 = Northland Spearstorm.
 *   s3: p1 = Initial burst, p2/p3 = Mid/Final, p6 = Symphony (p7 = SymphonyExtra, moonsign≥2 → C).
 */
import type { CharPostEffect, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { FlinsStatTable, FlinsTalents } from "../generated/flins.gen.js";

// ── Lunar-Charged shared keys (same convention as the Ineffa precedent) ──
// DirectLunarCharged hits route through compileReaction's `lunardirect` variant:
//   base(talent%×ATK) × (1 + lunarcharged_multi) × (1 + 6·EM/(EM+2000) + Σreaction) × 3 × res
// — exactly GCSim's calcDirectLunar (×3 + the lunar EM factor, NO DMG%). The DEF-ignore is implicit:
// lunardirect omits the defence factor (×1), matching GCSim's IgnoreDefPercent:1.
const LUNAR_DIRECT_AMPLIFY = 3; // ChargedLike flat amplifying factor (×3)
const LUNAR_SCALING_KEYS = ["lunarcharged_multi"] as const; // → (1 + lunarcharged_multi) = (1 + BaseDmgBonus)
const LUNAR_REACTION_BONUS_KEYS = ["dmg_reaction_lunarcharged"] as const; // A1 etc. (0 at C0/moonsign 1)
const LUNAR_CRIT_RATE_KEYS = ["crit_rate_total"] as const;
const LUNAR_CRIT_DMG_KEYS = ["crit_dmg_total"] as const;
// C6 "…": +0.35 elevation (×1.35) on every Lunar hit at cons≥6 (cons.go c6Init; the +0.1→0.45 at
// moonsign≥2 → C-ε). Read raw by cStat via the lunar variants' elevationKeys. Set by the C6 condition.
const LUNAR_ELEVATION_KEYS = ["lunar_elevation"] as const;

// "every 100 ATK raises Lunar-Charged Base DMG by 0.7%, up to 14%" (asc.go:74 lunarchargeInit) modeled
// as her PostEffectStatsAtk: lunarcharged_multi = min(0.00007 × atk_total, 0.14). Unconditional (base
// talent, NOT ascension-gated). Ratio 0.7/100/100 = 0.00007 (percent then isPercent fold); cap 14/100.
const lunarMultiFromAtk: CharPostEffect = {
  priority: 1,
  fromStat: "atk",
  toStat: "lunarcharged_multi",
  ratio: 0.00007,
  capValue: 0.14,
};

// A4 "Lunar Reflection": self EM buff. Below C4: min(0.08 × atk_total, 160). GCSim asc.go a4Init adds it
// as a self StatMod on EM, reading scale/cap from c4A4 (cons.go:145-150) — a REPLACEMENT at cons≥4
// (0.10/220), not an additive bump. So the base is gated cons<4 (via `invert`) and the C4 upgrade is a
// separate cons≥4 post-effect below. NOT reaction-only — it feeds the lunar EM factor 6·EM/(EM+2000) on
// every Lunar hit (direct + reaction). Base-inert: at cons=0 cons<4 holds → the base fires identically.
const a4MasteryFromAtk: CharPostEffect = {
  priority: 1,
  fromStat: "atk",
  toStat: "mastery",
  ratio: 0.08,
  capValue: 160,
  conditions: [{ type: "constellation", constellation: 4, invert: true }], // cons<4
};
// C4 upgrades A4's EM scaling to 0.10 / 220 (cons.go c4A4). Fires only at cons≥4 (replaces the base above).
const a4MasteryUpgraded: CharPostEffect = {
  priority: 1,
  fromStat: "atk",
  toStat: "mastery",
  ratio: 0.10,
  capValue: 220,
  conditions: [{ type: "constellation", constellation: 4 }], // cons≥4
};

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      // physical base surface (s1 = normal talent)
      if (name === "normal_hit_1") return FlinsTalents.s1.p1; // L1 ≈ 44.726
      if (name === "normal_hit_2") return FlinsTalents.s1.p2; // ≈ 45.1483
      if (name === "normal_hit_3") return FlinsTalents.s1.p3; // ≈ 55.9198
      if (name === "normal_hit_4") return FlinsTalents.s1.p4; // ≈ 32.0389
      if (name === "normal_hit_5") return FlinsTalents.s1.p5; // ≈ 76.7946
      if (name === "charged_hit") return FlinsTalents.s1.p6; // ≈ 103.028
      if (name === "plunge_high") return FlinsTalents.s1.p10; // ≈ 159.6762
      // electro skill-stance surface (s2 = skill talent, leveled by attack level)
      if (name === "skill_normal_hit_1") return FlinsTalents.s2.p1; // ≈ 58.248
      if (name === "skill_normal_hit_2") return FlinsTalents.s2.p2; // ≈ 58.7976
      if (name === "skill_normal_hit_3") return FlinsTalents.s2.p3; // ≈ 72.8256
      if (name === "skill_normal_hit_4") return FlinsTalents.s2.p4; // ≈ 41.7252
      if (name === "skill_normal_hit_5") return FlinsTalents.s2.p5; // ≈ 100.0112
      if (name === "skill_charged_hit") return FlinsTalents.s2.p6; // ≈ 114.96
    }
    if (talent === "skill") {
      if (name === "flins_spearstorm") return FlinsTalents.s2.p7; // ≈ 178.4
    }
    if (talent === "burst") {
      if (name === "flins_burst_initial") return FlinsTalents.s3.p1; // ≈ 259.84
      if (name === "flins_burst_mid") return FlinsTalents.s3.p2; // Cometh the Night (Mid), GCSim burstMid
      if (name === "flins_burst_final") return FlinsTalents.s3.p3; // Cometh the Night (Final), GCSim burstFinal
      if (name === "flins_symphony") return FlinsTalents.s3.p6; // Thunderous Symphony, GCSim symphony
    }
    throw new Error(`flins talents: unknown path '${path}'`);
  },
};

const features: readonly Feature[] = [
  // --- base normals (physical; element omitted = physical, no infusion in the gate build) ---
  { name: "normal_hit_1", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }] },
  { name: "normal_hit_2", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }] },
  { name: "normal_hit_3", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
  { name: "normal_hit_4", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
  { name: "normal_hit_5", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }] },
  { name: "charged_hit", category: "attack", damageType: "charged", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }] },
  { name: "plunge_high", category: "attack", damageType: "plunge", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }] },
  // --- electro skill-stance normals/charge (forced electro via explicit element; skill-talent values, attack-level) ---
  { name: "skill_normal_hit_1", category: "attack", element: "electro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.skill_normal_hit_1") }] },
  { name: "skill_normal_hit_2", category: "attack", element: "electro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.skill_normal_hit_2") }] },
  { name: "skill_normal_hit_3", category: "attack", element: "electro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.skill_normal_hit_3") }] },
  { name: "skill_normal_hit_4", category: "attack", element: "electro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.skill_normal_hit_4") }] },
  { name: "skill_normal_hit_5", category: "attack", element: "electro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.skill_normal_hit_5") }] },
  { name: "skill_charged_hit", category: "attack", damageType: "charged", element: "electro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.skill_charged_hit") }] },
  // --- Northland Spearstorm (skill, electro) ---
  { name: "flins_spearstorm", category: "skill", element: "electro", multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.flins_spearstorm") }] },
  // --- Initial burst (electro, pure ATK×talent% — no DEF-ignore, no base bonus) ---
  { name: "flins_burst_initial", category: "burst", element: "electro", multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.flins_burst_initial") }] },
  // --- DirectLunarCharged burst hits (lunardirect variant, electro) ---
  // GCSim routes AttackTagDirectLunarCharged → pkg/enemy/damage.go calcDirectLunar:
  //   Mult·ATK·(1+BaseDmgBonus) × 3 × (1 + 6·EM/(EM+2000) + reactBonus) × defmod[=1] × resmod, NO DMG%.
  // This is the `lunardirect` variant (the ×3 + lunar EM factor — same machinery Ineffa uses). The
  // (1+BaseDmgBonus) factor is supplied by scalingStatKeys:["lunarcharged_multi"] (set by lunarMultiFromAtk).
  // Mid fires ×2 at moonsign 1 (same mult → one gated feature). SymphonyExtra (s3.p7), Mid's moonsign≥2
  // extra hits, and the C2 hit are moonsign≥2/constellation content → sub-project C.
  {
    name: "flins_burst_mid",
    category: "burst",
    damageType: "lunardirect",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.flins_burst_mid") }],
    reaction: {
      variant: "lunardirect",
      element: "electro",
      scalingStatKeys: LUNAR_SCALING_KEYS,
      reactionBonusKeys: LUNAR_REACTION_BONUS_KEYS,
      amplifyingMultiplier: LUNAR_DIRECT_AMPLIFY,
      critRateKeys: LUNAR_CRIT_RATE_KEYS,
      critDmgKeys: LUNAR_CRIT_DMG_KEYS,
      elevationKeys: LUNAR_ELEVATION_KEYS,
    },
  },
  {
    name: "flins_burst_final",
    category: "burst",
    damageType: "lunardirect",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.flins_burst_final") }],
    reaction: {
      variant: "lunardirect",
      element: "electro",
      scalingStatKeys: LUNAR_SCALING_KEYS,
      reactionBonusKeys: LUNAR_REACTION_BONUS_KEYS,
      amplifyingMultiplier: LUNAR_DIRECT_AMPLIFY,
      critRateKeys: LUNAR_CRIT_RATE_KEYS,
      critDmgKeys: LUNAR_CRIT_DMG_KEYS,
      elevationKeys: LUNAR_ELEVATION_KEYS,
    },
  },
  {
    name: "flins_symphony",
    category: "burst",
    damageType: "lunardirect",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.flins_symphony") }],
    reaction: {
      variant: "lunardirect",
      element: "electro",
      scalingStatKeys: LUNAR_SCALING_KEYS,
      reactionBonusKeys: LUNAR_REACTION_BONUS_KEYS,
      amplifyingMultiplier: LUNAR_DIRECT_AMPLIFY,
      critRateKeys: LUNAR_CRIT_RATE_KEYS,
      critDmgKeys: LUNAR_CRIT_DMG_KEYS,
      elevationKeys: LUNAR_ELEVATION_KEYS,
    },
  },
  // --- Lunar-Charged reaction proc (lunarcharged variant, electro, level-scaled, crit-bearing) ---
  // GCSim AttackTagReactionLunarCharge → 1.8 × CalcLunarChargedDmg (lunarcharged.go:125, reaction.go:19):
  //   1.8 × (1 + 6·EM/(2000+EM) + react) × reactionBase(lvl) × (1 + lunarcharged_multi) × res, DEF ignored.
  // Identical machinery to Ineffa's lunarcharged_contrubution; reuses lunarMultiFromAtk (base bonus) +
  // a4MasteryFromAtk (EM=160) already on Flins (sub-project A). react=0 at C0/moonsign 1 (A1 → sub-project C).
  // The _2/_12 penalty tiers are GCSim's multi-contributor TEAM mechanic (lcContributorMult), not a solo
  // Flins output → deferred. ("contrubution" spelling mirrors the Ineffa precedent / her raw engine key.)
  {
    name: "lunarcharged_contrubution",
    category: "reaction",
    damageType: "lunarreaction",
    reaction: {
      variant: "lunarcharged",
      element: "electro",
      scalingStatKeys: LUNAR_SCALING_KEYS,
      reactionBonusKeys: LUNAR_REACTION_BONUS_KEYS,
      critRateKeys: LUNAR_CRIT_RATE_KEYS,
      critDmgKeys: LUNAR_CRIT_DMG_KEYS,
      elevationKeys: LUNAR_ELEVATION_KEYS,
    },
  },
  // --- C2 "The Devil's Wall": DirectLunarCharged hit, constant Mult 0.5 (50%), cons≥2 ---
  // GCSim cons.go:77-89 (c2MakeAtkCB): AttackTagDirectLunarCharged, Mult 0.5, electro, IgnoreDefPercent:1,
  // armed by c2OnSkill (in spearStorm, skill.go:122), fired by the next skill-stance normal (attack.go:136).
  // No moonsign gate → solo-gateable at cons=2. Same lunardirect machinery as A's Mid/Final/Symphony, with
  // a constant mult (getValue:()=>50) instead of a talent. (The C2 gleam electro RES shred is moonsign≥2 → C-δ.)
  {
    name: "flins_c2_devils_wall",
    category: "skill",
    damageType: "lunardirect",
    condition: { type: "constellation", constellation: 2 },
    multipliers: [{ leveling: "", scaling: "atk", values: { getValue: () => 50 }, source: "constellation2" }],
    reaction: {
      variant: "lunardirect",
      element: "electro",
      scalingStatKeys: LUNAR_SCALING_KEYS,
      reactionBonusKeys: LUNAR_REACTION_BONUS_KEYS,
      amplifyingMultiplier: LUNAR_DIRECT_AMPLIFY,
      critRateKeys: LUNAR_CRIT_RATE_KEYS,
      critDmgKeys: LUNAR_CRIT_DMG_KEYS,
      elevationKeys: LUNAR_ELEVATION_KEYS,
    },
  },
];

// ── Char-level conditions (constellations + the A1 moonsign toggle) ──
// C4: +20% ATKP (cons.go:129-143, c4Init m[ATKP]=0.2). Pure stat buff; atk_percent:20 = +20% of atk_base
// (Stats.ts:79). The C4 A4 EM-upgrade (0.08/160→0.10/220, C-β) is the conditional postEffects below.
// C1 = energy/CD (no damage output).
const charConditions: readonly Condition[] = [
  { type: "constellation", constellation: 4, stats: { atk_percent: 20 } },
  // C6 elevation: +0.35 (×1.35) on every Lunar hit at cons≥6. Read raw by cStat (lunar_elevation = 0.35);
  // the lunar variants' elevationKeys multiply (1 + lunar_elevation). The moonsign≥2 +0.1 → C-ε.
  { type: "constellation", constellation: 6, stats: { lunar_elevation: 0.35 } },
  // A1 "Lunar Reflection": +0.2 reaction bonus on EVERY Flins Lunar hit (direct + reaction) at
  // moonsign≥2 (asc.go a1Init — returns 0 below moonsign 2). Modeled as a moonsign-gated boolean
  // contributing RAW 20 → dmg_reaction_lunarcharged, which buildStats emits as a fraction ÷100 → 0.2
  // (REACTION_BONUS_PERCENT_KEYS, buildStats.ts:211 — the exact lane as FracturedHalo 40-80 /
  // ThunderingFury 20). Every Flins lunar feature already reads that key via reactionBonusKeys, so the
  // +0.2 lands on both the lunardirect hits and the lunarcharged reaction with NO new key / engine
  // change. Base-inert: moonsign_2 is absent by default → inactive → 0 → existing rows byte-identical.
  // (GATE-VERIFIED 2026-06-10: the direct A1 gate runs at cons=0 — the C2 hit's gleam, electro RES
  // −0.25 at cons≥2 + moonsign≥2, is C-ε; the moonsign body is idle Aino, inert at cons=0.)
  { type: "boolean", name: "moonsign_2", stats: { dmg_reaction_lunarcharged: 20 } },
];

export const flins: DbObjectChar = {
  name: "flins",
  gameId: 10000120,
  rarity: 5,
  element: "electro",
  weapon: "polearm",
  origin: "nodkrai",
  statTable: FlinsStatTable,
  talents,
  features,
  multipliers: [], // lean C0: no char-level damage multipliers
  conditions: charConditions, // C4 +20% ATKP (cons≥4) + A1 moonsign_2 react bonus; C2 hit is feature-level
  // lunarcharged_multi = min(0.00007×atk, 0.14) (base-DMG bonus) + A4 EM = min(0.08×atk, 160) — both feed
  // the DirectLunarCharged hits (the base bonus, and the lunar EM factor 6·EM/(EM+2000) respectively).
  postEffects: [lunarMultiFromAtk, a4MasteryFromAtk, a4MasteryUpgraded],
  // Models GCSim LunarChargeEnableKey=1 (asc.go:62) — enables the Lunar-Charged reaction proc.
  // Same flag Ineffa carries; suppresses the generic electrocharged contribution.
  lunarChargedActive: true,
};
