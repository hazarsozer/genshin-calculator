/**
 * Jahoda — PROMOTED past-v5.8 LIVE char (the 3rd GO-gated character; first bow, first healer: GCSim does
 * not model her). Her independent oracle is the GO gate (`node tools/oracle/gate-go.mjs --self-test` —
 * the `jahoda` rep, frozen in `tools/oracle/_fixtures/jahoda-go-gate.json`), NOT an her-engine golden. The
 * every-char suite fixtures (golden/constellations/weapon-passive) are the frozen post-verification
 * snapshot from `tools/port/gen-live-goldens.mjs` — a regression lock, not an independent validation (see
 * `tools/port/LIVE-CHARS.md`). Her KB page `wiki/game/entities/characters/jahoda.md` was written before
 * this port (knowledge-first).
 *
 * 4★ Anemo Bow, Nod-Krai (6.2) — an off-field Anemo support / **healer** / VV carrier (ascends on Healing
 * Bonus). Her personal damage is ATK-scaling filler; her real outputs are her Burst's robot HEALS. The
 * gateable C0 surface is therefore **12 base-damage hits + 2 heal channels**:
 *   - **Damage** (ratio mode, all `talent% × ATK`): 3 normals + aimed shot + fully-charged aimed shot +
 *     3 plunge + Skill Smoke-Bomb / Unfilled-Flask / Filled-Flask discharge + Burst cast.
 *   - **Heals** (absolute mode, matched build — an ATK + flat hybrid × (1 + healing_base) that does NOT
 *     cancel in a ratio; the [[barbara]] / [[kokomi]] heal idiom): robot active-char heal + lowest-HP heal.
 * Element: normals / aimed shot / plunge are **physical** (a bow's uncharged shots carry no infusion —
 * resolveElement's category-"attack" default); the **fully-charged aimed shot**, Skill discharges, and
 * Burst cast are **Anemo** (verified against GO's per-hit element output — the ratio gate's uniform res
 * cannot distinguish elements). Param keys (jahoda.gen.ts, Amber 10000124; GO `dmgFormulas` cross-checked):
 *   s1: p1/p2/p3 = N1/N2(×2,per-hit)/N3, p4 = Aimed, p5 = Fully-Charged Aimed, p6/p7/p8 = plunge dmg/low/high.
 *   s2: p1 = Smoke Bomb, p2 = Unfilled Flask, p3 = Filled Flask discharge (p5 Meowball = Moonsign-gated → quarantined).
 *   s3: p1 = Burst cast DMG, p4/p5 = robot heal ATK%/flat, p6/p7 = lowest-HP heal ATK%/flat
 *       (p2 robot DMG = Moonsign-converted dynamic-element → quarantined).
 *
 * C0 lean: the **Moonsign**-gated Meowball + element-converted robot DMG (per-PHEC dynamic element), the
 * **A1** "Plan to Get Paid" party-element resolver, the **A4** +100 EM teammate buff, and **all
 * constellations** (C1 Meowball bounce, C2 top-two elements, C3/C5 talent levels, C4 energy, C6 party
 * CRIT buff) are quarantined as conditional / teammate / Moonsign-state. The gateable surface is her base
 * damage + base heals at cr=-1, Moonsign off.
 */
