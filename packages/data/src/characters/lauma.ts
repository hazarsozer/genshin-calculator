/**
 * Lauma — PROMOTED past-v5.8 LIVE char (KP-L lockstep, the first knowledge-first port — her KB page
 * `wiki/game/entities/characters/lauma.md` was written BEFORE this port). Her independent oracle is the
 * GCSim gate, NOT an her-engine golden (Aspirine never made her): `node tools/oracle/gate-live.mjs
 * --self-test` + `tools/oracle/_fixtures/lauma-gate.json` (10 rows, fp-epsilon). The every-char suite
 * fixtures (golden/constellations/weapon-passive) are the frozen post-verification snapshot from
 * `tools/port/gen-live-goldens.mjs` — a regression lock, not an independent validation. See
 * `tools/port/LIVE-CHARS.md`.
 *
 * Dendro catalyst, Lunar-Bloom enabler (the Dendro/Hydro analog of Flins's Lunar-Charged); damage almost
 * entirely EM-scaled — and uniquely she has 200 intrinsic base EM (generated/lauma.gen.ts, Amber-pinned
 * 10000119 + the live-chars.json baseEM supplement). Kit ref: /tmp/gcsim/internal/characters/lauma/.
 * Param keys verified by value vs lauma_gen.go:
 *   s1: p1..p3 = N1..N3, p9 = charge (Spiritcall Prayer), p10/p11/p12 = collision/low/high plunge.
 *   s2: p1 = skill Tap, p2 = skill Hold-1, p3 = skill Hold-2 (Lunar-Bloom, ×Verdant Dew), p4/p5 =
 *       Frostgrove Sanctuary ATK / EM coefficients, p8 = Dendro+Hydro RES shred.
 *   s3: p3/p4 = Bloom / Lunar-Bloom Pale-Hymn EM coefficients (team buff — no direct damage).
 *
 * TRUE-100% GCSim-gated surface: normals · Charge · skill Tap · Hold-1 + Hold-2 (direct Lunar-Bloom ×dew)
 * · Frostgrove ticks (ATK+EM hybrid) · C6 Frostgrove tick (moonsign 1 AND moonsign 2 — +0.25 elevation +
 * 0.4 C2 react). Genuinely out of gating (see tools/port/LAUMA-QUARANTINE.md): the C6 Normal conversion +
 * the Pale-Hymn team buff (deferred as a unit), A1 ascendant/nascent crit (crit-only, invisible at cr=-1),
 * C1 heal, C4 energy; plunge is GCSim-unimplemented (port-only).
 */
