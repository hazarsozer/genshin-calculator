/**
 * Illuga — past-v5.8 LIVE char (the 5th GO-gated character; GCSim does not model him), STAGED for gating.
 * Independent oracle is the GO gate (`node tools/oracle/gate-go.mjs --self-test` — the `illuga` rep, frozen
 * in `tools/oracle/_fixtures/illuga-go-gate.json`), NOT an her-engine golden. KB page
 * `wiki/game/entities/characters/illuga.md` was written before this port (knowledge-first). Promote to
 * `characters/` (+ generate suite fixtures) once the gate validates the C0 surface — see
 * `tools/port/LIVE-CHARS.md`.
 *
 * 4★ Geo Polearm, Nod-Krai (6.3) — an EM-ascending off-field Geo support + Lunar-Crystallize amplifier.
 * His OWN damage is simple: base normals (ATK, physical) + Skill Tap/Hold + Burst, the latter three all
 * **EM + DEF split-scale** Geo hits (`talent%_em × EM + talent%_def × DEF`, EM coeff = exactly 2× the DEF
 * coeff — the [[nefer]]/[[lauma]] Frostgrove split-scale idiom with DEF substituted for ATK). His gateable
 * C0 surface is therefore **8 base hits (ratio) + 3 EM+DEF hits (absolute, matched build)** = 11 features:
 *   - **Base normals/charged/plunge** (s1, `talent% × ATK`, PHYSICAL — polearm, no innate infusion): ratio mode.
 *   - **Skill Tap (press) + Skill Hold + Burst** (EM+DEF, GEO): absolute mode on a matched build (the
 *     split-scale doesn't cancel in a damage/one-stat ratio). EM=96 is his A6 ascension EM, supplied by the
 *     gen's `mastery_base` ascension under `statBlock:{}` (unlike Nefer, whose gen lacked it → injected).
 *     fp-epsilon (no lunar/reaction term on his own hits → no tol bump).
 *
 * Element verified BY CONSTRUCTION + GO `.ele` dump (the ratio gate's uniform 10% res can't see element):
 * base normals/charged/plunge are PHYSICAL (omit `element`), Skill/Burst are GEO (explicit).
 *
 * His signature Lunar-Crystallize content is **TEAMMATE buffs**, not his own damage — quarantined for the
 * lean C0 gate: the Burst's per-stack Nightingale's-Song channels (base Geo DMG bonus + the larger
 * Lunar-Crystallize bonus, both pure EM%, GO `isTeamBuff`), A1 Lightkeeper's Oath (party Geo CR/CDMG +
 * Moonsign EM), A4 (party Hydro/Geo-count tiered EM% into both channels), C1 (energy refund), C2 (the
 * off-field Aedon proc, 400% EM + 200% DEF, Burst-classified — a constellation), C4 (party +200 DEF),
 * C6 (A1 upgrade). Param keys (illuga.gen.ts, Amber 10000127; GO `dmgFormulas` cross-checked):
 *   s1: p1/p2/p3(×2,per-hit)/p5 = N1/N2/N3/N4, p6 = Charged, p7 = stamina (not dmg), p8/p9/p10 = plunge
 *       collision/low/high. (GO splits N3 into normal.2/normal.3 — identical value p3==p4; N4 = normal.4.)
 *   s2: p1/p2 = Tap EM/DEF, p3/p4 = Hold EM/DEF, p5 = CD (not dmg).
 *   s3: p1/p2 = Burst EM/DEF, p3 = base Geo DMG bonus (teammate, EM%), p4 = Lunar-Crystallize DMG bonus
 *       (teammate, EM%), p5-p9 = stacks/duration/CD/energy (not dmg). p3/p4 are quarantined teammate buffs.
 */
import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { IllugaStatTable, IllugaTalents } from "../generated/illuga.gen.js";

