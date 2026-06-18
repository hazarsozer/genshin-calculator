/**
 * Columbina — PROMOTED past-v5.8 LIVE char (KP-L lockstep, the knowledge-first port — her KB page
 * `wiki/game/entities/characters/columbina.md` was written BEFORE this port). Her independent oracle is the
 * GCSim gate, NOT an her-engine golden (Aspirine never made her): `node tools/oracle/gate-live.mjs
 * --self-test` + `tools/oracle/_fixtures/columbina-gate.json` (10 rows, fp-epsilon). The every-char suite
 * fixtures (golden/constellations/weapon-passive) are the frozen post-verification snapshot from
 * `tools/port/gen-live-goldens.mjs` — a regression lock, not an independent validation. See
 * `tools/port/LIVE-CHARS.md`.
 *
 * 5★ Hydro catalyst, Nod-Krai — a **dual Lunar enabler** (the Hydro half of both Lunar-Charged and
 * Lunar-Bloom) and **HP-scaling** sub-DPS; ascends on CRIT Rate (NO base EM). A hybrid of [[flins]]
 * (Lunar-Charged, ×3 amplifier, ATK) + [[lauma]] (Lunar-Bloom, ×1, EM) but **HP-scaled**. Kit ref:
 * /tmp/gcsim/internal/characters/columbina/. Param keys verified by value vs columbina_gen.go:
 *   s1: p1..p3 = N1..N3, p4 = Charge, p6 = Moondew Cleanse (charge Lunar-Bloom, ×3 hits), p7/p8/p9 =
 *       collision/low/high plunge (catalyst plunge — GCSim-unimplemented, port-only).
 *   s2: p1 = Skill cast, p2 = Gravity Ripple DoT, p3 = Gravity Interference LC, p4 = Gravity Interference
 *       LB (×5 hits), p5 = Gravity Interference LCr (GCSim-DISABLED → omitted).
 *   s3: p1 = Burst cast, p2 = the Lunar-reaction team buff (teammate-side → quarantine).
 *
 * TRUE-100% GCSim-gated surface: normals · Charge · Skill cast · Gravity Ripple DoT · Burst cast ·
 * Moondew Cleanse (direct Lunar-Bloom ×1) · Gravity Interference LC (direct Lunar-Charged ×3) and LB
 * (direct Lunar-Bloom ×1). Genuinely out of gating (tools/port/COLUMBINA-QUARANTINE.md): Gravity LCr
 * (GCSim-disabled), A1 CRIT Rate + C6 CRIT DMG (crit-only, invisible at cr=-1), A4 Moondew/ICD (resource),
 * C1 energy/shield, C2 self-HP + team buffs, C4 flat-DMG rider, the Burst Lunar-Domain team buff (deferred
 * as a unit, like Lauma's Pale Hymn), the C1+ elevation riders; plunge is GCSim-unimplemented → port-only.
 */
import type { CharPostEffect, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { ColumbinaStatTable, ColumbinaTalents } from "../generated/columbina.gen.js";

// ── Direct-Lunar shared keys (hybrid of the Flins LC and Lauma LB conventions, HP-scaled) ──
// Her DirectLunarCharged / DirectLunarBloom hits route through compileReaction's `lunardirect` variant:
//   base(talent% × HP) × (1 + columbina_lunar_multi) × (1 + 6·EM/(EM+2000) [+Σreaction]) × [amp] × res
// — GCSim's calcDirectLunar with UseHP + IgnoreDefPercent:1 (the DEF-ignore is implicit: lunardirect omits
// the defence factor). The ×3 amplifier is gated on the Lunar-CHARGED tag ONLY (damage.go): her LC discharge
// takes ×3, her LB discharge + Moondew Cleanse take ×1 (amplifier omitted → defaults to 1).
const LUNAR_CHARGED_AMPLIFY = 3; // ChargedLike flat amplifying factor (×3) — LC only
const LUNAR_SCALING_KEYS = ["columbina_lunar_multi"] as const; // → (1 + columbina_lunar_multi) = (1 + BaseDmgBonus)
const LUNAR_CRIT_RATE_KEYS = ["crit_rate_total"] as const; // her direct Lunar hits are crit-capable
const LUNAR_CRIT_DMG_KEYS = ["crit_dmg_total"] as const;

// Moonsign passive (asc.go moonsignInit): every Lunar hit gets a base-DMG bonus of
// min(MaxHP / 1000 × 0.002, 0.07) = min(MaxHP × 0.000002, 0.07) — the HP-scaled analog of Flins's
// ATK-scaled lunarcharged_multi / Lauma's EM-scaled lunarbloom_multi. Feeds the (1 + BaseDmgBonus) factor on
// every direct Lunar hit via scalingStatKeys:["columbina_lunar_multi"]. Unconditional (base kit). Registered
// in buildStats REACTION_DERIVED_KEYS (fraction-valued, emitted as-is).
const lunarMultiFromHp: CharPostEffect = {
  priority: 1,
  fromStat: "hp",
  toStat: "columbina_lunar_multi",
  ratio: 0.000002,
  capValue: 0.07,
};

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return ColumbinaTalents.s1.p1; // L1 ≈ 46.792
      if (name === "normal_hit_2") return ColumbinaTalents.s1.p2; // ≈ 36.6256
      if (name === "normal_hit_3") return ColumbinaTalents.s1.p3; // ≈ 58.484
      if (name === "charged_hit") return ColumbinaTalents.s1.p4; // Charge Attack ≈ 116.08
      if (name === "moondew_cleanse") return ColumbinaTalents.s1.p6; // charge Lunar-Bloom ≈ 1.5112% HP (×3 hits)
      if (name === "plunge_hit") return ColumbinaTalents.s1.p7; // collision ≈ 56.8288
      if (name === "plunge_low") return ColumbinaTalents.s1.p8; // ≈ 113.6335
      if (name === "plunge_high") return ColumbinaTalents.s1.p9; // ≈ 141.9344
    }
    if (talent === "skill") {
      if (name === "skill_cast") return ColumbinaTalents.s2.p1; // Skill ≈ 16.72% HP
      if (name === "gravity_ripple_dot") return ColumbinaTalents.s2.p2; // Gravity Ripple DoT ≈ 9.36% HP
      if (name === "gravity_lc") return ColumbinaTalents.s2.p3; // Gravity Interference (Lunar-Charged) ≈ 4.704% HP
      if (name === "gravity_lb") return ColumbinaTalents.s2.p4; // Gravity Interference (Lunar-Bloom) ≈ 1.408% HP (×5)
    }
    if (talent === "burst") {
      if (name === "burst_cast") return ColumbinaTalents.s3.p1; // Burst ≈ 32.24% HP
    }
    throw new Error(`columbina talents: unknown path '${path}'`);
  },
};