import type { CharPostEffect, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { LaumaStatTable, LaumaTalents } from "../generated/lauma.gen.js";

// ── Lunar-Bloom shared keys (the Dendro analog of Flins's lunar-charged convention) ──
// Her direct Lunar-Bloom hits route through compileReaction's `lunardirect` variant:
//   base(talent% × EM) × (1 + lunarbloom_multi) × (1 + 6·EM/(EM+2000) + Σreaction) × [elevation] × res
// — exactly GCSim's calcDirectLunar for the DirectLunarBloom tag. CRITICAL: the ×3 amplifier is gated on
// the Lunar-CHARGED tag only (damage.go:206); Lunar-Bloom hits take ×1, so amplifyingMultiplier is OMITTED
// (defaults to 1 → no extra factor). The DEF-ignore is implicit: lunardirect omits the defence factor.
const LUNAR_BLOOM_SCALING_KEYS = ["lunarbloom_multi"] as const; // → (1 + lunarbloom_multi) = (1 + BaseDmgBonus)
const LUNAR_BLOOM_REACTION_BONUS_KEYS = ["dmg_reaction_lunarbloom"] as const; // A1/C2 ascendant (0 at moonsign 1)
const LUNAR_BLOOM_CRIT_RATE_KEYS = ["crit_rate_total"] as const;
const LUNAR_BLOOM_CRIT_DMG_KEYS = ["crit_dmg_total"] as const;
// C6 elevation: +0.25 on every direct Lunar-Bloom hit at cons≥6 + Ascendant Gleam (cons.go c6ElevationBonus).
const LUNAR_BLOOM_ELEVATION_KEYS = ["lunarbloom_elevation"] as const;

// "Lauma adds Lunar-Bloom base DMG bonus = min(EM × 0.000175, 0.14)" (asc.go lunarbloomInit) — the
// EM-scaled analog of Flins's ATK-scaled lunarcharged_multi. Feeds the (1 + BaseDmgBonus) factor on
// every direct Lunar-Bloom hit via scalingStatKeys:["lunarbloom_multi"]. Unconditional (base kit).
const lunarBloomMultiFromEm: CharPostEffect = {
  priority: 1,
  fromStat: "mastery",
  toStat: "lunarbloom_multi",
  ratio: 0.000175,
  capValue: 0.14,
};

// A4 "Whisper of the Frost": skill DMG% = min(EM × 0.4%, 32%) on her skill-tagged hits (Tap / Hold /
// Frostgrove), NOT her direct Lunar-Bloom hits (lunar direct damage takes no DMG%). Stored as a RAW
// PERCENT (ratio 0.4 × EM, cap 32); buildStats folds /100 at emit → fraction (the Alhaitham
// dmg_skill_alhaitham idiom). The skill features carry damageBonuses:["dmg_skill_lauma"].
// GCSim asc.go a4Init: m[DmgP] = min(0.004·em, 0.32) on ElementalArt/ElementalArtHold tags.
const a4SkillDmgFromEm: CharPostEffect = {
  priority: 1,
  fromStat: "mastery",
  toStat: "dmg_skill_lauma",
  ratio: 0.4,
  capValue: 32,
};

// Skill Dendro+Hydro RES shred = skillResShred[skillLvl] (0.25 at talent 10). Modeled as a talent-scaled
// enemy debuff, gated by the `lauma_skill_shred` toggle so the gate can isolate pre-shred hits (normals,
// the shred-applying first skill hit) from post-shred hits (Frostgrove ticks). Negated table → enemy_res
// is reduced; buildStats folds /100 at emit (the Flins C2-gleam enemy_res_electro idiom). GCSim
// applySkillShredCB: AddResistMod(Dendro/Hydro, -skillResShred) for 10s on every skill/Frostgrove hit.
const resShredNeg = { getValue: (level: number) => -LaumaTalents.s2.p8.getValue(level) };
const shredDendro: CharPostEffect = {
  priority: 1,
  fromStat: "mastery", // unused (talentBonus path bypasses fromStat); present to satisfy the type
  toStat: "enemy_res_dendro",
  talentBonus: { table: resShredNeg, levelSetting: "char_skill_elemental" },
  conditions: [{ type: "boolean", name: "lauma_skill_shred" }],
};
const shredHydro: CharPostEffect = {
  priority: 1,
  fromStat: "mastery",
  toStat: "enemy_res_hydro",
  talentBonus: { table: resShredNeg, levelSetting: "char_skill_elemental" },
  conditions: [{ type: "boolean", name: "lauma_skill_shred" }],
};

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return LaumaTalents.s1.p1; // ≈ 33.7024
      if (name === "normal_hit_2") return LaumaTalents.s1.p2; // ≈ 31.8048
      if (name === "normal_hit_3") return LaumaTalents.s1.p3; // ≈ 44.4968
      if (name === "charged_hit") return LaumaTalents.s1.p9; // Spiritcall Prayer ≈ 129.04
      if (name === "plunge_hit") return LaumaTalents.s1.p10; // collision ≈ 56.8288
      if (name === "plunge_low") return LaumaTalents.s1.p11; // ≈ 113.6335
      if (name === "plunge_high") return LaumaTalents.s1.p12; // ≈ 141.9344
    }
    if (talent === "skill") {
      if (name === "skill_press") return LaumaTalents.s2.p1; // Tap ≈ 121.6
      if (name === "skill_hold_1") return LaumaTalents.s2.p2; // Hold regular ≈ 158.08
      if (name === "skill_hold_2") return LaumaTalents.s2.p3; // Hold Lunar-Bloom (×dew) ≈ 152
      if (name === "frostgrove_atk") return LaumaTalents.s2.p4; // ATK term ≈ 96
      if (name === "frostgrove_em") return LaumaTalents.s2.p5; // EM term ≈ 192
    }
    throw new Error(`lauma talents: unknown path '${path}'`);
  },
};

