/**
 * Linnea — PROMOTED past-v5.8 LIVE char (the 7th GO-gated character; GCSim does not model her). Her
 * independent oracle is the GO gate (`node tools/oracle/gate-go.mjs --self-test` — the `linnea` rep, frozen
 * in `tools/oracle/_fixtures/linnea-go-gate.json`), NOT an her-engine golden. The every-char suite fixtures
 * (golden/constellations/weapon-passive) are the frozen post-verification snapshot from
 * `tools/port/gen-live-goldens.mjs` — a regression lock, not an independent validation (see
 * `tools/port/LIVE-CHARS.md`). KB page `wiki/game/entities/characters/linnea.md` was written before this
 * port (knowledge-first).
 *
 * 5★ Geo Bow, Nod-Krai (6.5) — a DEF-scaling **Lunar-Crystallize** sub-DPS + healer. A rich composite of
 * already-ported patterns: [[zibai]] (DEF Lunar-Crystallize via the `lunardirect` channel, a0 IDENTICAL)
 * + [[jahoda]] (DEF+flat heals, bow aimed nuance). Her gateable C0 surface = 14 features:
 *   - **Base normals/aimed/plunge** (s1, `talent% × ATK`, PHYSICAL — bow, no innate infusion): 3 normals +
 *     aimed shot + plunge collision/low/high. Ratio mode. The **fully-charged aimed** shot is GEO (her
 *     element — GO `hit.ele = ele`). Bow aimed shots carry `isAimed:true`.
 *   - **Passive bonus fully-aimed** (`passive [0.2]` → an extra fully-charged aimed instance worth 20% of
 *     its DMG; GO `dmgNode(..,, percent(0.2))`): ATK, GEO, modeled as the fully-aimed talent scaled ×0.2.
 *   - **Skill "Pummeler"** (s2.p1, `talent% × DEF`, GEO skill, ×2 per-hit): ratio mode, scaling `def`.
 *   - **Skill "Hammer" + "Crush"** (s2.p2/p3, her PRIMARY carry — Lunar-Crystallize, `talent% × DEF`):
 *     GO `lunarDmg(.., 'def', 'lunarcrystallize')` = `talent% × 1.6 × DEF × (1 + a0) × (1 + 6·EM/(EM+2000))
 *     × res(geo) × transDef` — the [[zibai]] `lunardirect` shape, amp **1.6**, scaling `def`. Gated
 *     ABSOLUTE on a matched build, tol 1e-5 (the same GO-side `transDef` 0.9999905 DEF-ignore-cap residual
 *     as Zibai/Nefer). Crush's C1/C2 premod (lc_dmgInc + critDMG) is 0 at C0 → quarantined.
 *   - **Burst "..." heals** (s3, DEF + flat — the [[jahoda]] `output:{kind:"heal"}` idiom with `scaling:"def"`):
 *     initial + continuous. Gated ABSOLUTE (`mult% × DEF + flat` does NOT cancel in a damage/DEF ratio).
 *
 * **Engine touches (both Linnea-scoped, base-inert → 58k her-engine goldens byte-unchanged):**
 *   1. a0 base-DMG = `min(0.00007 × DEF, 0.14)` (GO passive3 `[0.007, 0.14]`, IDENTICAL to Zibai) — postEffect
 *      `lunarMultiFromDef` (DEF → `linnea_lunar_multi`) + 1 line in buildStats `REACTION_DERIVED_KEYS`
 *      (the DEF-scaled analog of `zibai_lunar_multi`; sole reader = Linnea). Feeds the `(1 + a0)` factor.
 *   2. **A4 self-EM = `0.05 × DEF` → EM** (GO passive2 `0.05`) — postEffect `a4MasteryFromDef` (DEF → `mastery`),
 *      feeding the Lunar-Crystallize curve `(1 + 6·EM/(EM+2000))`. UNLIKE Zibai (EM=0, curve=1), Linnea's
 *      A4 grants self-EM that GO-headless applies (the node gates on `active.isMoonsign≠1` — her
 *      non-moonsign-carrier state, common in lunar teams; ON in GO's single-member driver). Modeled
 *      always-on at C0 (user-approved scope: gate the lunar carry incl. the A4 EM); the moonsign-carrier
 *      case where it's OFF is a future conditional refinement.
 *
 * Element verified BY CONSTRUCTION + GO `.ele` dump (the ratio gate's uniform 10% res is element-blind):
 * normals/aimed/plunge = PHYSICAL (omit `element`); fully-charged aimed + passive-aimed + Skill/lunar = GEO.
 *
 * C0 lean — quarantined (conditional / teammate / Moonsign / constellation): the A1 geo-RES shred (teammate,
 * Moonsign-tiered), the A4 teammate-EM branch, C1 (team + lumi lunarcrystallize_dmgInc stacks), C2 (hydro/geo
 * + lumi CRIT DMG), C4 (self/team DEF%), C6 (Moonsign lc_specialDmg + dmgInc). Param keys (linnea.gen.ts,
 * Amber 10000130; GO `dmgFormulas` + skillParam cross-checked + empirically dumped):
 *   s1: p1/p2/p3 = N1/N2/N3, p4 = Aimed, p5 = Fully-Charged Aimed (geo), p6/p7/p8 = plunge collision/low/high.
 *   s2: p1 = Pummeler (DEF geo, ×2), p2 = Hammer (DEF LC), p3 = Crush (DEF LC), p4/p5 = duration/CD (not dmg).
 *   s3: p1/p2 = initial heal flat/mult, p3/p4 = continuous heal flat/mult, p5/p6/p7 = duration/CD/energy (not dmg).
 */
