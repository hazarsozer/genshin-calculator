/**
 * Nefer — PROMOTED past-v5.8 LIVE char (the FIRST GO-gated character: GCSim does not model her). Her
 * independent oracle is the GO gate (`node tools/oracle/gate-go.mjs --self-test` — the nefer-normals +
 * nefer-hybrid-lunar reps, frozen in `tools/oracle/_fixtures/nefer-go-gate.json`), NOT an her-engine
 * golden. The every-char suite fixtures (golden/constellations/weapon-passive) are the frozen
 * post-verification snapshot from `tools/port/gen-live-goldens.mjs` — a regression lock, not an
 * independent validation (see `tools/port/LIVE-CHARS.md`). Her KB page
 * `wiki/game/entities/characters/nefer.md` was written before this port (knowledge-first).
 *
 * 5★ Dendro catalyst, Nod-Krai (6.1) — the EM-first **Lunar-Bloom carry** (the DPS to [[lauma]]'s
 * enabler). Mirrors [[lauma]]'s EM-scaled Lunar-Bloom machinery: her Skill cast, Phantasm "Nefer" hits,
 * and Burst are **ATK+EM hybrids** (EM coefficient ≈ 2× the ATK term — the Frostgrove idiom), and her
 * signature **Phantasm "Shade" hits are pure EM, tagged Lunar-Bloom** (`lunardirect`, DEF-bypassing,
 * crit-capable). Normals/Charged/Plunge are routine ATK-scaled Dendro. Param keys (nefer.gen.ts, Amber
 * 10000122, GO-cross-checked):
 *   s1: p1..p4 = N1..N4 (p3 is the ×2 double — per-hit value), p5 = Charge, p8/p9/p10 = collision/low/high plunge.
 *   s2: p1/p2 = Skill cast ATK/EM, p5/p6 = Phantasm Nefer-1 ATK/EM, p7/p8 = Nefer-2 ATK/EM,
 *       p9/p10/p11 = Phantasm Shade-1/2/3 (pure EM, Lunar-Bloom).
 *   s3: p1/p2 = Burst hit-1 ATK/EM, p3/p4 = Burst hit-2 ATK/EM, p5 = per-Veil DMG bonus (conditional → quarantine).
 *
 * Moonsign Lunar-Bloom base-DMG bonus = min(EM × 0.000175, 0.14) — GO passive3 [[0.000175],[0.14]],
 * IDENTICAL to Lauma's lunarbloomInit; reused verbatim. C0 lean: the Verdant-Dew / Veil-of-Falsehood /
 * Moonsign resource bookkeeping (A1/A4) and the constellations (C1 +60% EM LB base, C2 → 5 Veil / +200 EM /
 * ×1.4 Phantasm, C4 −20% Dendro RES, C6 85%+120% EM shades + 15% elevation) are quarantined as
 * conditional/teammate/crit/sim-state. The gateable surface is her base damage at cr=-1.
 */