// EM+DEF split-scale: two summed base-term multipliers (the Frostgrove idiom — EM term scaling:"mastery*"
// + DEF term scaling:"def"). EM coefficient = exactly 2× the DEF term across his Skill/Burst. Both terms
// share the feature's talent level (Tap/Hold skill-leveled, Burst burst-leveled).
const splitEmDef = (leveling: string, emPath: string, defPath: string) => [
  { scaling: "mastery*" as const, leveling, values: talents.get(emPath) },
  { scaling: "def" as const, leveling, values: talents.get(defPath) },
];

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return IllugaTalents.s1.p1; // N1 ≈ 47.3662
      if (name === "normal_hit_2") return IllugaTalents.s1.p2; // N2 ≈ 48.5255
      if (name === "normal_hit_3") return IllugaTalents.s1.p3; // N3 (×2 double — per-hit; p3==p4)
      if (name === "normal_hit_4") return IllugaTalents.s1.p5; // N4 ≈ 76.2786
      if (name === "charged_hit") return IllugaTalents.s1.p6; // Charged ≈ 111.026
      if (name === "plunge_hit") return IllugaTalents.s1.p8; // collision ≈ 63.9324
      if (name === "plunge_low") return IllugaTalents.s1.p9; // ≈ 127.8377
      if (name === "plunge_high") return IllugaTalents.s1.p10; // ≈ 159.6762
    }
    if (talent === "skill") {
      if (name === "skill_press_em") return IllugaTalents.s2.p1; // Tap ≈ 482.56% EM
      if (name === "skill_press_def") return IllugaTalents.s2.p2; // Tap ≈ 241.28% DEF
      if (name === "skill_hold_em") return IllugaTalents.s2.p3; // Hold ≈ 603.2% EM
      if (name === "skill_hold_def") return IllugaTalents.s2.p4; // Hold ≈ 301.6% DEF
    }
    if (talent === "burst") {
      if (name === "burst_em") return IllugaTalents.s3.p1; // Burst ≈ 827.2% EM
      if (name === "burst_def") return IllugaTalents.s3.p2; // Burst ≈ 413.6% DEF
    }
    throw new Error(`illuga talents: unknown path '${path}'`);
  },
};

const features: readonly Feature[] = [
  // --- base normals / charged / plunge: PHYSICAL (polearm, no innate infusion → resolveElement default), ATK-scaled ---
  { name: "normal_hit_1", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }] },
  { name: "normal_hit_2", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }] },
  { name: "normal_hit_3", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] }, // ×2 double — per-hit
  { name: "normal_hit_4", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
  { name: "charged_hit", category: "attack", damageType: "charged", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }] },
  { name: "plunge_hit", category: "attack", damageType: "plunge", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_hit") }] },
  { name: "plunge_low", category: "attack", damageType: "plunge", tags: ["plunge_shockwave"], multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }] },
  { name: "plunge_high", category: "attack", damageType: "plunge", tags: ["plunge_shockwave"], multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }] },
  // --- Skill "Dawnbearing Songbird" Tap + Hold (EM+DEF split-scale, GEO) ---
  { name: "skill_press", category: "skill", element: "geo", multipliers: splitEmDef("char_skill_elemental", "skill.skill_press_em", "skill.skill_press_def") },
  { name: "skill_hold", category: "skill", element: "geo", multipliers: splitEmDef("char_skill_elemental", "skill.skill_hold_em", "skill.skill_hold_def") },
  // --- Burst "Shadowless Reflection" cast hit (EM+DEF split-scale, GEO). The per-stack buff channels +
  // Nightingale's-Song economy are teammate buffs → quarantined. ---
  { name: "burst_dmg", category: "burst", element: "geo", multipliers: splitEmDef("char_skill_burst", "burst.burst_em", "burst.burst_def") },
];

export const illuga: DbObjectChar = {
  name: "illuga",
  gameId: 10000127,
  rarity: 4,
  element: "geo",
  weapon: "polearm",
  origin: "nodkrai",
  statTable: IllugaStatTable,
  talents,
  features,
  multipliers: [], // lean C0: no char-level damage multipliers
  conditions: [], // C0 gateable surface; Nightingale's-Song teammate buffs / A1 / A4 / constellations quarantined
  postEffects: [], // EM+DEF kit (no lunar reaction on his OWN hits — the Lunar-Crystallize is a teammate buff he grants)
};