import type { CharPostEffect, DbObjectChar, Feature, TalentResolver, TalentTable } from "@genshin/types";
import { LinneaStatTable, LinneaTalents } from "../generated/linnea.gen.js";

// ── Lunar-Crystallize (lunardirect) shared keys — DEF-scaled, ×1.6 amplifier, geo. Her Hammer/Crush route
// through compileReaction's `lunardirect` variant (the Zibai shape):
//   base(talent% × DEF) × (1 + linnea_lunar_multi) × (1 + 6·EM/(EM+2000) [+Σreaction]) × 1.6 × res(geo) ──
const LUNAR_CRYSTALLIZE_AMPLIFY = 1.6; // GO lunarDmgMultiplier('def','lunarcrystallize') = [1.6, def]
const LUNAR_SCALING_KEYS = ["linnea_lunar_multi"] as const; // → (1 + linnea_lunar_multi) = (1 + a0 baseDmg)
const LUNAR_CRIT_RATE_KEYS = ["crit_rate_total"] as const;
const LUNAR_CRIT_DMG_KEYS = ["crit_dmg_total"] as const;
// Lunar-Crystallize reaction DMG bonus key — fed by Lightbearing Moonshard toggle +64% (v6.3),
// Golden Frostbound Oath toggle +40% (v6.5), and any future lunarcrystallize_dmg_ source.
// Absent (0) on builds with no such source → base-inert on every existing Linnea fixture.
const LUNAR_REACTION_BONUS_KEYS = ["dmg_reaction_lunarcrystallize"] as const;

// a0 base-DMG bonus = min(DEF × 0.00007, 0.14) — GO passive3 [0.007, 0.14] (== Zibai's lunarMultiFromDef,
// the 0.00007 DEF lunar-coefficient). Feeds (1 + a0) on every Lunar-Crystallize hit. Base-inert: sole reader
// = Linnea (registered in buildStats REACTION_DERIVED_KEYS, fraction-valued, emitted as-is).
const lunarMultiFromDef: CharPostEffect = {
  priority: 1,
  fromStat: "def",
  toStat: "linnea_lunar_multi",
  ratio: 0.00007,
  capValue: 0.14,
};

// A4 self-EM = 0.05 × DEF → EM (GO passive2 0.05). Feeds the Lunar-Crystallize curve (1 + 6·EM/(EM+2000)).
// GO-headless applies it (active.isMoonsign≠1 → her non-moonsign-carrier state). `mastery` is a standard
// flat-total stat → aggregates into mastery_total. Base-inert: only Linnea carries this post-effect.
const a4MasteryFromDef: CharPostEffect = {
  priority: 1,
  fromStat: "def",
  toStat: "mastery",
  ratio: 0.05,
};

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return LinneaTalents.s1.p1; // N1 ≈ 116.6217
      if (name === "normal_hit_2") return LinneaTalents.s1.p2; // N2 ≈ 101.1143
      if (name === "normal_hit_3") return LinneaTalents.s1.p3; // N3 ≈ 161.364
      if (name === "aimed_shot") return LinneaTalents.s1.p4; // Aimed (physical) ≈ 86.7
      if (name === "fully_charged_aimed") return LinneaTalents.s1.p5; // Fully-Charged Aimed (geo) ≈ 223.2
      if (name === "plunge_hit") return LinneaTalents.s1.p6; // collision ≈ 112.336
      if (name === "plunge_low") return LinneaTalents.s1.p7; // ≈ 224.6244
      if (name === "plunge_high") return LinneaTalents.s1.p8; // ≈ 280.568
    }
    if (talent === "skill") {
      if (name === "pummeler") return LinneaTalents.s2.p1; // Pummeler (DEF geo, ×2 per-hit) ≈ 172.8% DEF
      if (name === "hammer") return LinneaTalents.s2.p2; // Hammer (Lunar-Crystallize, DEF) ≈ 180% DEF
      if (name === "crush") return LinneaTalents.s2.p3; // Crush (Lunar-Crystallize, DEF) ≈ 720% DEF
    }
    if (talent === "burst") {
      if (name === "initial_heal_mult") return LinneaTalents.s3.p2; // initial heal DEF% ≈ 288% DEF
      if (name === "initial_heal_flat") return LinneaTalents.s3.p1; // initial heal flat ≈ 1694.95
      if (name === "continuous_heal_mult") return LinneaTalents.s3.p4; // continuous heal DEF% ≈ 57.6% DEF
      if (name === "continuous_heal_flat") return LinneaTalents.s3.p3; // continuous heal flat ≈ 338.99
    }
    throw new Error(`linnea talents: unknown path '${path}'`);
  },
};

