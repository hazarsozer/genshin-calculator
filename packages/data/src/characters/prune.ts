/**
 * Prune — PROMOTED past-v5.8 LIVE char (the 9th GO-gated character; GCSim does not model her). Her
 * independent oracle is the GO gate (`node tools/oracle/gate-go.mjs --self-test` — the `prune` rep, frozen
 * in `tools/oracle/_fixtures/prune-go-gate.json`), NOT an her-engine golden. The every-char suite fixtures
 * (golden/constellations/weapon-passive) are the frozen post-verification snapshot from
 * `tools/port/gen-live-goldens.mjs` — a regression lock, not an independent validation (see
 * `tools/port/LIVE-CHARS.md`). Her KB page `wiki/game/entities/characters/prune.md` was written before this
 * port (knowledge-first).
 *
 * 4★ Anemo catalyst, Mondstadt (6.6) — a quick-swap Viridescent-Venerer / Swirl support ([[sucrose]]-class).
 * PURE ATK (GO em=0, no DEF/EM/lunar/shield/heal) → every output gates in plain RATIO mode at fp-epsilon.
 * The gated 18-feature C0 surface:
 *   - 10 unconditional ANEMO hits (3 normals + charged + 3 plunge + Ring-A-Ding-Ding Skill hit + Burst cast
 *     + Witchlure Bell periodic) — catalyst innate Anemo infusion, talent% × ATK.
 *   - the Swirl-converted Skill stage-2 "Clang Clang!" (×4 swirl-element variants) + the A1 "Banehunter
 *     Oathhammer" (150% ATK, ×4 variants) — pure ATK, modeled per the absorbable element GO enumerates
 *     (pyro/hydro/electro/cryo, same scaling each). Their element is the DYNAMIC Swirled element (a team
 *     input); we model GO's 4 static variants (no placeholder). The Skill stage-2 is swirl-GATED and the A1
 *     fires only when a Bell hit triggers Swirl — that swirl-TRIGGER is a rotation assumption (GO's display
 *     shows the hits unconditionally); the per-hit DAMAGE (talent% × ATK, gate element-blind) is what gates.
 *
 * NO engine touch (pure ATK; the converted element is just a per-feature static element, gate-invisible at
 * uniform 10% res). Quarantined: A4 Tolling Rally (teammate `*_dmg_` buff scaling off ATK-over-2000), C1
 * (energy), C2 (self-ATK stacks during Burst), C4 ricochet (constellation → 0 at C0), C6 (flat ATK +
 * duration), the Hexerei lockedPassive. Param keys (prune.gen.ts, Amber 10000132, GO-cross-checked):
 *   s1: p1/p2/p3 = N1/N2/N3, p4 = Charged, p6/p7/p8 = collision/low/high plunge.
 *   s2: p1 = Ring-A-Ding-Ding (initial), p2 = Clang Clang (converted stage-2).
 *   s3: p1 = Burst cast, p2 = Witchlure Bell.
 *   A1 Oathhammer = 150% ATK (constant — GO passive1[0][0] = 1.5; passives are not emitted into the gen's
 *   talent groups, so it lives here as a sourced constant in percent units — the engine /100s it).
 */
import type { DbObjectChar, Element, Feature, TalentResolver, TalentTable } from "@genshin/types";
import { PruneStatTable, PruneTalents } from "../generated/prune.gen.js";

// A1 "Banehunter Oathhammer" — a CONSTANT 150% ATK (GO passive1, confirmed via the GO dump: dmg/atk = 0.675
// = 1.5 × res·def). Percent units (the engine /100s talent values, like the gen's tables).
const A1_OATHHAMMER_PCT = 150;
const constTalent = (pct: number): TalentTable => ({ getValue: () => pct });

// The 4 Swirl-absorbable elements GO enumerates for the converted hits (Clang stage-2 + A1 Oathhammer); the
// in-game element is whichever was Swirled (a team input) — modeled as GO's 4 static variants, no placeholder.
const SWIRL_ELEMENTS: readonly Element[] = ["pyro", "hydro", "electro", "cryo"];

