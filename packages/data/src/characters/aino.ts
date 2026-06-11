/**
 * Aino — PROMOTED past-v5.8 LIVE char (KP-L lockstep, char #3, knowledge-first). Her KB page
 * `wiki/game/entities/characters/aino.md` was written BEFORE this port. Independent oracle = the GCSim
 * gate (Aspirine never made her): `node tools/oracle/gate-live.mjs --self-test` +
 * `tools/oracle/_fixtures/aino-gate.json` (fp-epsilon). See tools/port/LIVE-CHARS.md.
 *
 * 4★ Hydro claymore, Nod-Krai. An off-field Hydro applier / EM-support — NOT a direct-lunar char (no
 * DEF-ignoring lunar hits of her own). Her personal damage is ordinary ATK-scaling; EM feeds the A4 flat
 * Burst rider + her team buffs. EM-ascender (96 ascension EM, NO innate base EM → no live-chars baseEM,
 * unlike Lauma's 200; the ascension EM is already in generated/aino.gen.ts mastery_base). Kit ref:
 * /tmp/gcsim/internal/characters/aino/.
 * Param keys verified by value vs aino_gen.go (talent L10):
 *   s1: p1/p2/p3 = N1/N2/N3 (N3 = 2 identical sub-hits), p4/p5 = charged spin (loop/final), p8/p9/p10 = plunge.
 *   s2: p1/p2 = skill Musecatcher stage 1 / stage 2 (both Hydro).
 *   s3: p1 = burst water-ball tick.
 *
 * TRUE-100% GCSim-gated surface: N1–3 (physical) · skill stage 1 + 2 (hydro) · burst water-ball tick
 * (hydro, ATK base + A4's +0.5×EM flat rider). Genuinely out of gating (see tools/port/AINO-QUARANTINE.md):
 * A1 burst-cadence enhance (Moonsign: fire frequency + AoE, NO per-hit mult change), C1 team EM buff, C2
 * off-field proc (constellation + sim-state gated, carries the A4 rider), C4 energy, C6 team reaction-DMG
 * bonus; the Charged Attack (claymore spin) + plunge are GCSim-unimplemented for scripted play → port-only.
 */
import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { AinoStatTable, AinoTalents } from "../generated/aino.gen.js";

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return AinoTalents.s1.p1; // L10 ≈ 131.4508
      if (name === "normal_hit_2") return AinoTalents.s1.p2; // ≈ 130.8439
      if (name === "normal_hit_3") return AinoTalents.s1.p3; // ≈ 97.2885 (2 identical sub-hits in rotation)
    }
    if (talent === "skill") {
      if (name === "skill_stage_1") return AinoTalents.s2.p1; // Musecatcher stage 1 ≈ 118.08
      if (name === "skill_stage_2") return AinoTalents.s2.p2; // Musecatcher stage 2 ≈ 339.84
    }
    if (talent === "burst") {
      if (name === "water_ball") return AinoTalents.s3.p1; // burst tick ≈ 36.2016
    }
    throw new Error(`aino talents: unknown path '${path}'`);
  },
};

const features: readonly Feature[] = [
  // --- base normals (physical claymore combo; element omitted = physical, the Flins base-normal idiom) ---
  { name: "normal_hit_1", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }] },
  { name: "normal_hit_2", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }] },
  { name: "normal_hit_3", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
  // --- skill Musecatcher: 2 Hydro hits, ATK-scaled, leveled by the skill talent (GCSim TalentLvlSkill) ---
  { name: "skill_stage_1", category: "skill", element: "hydro", multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_stage_1") }] },
  { name: "skill_stage_2", category: "skill", element: "hydro", multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_stage_2") }] },
  // --- burst water-ball tick: Hydro, ATK base + A4 flat rider (+0.5×EM). TWO base-term multipliers SUM into
  // one base (the Lauma frostgrove ATK+EM precedent), both inheriting the hit's dmg%/crit/res — exactly
  // GCSim's burst base = Mult·ATK + FlatDmg(a4Dmg = c.Stat(EM)·0.5, burst.go:62 / asc.go:19). The A4 term is
  // a CONSTANT 50% (not talent-leveled — a fixed ascension coefficient), scaling "mastery*" (the EM-as-flat-
  // base-coefficient key). The in-game A4 text confirms it: "Burst DMG increased by 50% of Elemental Mastery". ---
  {
    name: "water_ball",
    category: "burst",
    element: "hydro",
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.water_ball") }, // ATK term (default scaling)
      { scaling: "mastery*", leveling: "", values: { getValue: () => 50 }, source: "ascension4" }, // A4: +0.5×EM flat
    ],
  },
];

export const aino: DbObjectChar = {
  name: "aino",
  gameId: 10000121,
  rarity: 4,
  element: "hydro",
  weapon: "claymore",
  origin: "nodkrai",
  statTable: AinoStatTable,
  talents,
  features,
  multipliers: [], // lean C0: no char-level damage multipliers
  conditions: [], // no gateable constellation conditions on the C0 surface (C1/C2/C4/C6 are quarantined)
  postEffects: [], // A4 is modeled as a feature base-term multiplier, not a stat post-effect
};
