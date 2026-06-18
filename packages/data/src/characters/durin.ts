/**
 * Durin — PROMOTED past-v5.8 LIVE char (the 2nd GO-gated character: GCSim does not model him). His
 * independent oracle is the GO gate (`node tools/oracle/gate-go.mjs --self-test` — the `durin-pyro` rep,
 * frozen in `tools/oracle/_fixtures/durin-go-gate.json`), NOT an her-engine golden. The every-char suite
 * fixtures (golden/constellations/weapon-passive) are the frozen post-verification snapshot from
 * `tools/port/gen-live-goldens.mjs` — a regression lock, not an independent validation (see
 * `tools/port/LIVE-CHARS.md`). His KB page `wiki/game/entities/characters/durin.md` was written before
 * this port (knowledge-first).
 *
 * 5★ Pyro Sword, Mondstadt (6.2) — a **dual-form off-field Burst DPS**. His entire kit is **ATK-scaling**
 * (CRIT-DMG ascension, no EM/DEF component anywhere at C0), so the whole gateable surface runs in the
 * ratio gate's plain ATK mode. The Elemental Skill toggles a Light/Dark form, and the form chosen before
 * the Burst decides which dragon (White Flame / Dark Decay) is summoned. **Crucially for the port: GO
 * exposes BOTH forms' damage nodes simultaneously** — the form is a GO conditional that gates only the
 * C1/C2/C6 buffs, never the base `talent% × ATK` scaling (verified: `lightBurstAddl`/`darkBurstAddl` add
 * only C6 DEF-ignore = 0 at C0; the A4 `a4Stack_burstPeriodic_mult_` multiplier = 1 with its conditional
 * off). So we model every hit of both forms as a flat feature — no runtime form enum needed to gate base
 * damage. Param keys (durin.gen.ts, Amber 10000123; GO `dmgFormulas` cross-checked):
 *   s1: p1/p2/p3/p5 = N1/N2/N3(×2, per-hit)/N4, p6 = Charge, p8/p9/p10 = plunge collision/low/high.
 *       (p4 is the second half of the N3 double, value-identical to p3; GO reads auto[3]=p4 for normal.2.)
 *   s2: p1 = Skill "Confirmation of Purity" (Light, 1 AoE hit), p2/p3/p4 = "Denial of Darkness" (Dark, 3-hit chain).
 *   s3: p1/p2/p3 = Burst "Principle of Purity" (Light, 3 hits), p4/p5/p6 = "Principle of Darkness" (Dark, 3 hits),
 *       p7 = Dragon of White Flame (Light periodic), p8 = Dragon of Dark Decay (Dark periodic). All Burst DMG.
 *
 * Element: normals/charged/plunge are **physical** (sword, no innate infusion — resolveElement's
 * category-"attack" default); skill/burst/dragon hits are **pyro** (explicit). C0 lean: the A4 Primordial
 * Fusion per-hit ATK-stack multiplier on dragon hits, the A1 form-branched RES-shred / Vaporize-Melt amp,
 * and the constellations (C1 Cycle-of-Enlightenment stacks, C2 reaction team DMG%, C3/C5 talent levels,
 * C4 +40% Burst DMG, C6 DEF-ignore) are all quarantined as conditional/teammate/stack/sim-state. The
 * gateable surface is his base damage at cr=-1.
 */