// NOTE: inline `≈ …%` annotations are L1-floor talent values; each resolver entry returns the full
// StatTable, which scales to the talent level (the gate + goldens run L10).
const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return PruneTalents.s1.p1; // ≈ 48.6208
      if (name === "normal_hit_2") return PruneTalents.s1.p2; // ≈ 48.2808
      if (name === "normal_hit_3") return PruneTalents.s1.p3; // ≈ 67.9768
      if (name === "charged_hit") return PruneTalents.s1.p4; // ≈ 133.52
      if (name === "plunge_hit") return PruneTalents.s1.p6; // collision ≈ 56.8288
      if (name === "plunge_low") return PruneTalents.s1.p7; // ≈ 113.6335
      if (name === "plunge_high") return PruneTalents.s1.p8; // ≈ 141.9344
    }
    if (talent === "skill") {
      if (name === "ring_dmg") return PruneTalents.s2.p1; // Ring-A-Ding initial ≈ 167.44% ATK
      if (name === "clang_dmg") return PruneTalents.s2.p2; // Clang converted stage-2 ≈ 204.56% ATK
    }
    if (talent === "burst") {
      if (name === "burst_cast") return PruneTalents.s3.p1; // Burst cast ≈ 96.96% ATK
      if (name === "bell_dmg") return PruneTalents.s3.p2; // Witchlure Bell ≈ 70.44% ATK
    }
    throw new Error(`prune talents: unknown path '${path}'`);
  },
};

const features: readonly Feature[] = [
  // --- base normals + charged + plunge (ATK-scaling ANEMO — innate anemo catalyst infusion) ---
  { name: "normal_hit_1", category: "attack", element: "anemo", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }] },
  { name: "normal_hit_2", category: "attack", element: "anemo", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }] },
  { name: "normal_hit_3", category: "attack", element: "anemo", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
  { name: "charged_hit", category: "attack", damageType: "charged", element: "anemo", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }] },
  // plunge: catalyst plunge (anemo), ATK-scaled. Port-only — GCSim doesn't model her.
  { name: "plunge_hit", category: "attack", damageType: "plunge", element: "anemo", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_hit") }] },
  { name: "plunge_low", category: "attack", damageType: "plunge", element: "anemo", tags: ["plunge_shockwave"], multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }] },
  { name: "plunge_high", category: "attack", damageType: "plunge", element: "anemo", tags: ["plunge_shockwave"], multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }] },
  // --- Skill stage-1 "Ring-A-Ding-Ding! Hexhunter Chime" — initial Anemo hit ---
  { name: "ring_dmg", category: "skill", element: "anemo", multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.ring_dmg") }] },
  // --- Skill stage-2 "Clang Clang! Witch-tribution Comes!" — converted to the Swirled element (×4 variants,
  // same scaling). Swirl-gated; element is the dynamic Swirl element (team input) — GO's 4 statics. ---
  ...SWIRL_ELEMENTS.map((ele): Feature => ({
    name: `clang_${ele}`,
    category: "skill",
    element: ele,
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.clang_dmg") }],
  })),
  // --- Burst cast "The Bell Tolls! The Hunt Is On!" — Anemo ---
  { name: "burst_cast", category: "burst", element: "anemo", multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_cast") }] },
  // --- Witchlure Bell (Hunter-Seeker periodic strike) — Anemo, Elemental Burst DMG ---
  { name: "bell_dmg", category: "burst", element: "anemo", multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.bell_dmg") }] },
  // --- A1 "Banehunter Oathhammer" — 150% ATK constant, Burst DMG-type, converted to the Swirled element
  // (×4 variants). Swirl-gated (fires on a Bell-hit Swirl); element dynamic (team input) — GO's 4 statics.
  // Active at asc≥1 (the gate build is asc 6). The constant ignores talent level (constTalent). ---
  ...SWIRL_ELEMENTS.map((ele): Feature => ({
    name: `oathhammer_${ele}`,
    category: "burst",
    element: ele,
    multipliers: [{ leveling: "char_skill_burst", values: constTalent(A1_OATHHAMMER_PCT) }],
  })),
];

export const prune: DbObjectChar = {
  name: "prune",
  gameId: 10000132,
  rarity: 4,
  element: "anemo",
  weapon: "catalyst",
  origin: "mondstadt",
  statTable: PruneStatTable,
  talents,
  features,
  multipliers: [], // lean C0: no char-level damage multipliers (A4 Tolling Rally / C2 stacks / C-buffs quarantined)
  conditions: [], // C0 gateable surface; A4 teammate buff + C1/C2/C4/C6 + Hexerei lockedPassive quarantined
  postEffects: [], // pure talent% × ATK — no reaction/utility post-effect on her own hits
};