const features: readonly Feature[] = [
  // --- base normals (dendro catalyst — innate dendro infusion) ---
  { name: "normal_hit_1", category: "attack", element: "dendro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }] },
  { name: "normal_hit_2", category: "attack", element: "dendro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }] },
  { name: "normal_hit_3", category: "attack", element: "dendro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
  { name: "charged_hit", category: "attack", damageType: "charged", element: "dendro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }] },
  // plunge: catalyst plunge (dendro). Port-only if GCSim doesn't implement Lauma plunge actions.
  { name: "plunge_hit", category: "attack", damageType: "plunge", element: "dendro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_hit") }] },
  { name: "plunge_low", category: "attack", damageType: "plunge", element: "dendro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }] },
  { name: "plunge_high", category: "attack", damageType: "plunge", element: "dendro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }] },
  // --- skill Tap / Hold-regular (dendro skill; A4 dmg_skill_lauma) ---
  { name: "skill_press", category: "skill", element: "dendro", damageBonuses: ["dmg_skill_lauma"], multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_press") }] },
  { name: "skill_hold_1", category: "skill", element: "dendro", damageBonuses: ["dmg_skill_lauma"], multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_hold_1") }] },
  // --- Frostgrove Sanctuary tick: ATK + EM hybrid (two base-term multipliers, both inherit the
  // skill dmg% incl. A4 — exactly GCSim's base = Mult·ATK + em·frostgroveSanctuaryEM, then ×(1+dmgBonus)) ---
  {
    name: "frostgrove",
    category: "skill",
    element: "dendro",
    damageBonuses: ["dmg_skill_lauma"],
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.frostgrove_atk") }, // ATK term (default scaling)
      { scaling: "mastery*", leveling: "char_skill_elemental", values: talents.get("skill.frostgrove_em") }, // EM term
    ],
  },
  // --- skill Hold-2: direct Lunar-Bloom (EM-scaled base, × Verdant Dew consumed ≤3). GCSim
  // skillHold2[lvl] × dewCount → modeled as a pure ×stacks factor on the base term (the `lauma_dew`
  // setting, max 3). lunardirect, amplify omitted (×1), EM-scaled. Default 0 dew → ×0 (can't Hold). ---
  {
    name: "skill_hold_2",
    category: "skill",
    damageType: "lunardirect",
    multipliers: [{ scaling: "mastery*", leveling: "char_skill_elemental", values: talents.get("skill.skill_hold_2"), stacksFactor: { setting: "lauma_dew", maxStacks: 3 } }],
    reaction: {
      variant: "lunardirect",
      element: "dendro",
      scalingStatKeys: LUNAR_BLOOM_SCALING_KEYS,
      reactionBonusKeys: LUNAR_BLOOM_REACTION_BONUS_KEYS,
      critRateKeys: LUNAR_BLOOM_CRIT_RATE_KEYS,
      critDmgKeys: LUNAR_BLOOM_CRIT_DMG_KEYS,
      elevationKeys: LUNAR_BLOOM_ELEVATION_KEYS,
    },
  },
  // --- C6: Frostgrove fires an extra direct Lunar-Bloom tick, Mult 1.85 (EM-scaled), cons≥6. Fires
  // at moonsign 1 too — the +0.25 ELEVATION (not the tick) is the Ascendant-Gleam-gated part, applied
  // via the moonsign_2_c6 condition's lunarbloom_elevation. (cons.go c6OnFrostgroveTick: only `Cons < 6`
  // gates the tick; c6Init gates the elevation on ascendantGleam.) Exempt from the Pale-Hymn buff. ---
  {
    name: "lauma_c6_frostgrove",
    category: "skill",
    damageType: "lunardirect",
    condition: { type: "constellation", constellation: 6 },
    multipliers: [{ leveling: "", scaling: "mastery*", values: { getValue: () => 185 }, source: "constellation6" }],
    reaction: {
      variant: "lunardirect",
      element: "dendro",
      scalingStatKeys: LUNAR_BLOOM_SCALING_KEYS,
      reactionBonusKeys: LUNAR_BLOOM_REACTION_BONUS_KEYS,
      critRateKeys: LUNAR_BLOOM_CRIT_RATE_KEYS,
      critDmgKeys: LUNAR_BLOOM_CRIT_DMG_KEYS,
      elevationKeys: LUNAR_BLOOM_ELEVATION_KEYS,
    },
  },
  // --- C6 Normal-Attack conversion (Mult 1.5 direct Lunar-Bloom, cons≥6, attack.go paleHymnCount>0
  // branch) is DEFERRED to the Pale-Hymn sub-project (see tools/port/LAUMA-QUARANTINE.md): it only
  // fires while Pale Hymn is held, and when it does the Pale-Hymn FlatDmg self-buff (EM ×
  // lunarBloomDmgIncrease, initBurst) is added unless it consumed the last stack — so its bare 1.5×EM
  // core is wrong in the common case. Its core reuses the SAME lunardirect machinery already validated
  // by Hold-2 + the C6 tick; it returns WITH the Pale-Hymn buff modeled. ---
];

// ── Char-level conditions (constellations + the moonsign/shred toggles) ──
const charConditions: readonly Condition[] = [
  // C3 (BurstCon=3): +3 burst levels. Lauma's burst deals no damage, so this is inert for damage — kept
  // for completeness/parity (base-inert: no burst damage feature reads char_skill_burst).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5 (SkillCon=5): +3 skill levels → every char_skill_elemental feature (Tap/Hold/Frostgrove + the
  // EM term). Base-inert: inactive at cons<5.
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
  // ── Ascendant Gleam (moonsign≥2) effects — one `moonsign_2` toggle, constellation as the SUB-gate
  // under the boolean (the Flins C-ε nesting: evaluateBoolean honors `.condition`, evaluateConstellation
  // ignores it). Base-inert: moonsign_2 off by default. Needs a 2nd moonsign teammate to arm. ──
  // C6 elevation +0.25 (×1.25) on every direct Lunar-Bloom hit at cons≥6 + Ascendant (cons.go c6Init).
  { type: "boolean", name: "moonsign_2", condition: { type: "constellation", constellation: 6 }, stats: { lunarbloom_elevation: 0.25 } },
  // C2 team Lunar-Bloom DMG +0.4 at cons≥2 + Ascendant (cons.go c2Init AddReactBonusMod — applies to
  // ALL chars' direct LB incl. Lauma's own → folded into the (1 + emcurve + Σreact) factor).
  { type: "boolean", name: "moonsign_2", condition: { type: "constellation", constellation: 2 }, stats: { dmg_reaction_lunarbloom: 40 } },
];

export const lauma: DbObjectChar = {
  name: "lauma",
  gameId: 10000119,
  rarity: 5,
  element: "dendro",
  weapon: "catalyst",
  origin: "nodkrai",
  statTable: LaumaStatTable,
  talents,
  features,
  multipliers: [], // lean: no char-level damage multipliers
  conditions: charConditions,
  // EM → lunarbloom_multi (LB base bonus) + dmg_skill_lauma (A4) + the gated Dendro/Hydro RES shred.
  postEffects: [lunarBloomMultiFromEm, a4SkillDmgFromEm, shredDendro, shredHydro],
  // No lunar flag: unlike Lunar-Charged (Flins's `lunarChargedActive` suppresses the generic
  // electrocharged contribution), Lunar-Bloom has no damaging reaction proc to enable or generic
  // contribution to suppress — her direct LB hits are plain `lunardirect` features.
};