import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { JahodaStatTable, JahodaTalents } from "../generated/jahoda.gen.js";

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return JahodaTalents.s1.p1; // N1
      if (name === "normal_hit_2") return JahodaTalents.s1.p2; // N2 (×2 double — per-hit value)
      if (name === "normal_hit_3") return JahodaTalents.s1.p3; // N3
      if (name === "aimed_shot") return JahodaTalents.s1.p4; // Aimed Shot (physical)
      if (name === "fully_charged_aimed") return JahodaTalents.s1.p5; // Fully-Charged Aimed Shot (anemo)
      if (name === "plunge_hit") return JahodaTalents.s1.p6; // collision
      if (name === "plunge_low") return JahodaTalents.s1.p7;
      if (name === "plunge_high") return JahodaTalents.s1.p8;
    }
    if (talent === "skill") {
      if (name === "smoke_bomb") return JahodaTalents.s2.p1; // whiffed-dash Smoke Bomb
      if (name === "unfilled_flask") return JahodaTalents.s2.p2; // Unfilled Treasure Flask discharge
      if (name === "filled_flask") return JahodaTalents.s2.p3; // Filled Treasure Flask discharge
    }
    if (talent === "burst") {
      if (name === "burst_cast") return JahodaTalents.s3.p1; // cast hit
      if (name === "robot_heal_mult") return JahodaTalents.s3.p4; // active-char heal ATK%
      if (name === "robot_heal_flat") return JahodaTalents.s3.p5; // active-char heal flat
      if (name === "lowest_heal_mult") return JahodaTalents.s3.p6; // lowest-HP heal ATK%
      if (name === "lowest_heal_flat") return JahodaTalents.s3.p7; // lowest-HP heal flat
    }
    throw new Error(`jahoda talents: unknown path '${path}'`);
  },
};

const features: readonly Feature[] = [
  // --- normals / aimed / plunge: PHYSICAL (bow, no innate infusion → resolveElement default), ATK-scaled ---
  { name: "normal_hit_1", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }] },
  { name: "normal_hit_2", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }] }, // ×2 double — per-hit
  { name: "normal_hit_3", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
  { name: "aimed_shot", category: "attack", damageType: "charged", isAimed: true, multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed_shot") }] }, // physical
  // fully-charged aimed shot is element-infused → ANEMO (GO sets hit.ele = char element)
  { name: "fully_charged_aimed", category: "attack", damageType: "charged", isAimed: true, element: "anemo", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.fully_charged_aimed") }] },
  { name: "plunge_hit", category: "attack", damageType: "plunge", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_hit") }] },
  { name: "plunge_low", category: "attack", damageType: "plunge", tags: ["plunge_shockwave"], multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }] },
  { name: "plunge_high", category: "attack", damageType: "plunge", tags: ["plunge_shockwave"], multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }] },
  // --- Skill "Savvy Strategy" discharges: Smoke Bomb / Unfilled Flask / Filled Flask — all Anemo, ATK-scaled ---
  { name: "smoke_bomb", category: "skill", element: "anemo", multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.smoke_bomb") }] },
  { name: "unfilled_flask", category: "skill", element: "anemo", multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.unfilled_flask") }] },
  { name: "filled_flask", category: "skill", element: "anemo", multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.filled_flask") }] },
  // --- Burst "Hidden Aces": cast Anemo hit + the two robot HEAL channels (ATK + flat × (1 + healing_base)) ---
  { name: "burst_cast", category: "burst", element: "anemo", multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_cast") }] },
  // Robot active-char heal — ATK%+flat (default ATK scaling). GO healNodeTalent('atk', mult, flat, 'burst').
  { name: "robot_heal", category: "burst", output: { kind: "heal" }, multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.robot_heal_mult"), flatValues: talents.get("burst.robot_heal_flat") }] },
  // Lowest-HP ally heal — ATK%+flat (in-game >70%-HP-gated; GO exposes the magnitude unconditionally → gate the magnitude).
  { name: "lowest_heal", category: "burst", output: { kind: "heal" }, multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.lowest_heal_mult"), flatValues: talents.get("burst.lowest_heal_flat") }] },
];

export const jahoda: DbObjectChar = {
  name: "jahoda",
  gameId: 10000124,
  rarity: 4,
  element: "anemo",
  weapon: "bow",
  origin: "nodkrai",
  statTable: JahodaStatTable,
  talents,
  features,
  multipliers: [], // lean C0: no char-level damage multipliers
  conditions: [], // C0 gateable surface; Moonsign / A1 resolver / A4 / constellations quarantined
  postEffects: [], // pure ATK kit (heals scale ATK+flat); no EM/reaction/base-DMG postEffects
};
