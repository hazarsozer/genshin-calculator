/**
 * Zibai — past-v5.8 LIVE char (the 4th GO-gated character; GCSim does not model her), STAGED for gating.
 * Her independent oracle is the GO gate (`node tools/oracle/gate-go.mjs --self-test` — the `zibai` rep,
 * frozen in `tools/oracle/_fixtures/zibai-go-gate.json`), NOT an her-engine golden. Her KB page
 * `wiki/game/entities/characters/zibai.md` was written before this port (knowledge-first). Promote to
 * `characters/` (+ generate suite fixtures) once the gate validates the C0 surface — see
 * `tools/port/LIVE-CHARS.md`.
 *
 * 5★ Geo Sword, Nod-Krai (6.3) — a **Lunar-Crystallize on-field DPS** and the FIRST GO-gated char that is
 * **DEF-scaling** (CRIT-DMG ascension, but every in-Skill hit is `% DEF`) AND the first to use the lunar
 * reaction channel. Her gateable C0 surface is **15 base-damage hits + 2 Lunar-Crystallize hits**:
 *   - **Base normals** (s1, `talent% × ATK`, PHYSICAL — sword, no innate infusion): 4 normals + Charged +
 *     3 plunge. Ratio mode. (Out of Lunar Phase Shift; negligible in practice but the gateable base string.)
 *   - **Lunar Phase Shift normals + Stride-1 + Burst-1** (`talent% × DEF`, GEO, plain `dmgNode`): 4 shift
 *     normals + shift Charged + Stride 1st hit (skill) + Burst 1st hit. Ratio mode (scaling `def`).
 *   - **Stride-2 + Burst-2** (Lunar-Crystallize, `talent% × DEF`): her PRIMARY carry. GO models these via
 *     `lunarDmg(.., 'def', 'lunarcrystallize')` = `talent% × 1.6 × DEF × (1 + 6·EM/(EM+2000)) ×
 *     (1 + a0_baseDmg) × res(geo) × transDef` — structurally identical to our `lunardirect` channel
 *     (Columbina's `gravity_lc`), with amplifier **1.6** and the per-DEF base-DMG bonus
 *     a0 = min(0.00007 × DEF, 0.14) (passive3 `[0.007, 0.14]`; the 0.00007 lunar coefficient family).
 *     Gated ABSOLUTE on a matched build (the `(1 + a0)` term makes the hit non-∝-DEF), tol 1e-5 — the same
 *     GO-side `transDef` 0.9999905 DEF-ignore-cap residual as Nefer's Lunar-Bloom shades (our `lunardirect`
 *     omits the defence factor → exact DEF-bypass).
 *
 * Element verified BY CONSTRUCTION + GO `.ele` dump (the ratio gate's uniform 10% res cannot distinguish
 * physical from geo): base normals/charged/plunge are PHYSICAL (omit `element` → resolveElement default);
 * every Lunar Phase Shift / Stride / Burst hit is GEO (explicit). The Lunar-Crystallize hits use geo res
 * (`transformativeReactions.lunarcrystallize.resist = 'geo'`). The Shift normals are normal-type hits
 * (`category:"attack"` → Normal Attack DMG bonus) but skill-LEVELED (`char_skill_elemental` — GO's
 * skillIndex); both invisible at the C0 gate (all-10 talents, no dmg-type bonus) but correct for real builds.
 *
 * C0 lean: the Moonsign-gated N4-additional Lunar-Crystallize (`shift4GleamDmg`, 0 at Moonsign-off), the
 * A1 "Selenic Descent" +60% DEF stride-2 buff, the A4 Geo→DEF% / Hydro→EM teammate scaling, and ALL
 * constellations (C1 first-Stride +220% LC + radiance, C2 LC team DMG% + Moonsign +550% DEF, C3/C5 talent
 * levels, C4 Scattermoon, C6 dynamic radiance-consume scalar) are quarantined as conditional / teammate /
 * Moonsign / stack state. Param keys (zibai.gen.ts, Amber 10000126; GO `dmgFormulas` cross-checked):
 *   s1: p1/p2/p3(×2,per-hit)/p5 = N1/N2/N3/N4, p6 = Charged(×2,per-hit), p8 = stamina (not dmg),
 *       p9/p10/p11 = plunge collision/low/high.
 *   s2: p1 = Stride 1 (DEF geo skill), p2 = Stride 2 (DEF Lunar-Crystallize), p3 = N4-gleam additional LC
 *       (Moonsign → quarantined), p4/p5 = duration/CD (not dmg), p6/p7/p8(×2)/p10 = Lunar Phase Shift
 *       N1/N2/N3/N4 (DEF geo), p11 = Lunar Phase Shift Charged (×2, DEF geo).
 *   s3: p1 = Burst 1 (DEF geo), p2 = Burst 2 (DEF Lunar-Crystallize), p3/p4 = CD/energy (not dmg).
 */