import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { DurinStatTable, DurinTalents } from "../generated/durin.gen.js";

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return DurinTalents.s1.p1; // N1
      if (name === "normal_hit_2") return DurinTalents.s1.p2; // N2
      if (name === "normal_hit_3") return DurinTalents.s1.p3; // N3 (×2 double — per-hit value; p3==p4)
      if (name === "normal_hit_4") return DurinTalents.s1.p5; // N4
      if (name === "charged_hit") return DurinTalents.s1.p6; // Charge
      if (name === "plunge_hit") return DurinTalents.s1.p8; // collision
      if (name === "plunge_low") return DurinTalents.s1.p9;
      if (name === "plunge_high") return DurinTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "skill_purity") return DurinTalents.s2.p1; // Light — Confirmation of Purity (AoE)
      if (name === "skill_dark_1") return DurinTalents.s2.p2; // Dark — Denial of Darkness hit 1
      if (name === "skill_dark_2") return DurinTalents.s2.p3; // hit 2
      if (name === "skill_dark_3") return DurinTalents.s2.p4; // hit 3
    }
    if (talent === "burst") {
      if (name === "burst_purity_1") return DurinTalents.s3.p1; // Light — Principle of Purity hit 1
      if (name === "burst_purity_2") return DurinTalents.s3.p2; // hit 2
      if (name === "burst_purity_3") return DurinTalents.s3.p3; // hit 3
      if (name === "burst_dark_1") return DurinTalents.s3.p4; // Dark — Principle of Darkness hit 1
      if (name === "burst_dark_2") return DurinTalents.s3.p5; // hit 2
      if (name === "burst_dark_3") return DurinTalents.s3.p6; // hit 3
      if (name === "dragon_white") return DurinTalents.s3.p7; // Dragon of White Flame (periodic)
      if (name === "dragon_decay") return DurinTalents.s3.p8; // Dragon of Dark Decay (periodic)
    }
    throw new Error(`durin talents: unknown path '${path}'`);
  },
};

const features: readonly Feature[] = [
  // --- normals / charged / plunge: PHYSICAL (sword, no innate infusion → resolveElement default), ATK-scaled ---
  { name: "normal_hit_1", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }] },
  { name: "normal_hit_2", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }] },
  { name: "normal_hit_3", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] }, // ×2 double — per-hit
  { name: "normal_hit_4", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
  { name: "charged_hit", category: "attack", damageType: "charged", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }] },
  { name: "plunge_hit", category: "attack", damageType: "plunge", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_hit") }] },
  { name: "plunge_low", category: "attack", damageType: "plunge", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }] },
  { name: "plunge_high", category: "attack", damageType: "plunge", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }] },
  // --- Skill "Binary Form": Light single AoE + Dark 3-hit chain (both Pyro, ATK-scaled; both exposed) ---
  { name: "skill_purity", category: "skill", element: "pyro", multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_purity") }] },
  { name: "skill_dark_1", category: "skill", element: "pyro", multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dark_1") }] },
  { name: "skill_dark_2", category: "skill", element: "pyro", multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dark_2") }] },
  { name: "skill_dark_3", category: "skill", element: "pyro", multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dark_3") }] },
  // --- Burst "Principle of Purity/Darkness": 3 front-hits per form + the off-field dragon (all Pyro Burst DMG) ---
  { name: "burst_purity_1", category: "burst", element: "pyro", multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_purity_1") }] },
  { name: "burst_purity_2", category: "burst", element: "pyro", multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_purity_2") }] },
  { name: "burst_purity_3", category: "burst", element: "pyro", multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_purity_3") }] },
  { name: "burst_dark_1", category: "burst", element: "pyro", multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dark_1") }] },
  { name: "burst_dark_2", category: "burst", element: "pyro", multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dark_2") }] },
  { name: "burst_dark_3", category: "burst", element: "pyro", multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dark_3") }] },
  { name: "dragon_white", category: "burst", element: "pyro", multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.dragon_white") }] }, // A4 stack mult quarantined
  { name: "dragon_decay", category: "burst", element: "pyro", multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.dragon_decay") }] }, // A4 stack mult quarantined
];

export const durin: DbObjectChar = {
  name: "durin",
  gameId: 10000123,
  rarity: 5,
  element: "pyro",
  weapon: "sword",
  origin: "mondstadt",
  statTable: DurinStatTable,
  talents,
  features,
  multipliers: [], // lean C0: no char-level damage multipliers (A4 ATK-stack mult quarantined)
  conditions: [], // C0 gateable surface; form enum / A4 stacks / A1 / constellations quarantined
  postEffects: [], // pure ATK kit — no EM/reaction/base-DMG postEffects (cf. nefer's lunarbloom)
};
