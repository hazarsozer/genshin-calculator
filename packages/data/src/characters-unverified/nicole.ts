/**
 * Nicole — staged past-v5.8 LIVE char (8th GO-gated; GCSim does not model her). Her independent oracle
 * is the GO gate (`node tools/oracle/gate-go.mjs --self-test` — the `nicole` rep, frozen in
 * `tools/oracle/_fixtures/nicole-go-gate.json`), NOT an her-engine golden. Her KB page
 * `wiki/game/entities/characters/nicole.md` was written before this port (knowledge-first).
 *
 * 5★ Pyro catalyst, Hexenzirkel-affiliated (6.6) — an off-field ATK-buffer / shielder / Coordinated-Attack
 * support (a near-universal team amp, Bennett-class). Her gateable C0 OWN-output surface is small and
 * Illuga-class: her signature VALUE is teammate buffs + cross-character Arcane Projections, all quarantined.
 * The gated 11-feature surface (all pure talent% × ATK, PYRO):
 *   - 3 normals + charged + 3 plunge — catalyst innate Pyro infusion (ratio, ATK).
 *   - Skill cast hit "Revelation: Uncreated Light" (skill.skillDmg) + Burst cast "Ladder of Divine
 *     Ascent" (burst.skillDmg) — Pyro, ATK (ratio).
 *   - self-triggered Arcane Projection (Silent Contemplation coordinated attack; burst-leveled, 180% ATK
 *     Pyro, ratio). GO computes the Nicole-trigger node (`nicole.burstArcaneProjectionDmg`) off HER ATK;
 *     the teammate-triggered case scales off the on-field char's ATK — a quarantined partyData refinement
 *     (the Varka dual-claymore PHEC precedent: gate the solo case, quarantine the cross-char conversion).
 *   - Shield of Blazing Light (skill.shield) — output:{kind:"shield"}, base = (ATK% × ATK + flat), emitted
 *     base × (1 + shield). ABSOLUTE mode (matched build). FIRST live-char shield gate. NOTE: GO's
 *     `skill.shieldPyro` (= shield × 2.5, the 250% Pyro-absorption efficiency) is the `add_shield_element`
 *     factor, which is OFF in her base dump → our engine faithfully does NOT apply it (matches her engine);
 *     so shieldPyro = shield × 2.5 trivially and is NOT a separately-gated feature (would need an engine
 *     change we avoid — base-inert discipline).
 *
 * PURE ATK + generic shield → NO engine touch (no EM/DEF/lunar/reaction). Quarantined: Grace of Kenosis /
 * Guidance of Theosis ATK team buffs (Skill + A1 + A4), C2 RES-shred + flat ATK, C4 Pathfinder's Blessing,
 * C6 team-wide Theosis + 40% DEF-ignore, C1 / Hexerei "Unity" projections (all teamBuff / conditional /
 * cross-char). Param keys (nicole.gen.ts, Amber 10000131, GO-cross-checked):
 *   s1: p1/p2/p3 = N1/N2/N3, p4 = Charged, p6/p7/p8 = collision/low/high plunge.
 *   s2: p1 = Skill cast, p2/p3 = Shield absorption %/flat.
 *   s3: p1 = Burst cast, p2 = Arcane Projection.
 */
import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { NicoleStatTable, NicoleTalents } from "../generated/nicole.gen.js";