// Passive bonus: an additional fully-charged aimed instance worth 20% of its DMG (GO passive [0.2], applied
// as dmgNode's `additional` multiplier). Modeled as the fully-aimed talent scaled ×0.2 (mathematically
// identical: atk × (fullyAimed × 0.2) = atk × fullyAimed × 0.2).
const scaledTalent = (table: TalentTable, factor: number): TalentTable => ({
  getValue: (level: number) => table.getValue(level) * factor,
});

// Hammer/Crush share the lunardirect Lunar-Crystallize reaction config (DEF-scaled, geo, ×1.6, crit-capable).
const lunarReaction = {
  variant: "lunardirect" as const,
  element: "geo" as const,
  scalingStatKeys: LUNAR_SCALING_KEYS,
  reactionBonusKeys: LUNAR_REACTION_BONUS_KEYS,
  amplifyingMultiplier: LUNAR_CRYSTALLIZE_AMPLIFY,
  critRateKeys: LUNAR_CRIT_RATE_KEYS,
  critDmgKeys: LUNAR_CRIT_DMG_KEYS,
};

const features: readonly Feature[] = [
  // --- base normals / aimed / plunge: PHYSICAL (bow, no innate infusion → resolveElement default), ATK ---
  { name: "normal_hit_1", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }] },
  { name: "normal_hit_2", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }] },
  { name: "normal_hit_3", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
  { name: "aimed_shot", category: "attack", damageType: "charged", isAimed: true, multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed_shot") }] }, // physical
  // fully-charged aimed shot is element-infused → GEO (GO sets hit.ele = char element)
  { name: "fully_charged_aimed", category: "attack", damageType: "charged", isAimed: true, element: "geo", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.fully_charged_aimed") }] },
  { name: "plunge_hit", category: "attack", damageType: "plunge", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_hit") }] },
  { name: "plunge_low", category: "attack", damageType: "plunge", tags: ["plunge_shockwave"], multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }] },
  { name: "plunge_high", category: "attack", damageType: "plunge", tags: ["plunge_shockwave"], multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }] },
  // --- Passive bonus fully-aimed: GEO, ATK, an extra instance worth 20% of the fully-aimed (scaled ×0.2) ---
  { name: "passive_fully_aimed", category: "attack", damageType: "charged", isAimed: true, element: "geo", multipliers: [{ leveling: "char_skill_attack", values: scaledTalent(talents.get("attack.fully_charged_aimed"), 0.2) }] },
  // --- Skill "Pummeler": GEO, DEF-scaled skill hit (×2 per-hit value) ---
  { name: "skill_pummeler", category: "skill", element: "geo", multipliers: [{ scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.pummeler") }] },
  // --- Skill "Hammer" + "Crush" (her PRIMARY carry): DEF-scaled Lunar-Crystallize, ×1.6, geo res, crit-capable.
  // a0 = (1 + linnea_lunar_multi); EM curve from the A4 self-EM (a4MasteryFromDef). C1/C2 premod (lc_dmgInc /
  // critDMG) = 0 at C0 → quarantined. Gated ABSOLUTE (the (1 + a0)/curve make them non-∝-DEF), tol 1e-5. ---
  {
    name: "skill_hammer",
    category: "skill",
    damageType: "lunardirect",
    multipliers: [{ scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.hammer") }],
    reaction: lunarReaction,
  },
  {
    name: "skill_crush",
    category: "skill",
    damageType: "lunardirect",
    multipliers: [{ scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.crush") }],
    reaction: lunarReaction,
  },
  // --- Burst "..." heals: DEF% + flat (the Jahoda heal idiom with scaling:"def"). Gated ABSOLUTE. ---
  { name: "initial_heal", category: "burst", output: { kind: "heal" }, multipliers: [{ scaling: "def", leveling: "char_skill_burst", values: talents.get("burst.initial_heal_mult"), flatValues: talents.get("burst.initial_heal_flat") }] },
  { name: "continuous_heal", category: "burst", output: { kind: "heal" }, multipliers: [{ scaling: "def", leveling: "char_skill_burst", values: talents.get("burst.continuous_heal_mult"), flatValues: talents.get("burst.continuous_heal_flat") }] },
];

export const linnea: DbObjectChar = {
  name: "linnea",
  gameId: 10000130,
  rarity: 5,
  element: "geo",
  weapon: "bow",
  origin: "nodkrai",
  statTable: LinneaStatTable,
  talents,
  features,
  multipliers: [], // lean C0: no char-level damage multipliers (A1/A4-teammate/C1-C6 quarantined)
  conditions: [], // C0 gateable surface; Moonsign / A1 RES shred / A4 teammate-EM / constellations quarantined
  // DEF → linnea_lunar_multi (a0 Lunar-Crystallize base-DMG bonus) + DEF → mastery (A4 self-EM, feeds the
  // Lunar-Crystallize EM curve). Both base-inert (Linnea-scoped post-effects).
  postEffects: [lunarMultiFromDef, a4MasteryFromDef],
};