import type { CharPostEffect, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { NeferStatTable, NeferTalents } from "../generated/nefer.gen.js";

// ── Lunar-Bloom shared keys (reused from [[lauma]] — the same `lunardirect` Dendro Lunar-Bloom channel) ──
// Her pure-EM Shade hits route through compileReaction's `lunardirect` variant:
//   base(talent% × EM) × (1 + lunarbloom_multi) × (1 + 6·EM/(EM+2000) + Σreaction) × [elevation] × res
// — GCSim's calcDirectLunar for the DirectLunarBloom tag. ×1 amplifier (Lunar-Bloom, not Charged) → omitted.
const LUNAR_BLOOM_SCALING_KEYS = ["lunarbloom_multi"] as const; // → (1 + lunarbloom_multi) = (1 + BaseDmgBonus)
const LUNAR_BLOOM_REACTION_BONUS_KEYS = ["dmg_reaction_lunarbloom"] as const; // A1/C2 Ascendant (0 at C0/moonsign 1)
const LUNAR_BLOOM_CRIT_RATE_KEYS = ["crit_rate_total"] as const;
const LUNAR_BLOOM_CRIT_DMG_KEYS = ["crit_dmg_total"] as const;

// Moonsign LB base-DMG bonus = min(EM × 0.000175, 0.14) — GO passive3 [[0.000175],[0.14]] (== Lauma's
// lunarbloomInit). Unconditional (base kit). Feeds (1 + lunarbloom_multi) on every direct Lunar-Bloom Shade hit.
const lunarBloomMultiFromEm: CharPostEffect = {
  priority: 1,
  fromStat: "mastery",
  toStat: "lunarbloom_multi",
  ratio: 0.000175,
  capValue: 0.14,
};

// NOTE: the inline `≈ …%` annotations below are the L1-floor talent-param values; each resolver
// entry returns the full StatTable, which scales to the talent level (the gate + goldens run L10, so
// e.g. shade_1 is ≈96% @L1 → 172.8% @L10).
const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return NeferTalents.s1.p1; // ≈ 38.0712
      if (name === "normal_hit_2") return NeferTalents.s1.p2; // ≈ 37.564
      if (name === "normal_hit_3") return NeferTalents.s1.p3; // ≈ 25.24 (×2 double — per-hit value)
      if (name === "normal_hit_4") return NeferTalents.s1.p4; // ≈ 60.9944
      if (name === "charged_hit") return NeferTalents.s1.p5; // Charge ≈ 130.88
      if (name === "plunge_hit") return NeferTalents.s1.p8; // collision ≈ 56.8288
      if (name === "plunge_low") return NeferTalents.s1.p9; // ≈ 113.6335
      if (name === "plunge_high") return NeferTalents.s1.p10; // ≈ 141.9344
    }
    if (talent === "skill") {
      if (name === "skill_cast_atk") return NeferTalents.s2.p1; // ≈ 76.384% ATK
      if (name === "skill_cast_em") return NeferTalents.s2.p2; // ≈ 152.768% EM
      if (name === "pp_nefer_1_atk") return NeferTalents.s2.p5; // ≈ 24.64% ATK
      if (name === "pp_nefer_1_em") return NeferTalents.s2.p6; // ≈ 49.28% EM
      if (name === "pp_nefer_2_atk") return NeferTalents.s2.p7; // ≈ 32.032% ATK
      if (name === "pp_nefer_2_em") return NeferTalents.s2.p8; // ≈ 64.064% EM
      if (name === "shade_1") return NeferTalents.s2.p9; // ≈ 96% EM (Lunar-Bloom)
      if (name === "shade_2") return NeferTalents.s2.p10; // ≈ 96% EM (Lunar-Bloom)
      if (name === "shade_3") return NeferTalents.s2.p11; // ≈ 128% EM (Lunar-Bloom)
    }
    if (talent === "burst") {
      if (name === "burst_1_atk") return NeferTalents.s3.p1; // ≈ 224.64% ATK
      if (name === "burst_1_em") return NeferTalents.s3.p2; // ≈ 449.28% EM
      if (name === "burst_2_atk") return NeferTalents.s3.p3; // ≈ 336.96% ATK
      if (name === "burst_2_em") return NeferTalents.s3.p4; // ≈ 673.92% EM
    }
    throw new Error(`nefer talents: unknown path '${path}'`);
  },
};

// ATK+EM hybrid: two summed base-term multipliers (the Lauma Frostgrove idiom — ATK term default
// scaling + EM term scaling:"mastery*"). EM coefficient ≈ 2× the ATK term across her whole kit.
const hybrid = (leveling: string, atkPath: string, emPath: string) => [
  { leveling, values: talents.get(atkPath) },
  { scaling: "mastery*" as const, leveling, values: talents.get(emPath) },
];