import type { CharPostEffect, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { ZibaiStatTable, ZibaiTalents } from "../generated/zibai.gen.js";

// ── Lunar-Crystallize (lunardirect) shared keys — DEF-scaled, ×1.6 amplifier. Her Stride-2/Burst-2 route
// through compileReaction's `lunardirect` variant:
//   base(talent% × DEF) × (1 + zibai_lunar_multi) × (1 + 6·EM/(EM+2000) [+Σreaction]) × 1.6 × res(geo)
// — the DEF-scaled analog of Columbina's HP-scaled / Flins's ATK-scaled direct-lunar hits. ×1.6 is the
// Lunar-Crystallize amplifier (GO `lunarDmgMultiplier` returns [1.6, input.total.def]). DEF-ignore is
// implicit (lunardirect omits the defence factor), matching GO's `transDef`. ──
const LUNAR_CRYSTALLIZE_AMPLIFY = 1.6; // GO lunarDmgMultiplier('def','lunarcrystallize') = [1.6, def]
const LUNAR_SCALING_KEYS = ["zibai_lunar_multi"] as const; // → (1 + zibai_lunar_multi) = (1 + a0 baseDmg)
const LUNAR_CRIT_RATE_KEYS = ["crit_rate_total"] as const; // Lunar-Crystallize is crit-capable
const LUNAR_CRIT_DMG_KEYS = ["crit_dmg_total"] as const;

// Utility passive (GO a0 `a0_lunarcrystallize_baseDmg_`): every Lunar-Crystallize hit gets a base-DMG bonus
// of min(DEF × 0.00007, 0.14) — the DEF-scaled analog of Columbina's HP-scaled `columbina_lunar_multi`
// (the 0.00007 lunar coefficient family, cf. Ineffa). Feeds the (1 + a0) factor on every Lunar-Crystallize
// hit via scalingStatKeys:["zibai_lunar_multi"]. Unconditional (base kit). Registered in buildStats
// REACTION_DERIVED_KEYS (fraction-valued, emitted as-is). Base-inert: sole reader = Zibai.
const lunarMultiFromDef: CharPostEffect = {
  priority: 1,
  fromStat: "def",
  toStat: "zibai_lunar_multi",
  ratio: 0.00007,
  capValue: 0.14,
};

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return ZibaiTalents.s1.p1; // N1 ≈ 50.5542
      if (name === "normal_hit_2") return ZibaiTalents.s1.p2; // N2 ≈ 46.5527
      if (name === "normal_hit_3") return ZibaiTalents.s1.p3; // N3 (×2 double — per-hit; p3==p4)
      if (name === "normal_hit_4") return ZibaiTalents.s1.p5; // N4 ≈ 77.8954
      if (name === "charged_hit") return ZibaiTalents.s1.p6; // Charged (×2 double — per-hit; p6==p7)
      if (name === "plunge_hit") return ZibaiTalents.s1.p9; // collision ≈ 63.9324
      if (name === "plunge_low") return ZibaiTalents.s1.p10; // ≈ 127.8377
      if (name === "plunge_high") return ZibaiTalents.s1.p11; // ≈ 159.6762
    }
    if (talent === "skill") {
      // Lunar Phase Shift normals (DEF geo, skill-leveled)
      if (name === "shift_normal_1") return ZibaiTalents.s2.p6; // ≈ 56.5792% DEF
      if (name === "shift_normal_2") return ZibaiTalents.s2.p7; // ≈ 52.1007% DEF
      if (name === "shift_normal_3") return ZibaiTalents.s2.p8; // (×2 double — per-hit; p8==p9)
      if (name === "shift_normal_4") return ZibaiTalents.s2.p10; // ≈ 87.1788% DEF
      if (name === "shift_charged") return ZibaiTalents.s2.p11; // Charged (×2 double — per-hit; p11==p12)
      if (name === "stride_1") return ZibaiTalents.s2.p1; // Spirit Steed's Stride 1st ≈ 172.528% DEF (geo skill)
      if (name === "stride_2") return ZibaiTalents.s2.p2; // Spirit Steed's Stride 2nd ≈ 140.968% DEF (Lunar-Crystallize)
    }
    if (talent === "burst") {
      if (name === "burst_1") return ZibaiTalents.s3.p1; // Tri-Sphere Eminence 1st ≈ 126.96% DEF (geo)
      if (name === "burst_2") return ZibaiTalents.s3.p2; // Tri-Sphere Eminence 2nd ≈ 177.744% DEF (Lunar-Crystallize)
    }
    throw new Error(`zibai talents: unknown path '${path}'`);
  },
};