// NOTE: the inline `≈ …%` annotations are the L1-floor talent-param values; each resolver entry returns
// the full StatTable, which scales to the talent level (the gate + goldens run L10).
const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return NicoleTalents.s1.p1; // ≈ 35.1792
      if (name === "normal_hit_2") return NicoleTalents.s1.p2; // ≈ 29.6336
      if (name === "normal_hit_3") return NicoleTalents.s1.p3; // ≈ 46.188
      if (name === "charged_hit") return NicoleTalents.s1.p4; // ≈ 112.32
      if (name === "plunge_hit") return NicoleTalents.s1.p6; // collision ≈ 56.8288
      if (name === "plunge_low") return NicoleTalents.s1.p7; // ≈ 113.6335
      if (name === "plunge_high") return NicoleTalents.s1.p8; // ≈ 141.9344
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return NicoleTalents.s2.p1; // ≈ 138.4% ATK
      if (name === "shield_mult") return NicoleTalents.s2.p2; // ≈ 221.184% ATK (shield absorption)
      if (name === "shield_flat") return NicoleTalents.s2.p3; // ≈ 1386.67 flat (shield absorption)
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return NicoleTalents.s3.p1; // ≈ 316.8% ATK
      if (name === "arcane_projection") return NicoleTalents.s3.p2; // ≈ 99% ATK (Coordinated Attack)
    }
    throw new Error(`nicole talents: unknown path '${path}'`);
  },
};

const features: readonly Feature[] = [
  // --- base normals + charged + plunge (ATK-scaling PYRO — innate pyro catalyst infusion) ---
  { name: "normal_hit_1", category: "attack", element: "pyro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }] },
  { name: "normal_hit_2", category: "attack", element: "pyro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }] },
  { name: "normal_hit_3", category: "attack", element: "pyro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
  { name: "charged_hit", category: "attack", damageType: "charged", element: "pyro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }] },
  // plunge: catalyst plunge (pyro), ATK-scaled. Port-only — GCSim doesn't model her.
  { name: "plunge_hit", category: "attack", damageType: "plunge", element: "pyro", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_hit") }] },
  { name: "plunge_low", category: "attack", damageType: "plunge", element: "pyro", tags: ["plunge_shockwave"], multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }] },
  { name: "plunge_high", category: "attack", damageType: "plunge", element: "pyro", tags: ["plunge_shockwave"], multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }] },
  // --- Skill cast "Revelation: Uncreated Light" — AoE Pyro hit (ATK) ---
  { name: "skill_dmg", category: "skill", element: "pyro", multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }] },
  // --- Shield of Blazing Light — ATK% × ATK + flat, output:{kind:"shield"} (base × (1 + shield)). FIRST
  // live-char shield gate. shieldPyro (×2.5 Pyro-absorption efficiency, GO's add_shield_element factor) is
  // OFF in her base dump → our engine does NOT apply it (matches her engine); not separately gated. ---
  {
    name: "shield_absorption",
    category: "skill",
    output: { kind: "shield" },
    multipliers: [
      { scaling: "atk", leveling: "char_skill_elemental", values: talents.get("skill.shield_mult"), flatValues: talents.get("skill.shield_flat") },
    ],
  },
  // --- Burst cast "Revelation: Ladder of Divine Ascent" — AoE Pyro hit (ATK) ---
  { name: "burst_dmg", category: "burst", element: "pyro", multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }] },
  // --- Arcane Projection (Silent Contemplation Coordinated Attack) — burst-leveled, Pyro, ATK. Self-trigger
  // case (scales off Nicole's ATK); the teammate-triggered cross-char ATK source is a quarantined partyData
  // refinement (Varka PHEC precedent). GO exposes the Nicole-trigger node as nicole.burstArcaneProjectionDmg. ---
  { name: "arcane_projection", category: "burst", element: "pyro", multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.arcane_projection") }] },
];

export const nicole: DbObjectChar = {
  name: "nicole",
  gameId: 10000131,
  rarity: 5,
  element: "pyro",
  weapon: "catalyst",
  origin: "hvision", // Hexenzirkel-affiliated; no standard nation in Amber (KB flags region unverified) — matches live-chars.json
  statTable: NicoleStatTable,
  talents,
  features,
  multipliers: [], // lean C0: no char-level damage multipliers (Grace/Theosis buffs + C-buffs quarantined)
  conditions: [], // C0 gateable surface; A1/A4/C1-C6 teammate buffs + cross-char projections quarantined
  postEffects: [], // pure talent% × ATK + generic shield — no reaction/utility post-effect on her own outputs
};