const features: readonly Feature[] = [
  // --- base normals + charge + plunge (ATK-scaling Dendro — innate dendro catalyst infusion) ---
  { name: "normal_hit_1", category: "attack", element: "dendro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }] },
  { name: "normal_hit_2", category: "attack", element: "dendro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }] },
  { name: "normal_hit_3", category: "attack", element: "dendro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] }, // ×2 double — per-hit
  { name: "normal_hit_4", category: "attack", element: "dendro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
  { name: "charged_hit", category: "attack", damageType: "charged", element: "dendro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }] },
  // plunge: catalyst plunge (dendro), ATK-scaled. Port-only — GCSim doesn't model her (no plunge to gate).
  { name: "plunge_hit", category: "attack", damageType: "plunge", element: "dendro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_hit") }] },
  { name: "plunge_low", category: "attack", damageType: "plunge", element: "dendro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }] },
  { name: "plunge_high", category: "attack", damageType: "plunge", element: "dendro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }] },
  // --- Skill cast "Shadow Dance" (ATK+EM hybrid Dendro — the state-opening AoE hit) ---
  { name: "skill_cast", category: "skill", element: "dendro", multipliers: hybrid("char_skill_elemental", "skill.skill_cast_atk", "skill.skill_cast_em") },
  // --- Phantasm Performance "Nefer" hits (ATK+EM hybrid Dendro, in-state charged replacement) ---
  { name: "pp_nefer_1", category: "skill", element: "dendro", multipliers: hybrid("char_skill_elemental", "skill.pp_nefer_1_atk", "skill.pp_nefer_1_em") },
  { name: "pp_nefer_2", category: "skill", element: "dendro", multipliers: hybrid("char_skill_elemental", "skill.pp_nefer_2_atk", "skill.pp_nefer_2_em") },
  // --- Phantasm Performance "Shade" hits (PURE EM, direct Lunar-Bloom — her carry damage) ---
  {
    name: "shade_1",
    category: "skill",
    damageType: "lunardirect",
    multipliers: [{ scaling: "mastery*", leveling: "char_skill_elemental", values: talents.get("skill.shade_1") }],
    reaction: { variant: "lunardirect", element: "dendro", scalingStatKeys: LUNAR_BLOOM_SCALING_KEYS, reactionBonusKeys: LUNAR_BLOOM_REACTION_BONUS_KEYS, critRateKeys: LUNAR_BLOOM_CRIT_RATE_KEYS, critDmgKeys: LUNAR_BLOOM_CRIT_DMG_KEYS },
  },
  {
    name: "shade_2",
    category: "skill",
    damageType: "lunardirect",
    multipliers: [{ scaling: "mastery*", leveling: "char_skill_elemental", values: talents.get("skill.shade_2") }],
    reaction: { variant: "lunardirect", element: "dendro", scalingStatKeys: LUNAR_BLOOM_SCALING_KEYS, reactionBonusKeys: LUNAR_BLOOM_REACTION_BONUS_KEYS, critRateKeys: LUNAR_BLOOM_CRIT_RATE_KEYS, critDmgKeys: LUNAR_BLOOM_CRIT_DMG_KEYS },
  },
  {
    name: "shade_3",
    category: "skill",
    damageType: "lunardirect",
    multipliers: [{ scaling: "mastery*", leveling: "char_skill_elemental", values: talents.get("skill.shade_3") }],
    reaction: { variant: "lunardirect", element: "dendro", scalingStatKeys: LUNAR_BLOOM_SCALING_KEYS, reactionBonusKeys: LUNAR_BLOOM_REACTION_BONUS_KEYS, critRateKeys: LUNAR_BLOOM_CRIT_RATE_KEYS, critDmgKeys: LUNAR_BLOOM_CRIT_DMG_KEYS },
  },
  // --- Burst "Sacred Vow" (ATK+EM hybrid Dendro, 2 hits). Per-Veil DMG bonus (s3.p5, consumed on cast)
  // is conditional resource bookkeeping → quarantined; the C0 base hits are the gateable surface. ---
  { name: "burst_hit_1", category: "burst", element: "dendro", multipliers: hybrid("char_skill_burst", "burst.burst_1_atk", "burst.burst_1_em") },
  { name: "burst_hit_2", category: "burst", element: "dendro", multipliers: hybrid("char_skill_burst", "burst.burst_2_atk", "burst.burst_2_em") },
];

export const nefer: DbObjectChar = {
  name: "nefer",
  gameId: 10000122,
  rarity: 5,
  element: "dendro",
  weapon: "catalyst",
  origin: "nodkrai",
  statTable: NeferStatTable,
  talents,
  features,
  multipliers: [], // lean C0: no char-level damage multipliers
  conditions: [], // C0 gateable surface; Veil/Dew/Moonsign + constellations quarantined (conditional/teammate/crit)
  // EM → lunarbloom_multi (Moonsign LB base bonus). Feeds (1 + BaseDmgBonus) on every direct Lunar-Bloom Shade hit.
  postEffects: [lunarBloomMultiFromEm],
};