const features: readonly Feature[] = [
  // --- base normals + charge (ATK-scaling Hydro — innate hydro catalyst) ---
  { name: "normal_hit_1", category: "attack", element: "hydro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }] },
  { name: "normal_hit_2", category: "attack", element: "hydro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }] },
  { name: "normal_hit_3", category: "attack", element: "hydro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
  { name: "charged_hit", category: "attack", damageType: "charged", element: "hydro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }] },
  // plunge: catalyst plunge (hydro), ATK-scaled. Port-only — GCSim doesn't implement Columbina plunge actions (like Flins/Lauma).
  { name: "plunge_hit", category: "attack", damageType: "plunge", element: "hydro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_hit") }] },
  { name: "plunge_low", category: "attack", damageType: "plunge", element: "hydro", tags: ["plunge_shockwave"], multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }] },
  { name: "plunge_high", category: "attack", damageType: "plunge", element: "hydro", tags: ["plunge_shockwave"], multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }] },
  // --- Skill cast + Gravity Ripple DoT (HP-scaling Hydro skill hits — no lunar machinery, no DEF-ignore) ---
  { name: "skill_cast", category: "skill", element: "hydro", multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.skill_cast") }] },
  { name: "gravity_ripple_dot", category: "skill", element: "hydro", multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.gravity_ripple_dot") }] },
  // --- Burst cast (HP-scaling Hydro) ---
  { name: "burst_cast", category: "burst", element: "hydro", multipliers: [{ scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.burst_cast") }] },
  // --- Moondew Cleanse: charge Lunar-Bloom (HP-scaled direct LB, ×1, 3 identical hits → one feature, per-hit
  // value). Needs Verdant Dew (a hydro/dendro Lunar-Bloom drives it in the gate, like Lauma's Hold). ---
  {
    name: "moondew_cleanse",
    category: "attack",
    damageType: "lunardirect",
    multipliers: [{ scaling: "hp", leveling: "char_skill_attack", values: talents.get("attack.moondew_cleanse") }],
    reaction: {
      variant: "lunardirect",
      element: "dendro",
      scalingStatKeys: LUNAR_SCALING_KEYS,
      critRateKeys: LUNAR_CRIT_RATE_KEYS,
      critDmgKeys: LUNAR_CRIT_DMG_KEYS,
    },
  },
  // --- Gravity Interference (Lunar-Charged): HP-scaled direct LC discharge, ×3 amplifier, Electro, 1 hit.
  // Skill-leveled (skillLC[TalentLvlSkill]). Needs a sustained Lunar-Charged team to fill Gravity → discharge. ---
  {
    name: "gravity_lc",
    category: "skill",
    damageType: "lunardirect",
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.gravity_lc") }],
    reaction: {
      variant: "lunardirect",
      element: "electro",
      scalingStatKeys: LUNAR_SCALING_KEYS,
      amplifyingMultiplier: LUNAR_CHARGED_AMPLIFY,
      critRateKeys: LUNAR_CRIT_RATE_KEYS,
      critDmgKeys: LUNAR_CRIT_DMG_KEYS,
    },
  },
  // --- Gravity Interference (Lunar-Bloom): HP-scaled direct LB discharge, ×1, Dendro, 5 identical hits
  // (one feature, per-hit value). Skill-leveled. Needs a sustained Lunar-Bloom team to fill Gravity. ---
  {
    name: "gravity_lb",
    category: "skill",
    damageType: "lunardirect",
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.gravity_lb") }],
    reaction: {
      variant: "lunardirect",
      element: "dendro",
      scalingStatKeys: LUNAR_SCALING_KEYS,
      critRateKeys: LUNAR_CRIT_RATE_KEYS,
      critDmgKeys: LUNAR_CRIT_DMG_KEYS,
    },
  },
];

export const columbina: DbObjectChar = {
  name: "columbina",
  gameId: 10000125,
  rarity: 5,
  element: "hydro",
  weapon: "catalyst",
  origin: "nodkrai",
  statTable: ColumbinaStatTable,
  talents,
  features,
  multipliers: [], // lean C0: no char-level damage multipliers
  conditions: [], // C0 gateable surface: constellations/moonsign content is quarantined (teammate/crit/sim-state)
  // HP → columbina_lunar_multi (Moonsign base-DMG bonus). Feeds the (1 + BaseDmgBonus) factor on every
  // direct Lunar hit (Moondew Cleanse + both Gravity Interference discharges).
  postEffects: [lunarMultiFromHp],
  // No lunar flag: her gateable surface is DIRECT lunar hits (lunardirect), not a Lunar-Charged reaction
  // proc — so unlike Flins she sets no `lunarChargedActive` (nothing to enable/suppress for her own outputs).
};
