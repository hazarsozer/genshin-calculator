/**
 * Lohen — staging past-v5.8 LIVE char (the 10th GO-gated character; GCSim does not model him). His
 * independent oracle is the GO gate (`node tools/oracle/gate-go.mjs --self-test` — the `lohen` rep, frozen
 * in `tools/oracle/_fixtures/lohen-go-gate.json`), NOT an her-engine golden. The every-char suite fixtures
 * (golden/constellations/weapon-passive) are the frozen post-verification snapshot from
 * `tools/port/gen-live-goldens.mjs` — a regression lock, not an independent validation (see
 * `tools/port/LIVE-CHARS.md`). His KB page `wiki/game/entities/characters/lohen.md` was written before this
 * port (knowledge-first).
 *
 * 5★ Cryo polearm, Mondstadt (6.6) — a Hexerei Masterstroke carry. PURE ATK (GO em=0, no DEF/EM/lunar/
 * shield/heal) → all 21 C0 features gate in plain RATIO mode at fp-epsilon.
 *
 * The gated C0 surface:
 *   - 9 out-of-Masterstroke hits (6 normals, charged, 3 plunge) — PHYSICAL, attack-leveled (s1 / auto).
 *   - 10 in-Masterstroke cryo hits (6 normals, charged, 3 plunge) — CRYO, skill-leveled (s2).
 *     Note: same "category" as auto hits (normal/charged/plunge type), but different talent tables (s2),
 *     and cryo element (Masterstroke mode infusion, GO hitEle.cryo + 'skill' levelIndex).
 *   - skill.etch_dmg "Etched Into Bone and Soul" — cryo, skill-leveled (s2.p17 @ L10 = 108%).
 *     At 0 Will-to-Win (cond-off / naught), will_mult = 1 + 0.004 × 0 = 1.0 → bare talent% × ATK.
 *   - burst.burst_dmg "Manifest Judgment" — cryo, burst-leveled (s3.p1 @ L10 = 213.84%). At 0 Will,
 *     will_mult = 1.0 → bare talent% × ATK. GO exposes single-hit value (×6 in-game per UI display).
 *
 * Quarantined (lean C0): Will-to-Win scaling (+0.4%/point in etch/burst), A4 "Flippant Masterpiece"
 * (teammate ATK% + self ATK% conditional), A0 "When the Mood Strikes" (+1 skill level via a0HighSpirits
 * conditional), Hexerei lockedPassive (requires 2+ Hexerei + homework cond), C1-C6. The willConsumed
 * conditional is not modeled (defaults naught = will=0 = mult 1.0, which is what GO evaluates at).
 *
 * NO engine touch (pure ATK). polearm WEAPON_BY_TYPE entry already exists (Flins first; Illuga reused).
 * Element by construction + GO dump: out-of-mode normals/charged/plunge = PHYSICAL (polearm, no infusion
 * outside Masterstroke mode); in-Masterstroke and Skill/Burst = CRYO. Gate is element-blind (uniform 10%
 * res), so element is faithfulness-only — verified vs GO .ele field dump.
 *
 * Param keys (lohen.gen.ts, Amber 10000129, GO-cross-checked):
 *   s1 (auto): p1-p6 = N1/N2/N3/N4/N5.1/N5.2, p7 = CA, p9-p11 = plunge/low/high.
 *   s2 (skill): p1-p6 = ms-N1/N2/N3/N4/N5.1/N5.2 (in-mode), p7 = ms-CA, p8 = Stamina, p9-p11 = ms-plunge,
 *               p17 = etchDmg (Etched Into Bone and Soul), p18 = willEtchMult (0.004/pt).
 *   s3 (burst): p1 = burstDmg (Manifest Judgment), p2 = willBurstMult (0.004/pt).
 */
import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { LohenStatTable, LohenTalents } from "../generated/lohen.gen.js";