const features: readonly Feature[] = [
  // --- base normals / charged / plunge: PHYSICAL (sword, no innate infusion → resolveElement default), ATK-scaled ---
  { name: "normal_hit_1", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }] },
  { name: "normal_hit_2", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }] },
  { name: "normal_hit_3", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] }, // ×2 double — per-hit
  { name: "normal_hit_4", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
  { name: "charged_hit", category: "attack", damageType: "charged", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }] }, // ×2 double — per-hit
  { name: "plunge_hit", category: "attack", damageType: "plunge", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_hit") }] },
  { name: "plunge_low", category: "attack", damageType: "plunge", tags: ["plunge_shockwave"], multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }] },
  { name: "plunge_high", category: "attack", damageType: "plunge", tags: ["plunge_shockwave"], multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }] },
  // --- Lunar Phase Shift normals/charged: GEO, DEF-scaled. Normal-type hits (category "attack" → Normal
  // Attack DMG bonus) but skill-LEVELED (char_skill_elemental, GO's skillIndex). ---
  { name: "shift_normal_1", category: "attack", element: "geo", multipliers: [{ scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.shift_normal_1") }] },
  { name: "shift_normal_2", category: "attack", element: "geo", multipliers: [{ scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.shift_normal_2") }] },
  { name: "shift_normal_3", category: "attack", element: "geo", multipliers: [{ scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.shift_normal_3") }] }, // ×2 double — per-hit
  { name: "shift_normal_4", category: "attack", element: "geo", multipliers: [{ scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.shift_normal_4") }] },
  { name: "shift_charged", category: "attack", damageType: "charged", element: "geo", multipliers: [{ scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.shift_charged") }] }, // ×2 double — per-hit
  // --- Spirit Steed's Stride 1st hit: GEO, DEF-scaled skill hit (plain dmgNode; strideAddl premod buffs 0 at C0) ---
  { name: "stride_1", category: "skill", element: "geo", multipliers: [{ scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.stride_1") }] },
  // --- Burst "Tri-Sphere Eminence" 1st hit: GEO, DEF-scaled ---
  { name: "burst_1", category: "burst", element: "geo", multipliers: [{ scaling: "def", leveling: "char_skill_burst", values: talents.get("burst.burst_1") }] },
  // --- Lunar-Crystallize 2nd-hits (her PRIMARY carry): DEF-scaled lunardirect, ×1.6 amplifier, geo res,
  // crit-capable. Stride-2 skill-leveled, Burst-2 burst-leveled. The (1 + zibai_lunar_multi) base-DMG term
  // (a0 = min(0.00007×DEF, 0.14)) makes them non-∝-DEF → gated ABSOLUTE on a matched build (tol 1e-5). ---
  {
    name: "stride_2",
    category: "skill",
    damageType: "lunardirect",
    multipliers: [{ scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.stride_2") }],
    reaction: {
      variant: "lunardirect",
      element: "geo",
      scalingStatKeys: LUNAR_SCALING_KEYS,
      amplifyingMultiplier: LUNAR_CRYSTALLIZE_AMPLIFY,
      critRateKeys: LUNAR_CRIT_RATE_KEYS,
      critDmgKeys: LUNAR_CRIT_DMG_KEYS,
    },
  },
  {
    name: "burst_2",
    category: "burst",
    damageType: "lunardirect",
    multipliers: [{ scaling: "def", leveling: "char_skill_burst", values: talents.get("burst.burst_2") }],
    reaction: {
      variant: "lunardirect",
      element: "geo",
      scalingStatKeys: LUNAR_SCALING_KEYS,
      amplifyingMultiplier: LUNAR_CRYSTALLIZE_AMPLIFY,
      critRateKeys: LUNAR_CRIT_RATE_KEYS,
      critDmgKeys: LUNAR_CRIT_DMG_KEYS,
    },
  },
];

export const zibai: DbObjectChar = {
  name: "zibai",
  gameId: 10000126,
  rarity: 5,
  element: "geo",
  weapon: "sword",
  origin: "nodkrai",
  statTable: ZibaiStatTable,
  talents,
  features,
  multipliers: [], // lean C0: no char-level damage multipliers (A1/A4/cons quarantined)
  conditions: [], // C0 gateable surface; Moonsign / A1 / A4 / constellations quarantined
  // DEF → zibai_lunar_multi (utility-passive Lunar-Crystallize base-DMG bonus). Feeds the (1 + a0) factor
  // on both Lunar-Crystallize hits (Stride-2 + Burst-2).
  postEffects: [lunarMultiFromDef],
};
