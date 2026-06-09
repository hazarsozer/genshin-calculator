/**
 * Flins — STAGED past-v5.8 port (lean C0, GCSim-gated). NOT in characters/ — staging is invisible
 * to the filesystem-glob vitest suites; promotion is deferred (see the POC design spec).
 *
 * Gated (ATK×talent% direct surface): base normals + charge + plunge (physical), electro skill-stance
 * normals + charge, Northland Spearstorm, Initial burst. ALL Lunar-Charged content quarantined
 * (tools/port/FLINS-QUARANTINE.md). Numbers: generated/flins.gen.ts (Amber, pinned). Kit ref:
 * /tmp/gcsim/internal/characters/flins/. Talent param keys verified by value vs flins_gen.go:
 *   s1: p1..p5 = N1..N5, p6 = charge, p10 = high plunge (p8/p9 = collision/low plunge).
 *   s2: p1..p5 = skill-stance N1..N5, p6 = skill charge, p7 = Northland Spearstorm.
 *   s3: p1 = Initial burst (p2/p3/p6/p7 = quarantined Mid/Final/Symphony/SymphonyExtra).
 */
import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { FlinsStatTable, FlinsTalents } from "../generated/flins.gen.js";

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
  // --- Initial burst (electro; the DirectLunarCharged Mid/Final/Symphony hits are QUARANTINED) ---
  { name: "flins_burst_initial", category: "burst", element: "electro", multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.flins_burst_initial") }] },
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
  multipliers: [], // lean C0: no char-level damage multipliers (all Lunar-Charged content quarantined)
};