// NOTE: inline `≈ …%` annotations are L1-floor talent values; each resolver entry returns the full
// StatTable, which scales to the talent level (the gate + goldens run L10).
const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      // out-of-Masterstroke (s1 / auto): physical polearm attacks
      if (name === "normal_hit_1") return LohenTalents.s1.p1; // ≈ 53.9917
      if (name === "normal_hit_2") return LohenTalents.s1.p2; // ≈ 56.4427
      if (name === "normal_hit_3") return LohenTalents.s1.p3; // ≈ 25.4199 (×3 triple)
      if (name === "normal_hit_4") return LohenTalents.s1.p4; // ≈ 75.2259
      if (name === "normal_hit_5") return LohenTalents.s1.p5; // ≈ 36.8579 (N5.1)
      if (name === "normal_hit_6") return LohenTalents.s1.p6; // ≈ 55.2868 (N5.2)
      if (name === "charged_hit") return LohenTalents.s1.p7;  // ≈ 65.876 (×2 per UI, single here)
      if (name === "plunge_hit") return LohenTalents.s1.p9;   // ≈ 63.9324
      if (name === "plunge_low") return LohenTalents.s1.p10;  // ≈ 127.8377
      if (name === "plunge_high") return LohenTalents.s1.p11; // ≈ 159.6762
    }
    if (talent === "skill") {
      // in-Masterstroke cryo normals (s2 / skill-leveled normal-type hits in Masterstroke mode)
      if (name === "ms_normal_1") return LohenTalents.s2.p1; // ≈ 80.9875
      if (name === "ms_normal_2") return LohenTalents.s2.p2; // ≈ 84.664
      if (name === "ms_normal_3") return LohenTalents.s2.p3; // ≈ 38.1298 (×3 triple)
      if (name === "ms_normal_4") return LohenTalents.s2.p4; // ≈ 112.8389
      if (name === "ms_normal_5") return LohenTalents.s2.p5; // ≈ 55.2868 (N5.1)
      if (name === "ms_normal_6") return LohenTalents.s2.p6; // ≈ 82.9302 (N5.2)
      // in-Masterstroke cryo charged (s2; same category as charged but cryo + skill-leveled)
      if (name === "ms_charged") return LohenTalents.s2.p7;  // ≈ 98.814 (×2 per UI, single)
      // in-Masterstroke cryo plunge (s2; same category as plunge but cryo + skill-leveled)
      if (name === "ms_plunge_hit") return LohenTalents.s2.p9;  // ≈ 63.9324
      if (name === "ms_plunge_low") return LohenTalents.s2.p10; // ≈ 127.8377
      if (name === "ms_plunge_high") return LohenTalents.s2.p11; // ≈ 159.6762
      // Etched Into Bone and Soul (s2.p17 — willEtchMult is quarantined: cond-off = 0 will = mult 1.0)
      if (name === "etch_dmg") return LohenTalents.s2.p17; // ≈ 60 at L1, 108 at L10
    }
    if (talent === "burst") {
      // Manifest Judgment (s3.p1 — willBurstMult quarantined: cond-off = 0 will = mult 1.0)
      if (name === "burst_dmg") return LohenTalents.s3.p1; // ≈ 118.8 at L1, 213.84 at L10
    }
    throw new Error(`lohen talents: unknown path '${path}'`);
  },
};

const features: readonly Feature[] = [
  // --- out-of-Masterstroke normals (ATK, physical, attack-leveled) ---
  // N3 fires ×3 (each hit is p3; GO normal.2 = one of the three); N5 fires as two separate hits (p5/p6).
  { name: "normal_hit_1", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }] },
  { name: "normal_hit_2", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }] },
  { name: "normal_hit_3", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
  { name: "normal_hit_4", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
  { name: "normal_hit_5", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }] },
  { name: "normal_hit_6", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_6") }] },
  // out-of-Masterstroke charged (physical, polearm — single forward thrust). GO charged.dmg is single hit.
  { name: "charged_hit", category: "attack", damageType: "charged", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }] },
  // out-of-Masterstroke plunge (physical, polearm).
  { name: "plunge_hit", category: "attack", damageType: "plunge", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_hit") }] },
  { name: "plunge_low", category: "attack", damageType: "plunge", tags: ["plunge_shockwave"], multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }] },
  { name: "plunge_high", category: "attack", damageType: "plunge", tags: ["plunge_shockwave"], multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }] },

  // --- in-Masterstroke normals (ATK, cryo, SKILL-leveled — s2 talent table, normal-TYPE hit per GO) ---
  // The Zibai gotcha (dmg-type ≠ talent-level source): GO uses
  //   dmgNode('atk', arr, 'normal', hitEle.cryo, undefined, 'skill')
  // where move='normal' (normal-TYPE DMG — gets normal_dmg_ bonus) and levelType='skill' (skill-LEVELED).
  // In our engine, `category` drives the DMG-type bonus (attack → normal_dmg_), and `leveling` drives
  // the talent level (char_skill_elemental → skill talent level).
  // So: category = "attack" (normal_dmg_ applies), leveling = "char_skill_elemental", element = "cryo".
  // Gate key prefix = "attack.ms_normal_*" (NOT "skill.*" — category "attack" sets the key prefix).
  { name: "ms_normal_1", category: "attack", element: "cryo", multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.ms_normal_1") }] },
  { name: "ms_normal_2", category: "attack", element: "cryo", multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.ms_normal_2") }] },
  { name: "ms_normal_3", category: "attack", element: "cryo", multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.ms_normal_3") }] },
  { name: "ms_normal_4", category: "attack", element: "cryo", multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.ms_normal_4") }] },
  { name: "ms_normal_5", category: "attack", element: "cryo", multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.ms_normal_5") }] },
  { name: "ms_normal_6", category: "attack", element: "cryo", multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.ms_normal_6") }] },
  // in-Masterstroke cryo charged (skill-leveled charged-type; GO charged dmgNode → move='charged', levelType='skill')
  { name: "ms_charged", category: "attack", damageType: "charged", element: "cryo", multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.ms_charged") }] },
  // in-Masterstroke cryo plunge (skill-leveled plunge-type; GO plungingDmgNodes with hitEle.cryo + 'skill')
  { name: "ms_plunge_hit", category: "attack", damageType: "plunge", element: "cryo", multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.ms_plunge_hit") }] },
  { name: "ms_plunge_low", category: "attack", damageType: "plunge", element: "cryo", tags: ["plunge_shockwave"], multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.ms_plunge_low") }] },
  { name: "ms_plunge_high", category: "attack", damageType: "plunge", element: "cryo", tags: ["plunge_shockwave"], multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.ms_plunge_high") }] },

  // --- Etched Into Bone and Soul (cryo, skill-leveled) ---
  // willConsumed = 0 (cond-off / naught at C0) → will_mult = 1 + 0.004 × 0 = 1.0 → bare talent% × ATK.
  // Quarantined: the will_mult scaling (the +0.004 per will-point term), and C6 etch critDMG bonus.
  { name: "etch_dmg", category: "skill", element: "cryo", multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.etch_dmg") }] },

  // --- Manifest Judgment burst (cryo, burst-leveled) ---
  // willConsumed = 0 → will_mult = 1.0 → bare talent% × ATK. GO shows ×6 per UI multi, single-hit value.
  { name: "burst_dmg", category: "burst", element: "cryo", multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }] },
];

export const lohen: DbObjectChar = {
  name: "lohen",
  gameId: 10000129,
  rarity: 5,
  element: "cryo",
  weapon: "polearm",
  origin: "mondstadt",
  statTable: LohenStatTable,
  talents,
  features,
  multipliers: [], // lean C0: no char-level damage multipliers (will-scaling / A4 / lockedPassive quarantined)
  conditions: [], // C0 gateable surface; A4/A0/lockedPassive/C1-C6 quarantined
  postEffects: [], // pure talent% × ATK — no reaction/utility post-effect on own hits
};
