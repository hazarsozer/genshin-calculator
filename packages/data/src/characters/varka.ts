/**
 * Varka — PROMOTED past-v5.8 LIVE char (the 6th GO-gated character; GCSim does not model him). His
 * independent oracle is the GO gate (`node tools/oracle/gate-go.mjs --self-test` — the `varka` rep, frozen
 * in `tools/oracle/_fixtures/varka-go-gate.json`), NOT an her-engine golden. The every-char suite fixtures
 * (golden/constellations/weapon-passive) are the frozen post-verification snapshot from
 * `tools/port/gen-live-goldens.mjs` — a regression lock, not an independent validation (see
 * `tools/port/LIVE-CHARS.md`). KB page `wiki/game/entities/characters/varka.md` was written before this
 * port (knowledge-first).
 *
 * 5★ Anemo Claymore, Mondstadt (6.4) — an on-field Anemo DPS and self-Viridescent-Venerer carrier. His
 * whole damage surface is **pure `talent% × ATK`** (he ascends on CRIT DMG; GO `em=0`, no DEF/EM/lunar
 * scaling — the simplest kit type, Durin-class). NO engine touch. His gateable C0 surface is the FULL
 * 32-feature own-damage stream:
 *   - **Base normals/charged/plunge** (out of mode, s1, PHYSICAL — claymore, no innate infusion): 9 normal
 *     sub-hits + 2 charged + 3 plunge.
 *   - **Tap cast** "Windbound Execution" (s2 skillDmg, ANEMO).
 *   - **Sturm und Drang in-mode stream** (s2, skill-LEVELED): 9 Sturm normals + 2 Sturm charged + 2 Four
 *     Winds' Ascension + 2 Azure Devour. Each in-mode swing is a **dual-claymore pair**: a left ANEMO leg
 *     and a right runtime-PHEC leg (see element note).
 *   - **Burst** "Northwind Avatar" (s3): 2 ANEMO slashes.
 * All 32 gate in RATIO mode (ATK cancels in the damage/ATK ratio) at fp-epsilon — same inert Blackcliff
 * Slasher both sides (CRIT-DMG main + ATK% passive off → inert).
 *
 * Element verified BY CONSTRUCTION + GO `.ele` dump (the ratio gate's uniform 10% res cannot distinguish
 * elements — it is element-blind, so element is faithfulness-only here):
 *   - base normals/charged/plunge → PHYSICAL (omit `element` → resolveElement default).
 *   - Tap cast / Sturm anemo legs / Four Winds' anemo leg / both Burst slashes → ANEMO (explicit). The
 *     Burst's GENERATED text is "2 instances of Anemo DMG" (default), so hit-1 is ANEMO; GO routes hit-1's
 *     element through its `phecElement` node, which falls back to its **'physical' sentinel** when no PHEC
 *     ally is present (a GO display quirk, not the in-game element) — flagged, gate-invisible.
 *   - Sturm/Azure PHEC legs → the dual-claymore RIGHT hit deals the party's highest-priority PHEC element
 *     (Pyro>Hydro>Electro>Cryo) at runtime. That **runtime PHEC resolver is a quarantined partyData
 *     mechanic** (out of C0 scope, à la Kazuha's party-element resolver). At C0 with no PHEC ally there is
 *     no element to convert to, so these legs are PHYSICAL — exactly as GO computes them. attack-category
 *     phec legs reach physical via resolveElement default (omit); Four Winds' phec leg is skill-category
 *     (would default to charElement=anemo) so it carries explicit `element:"physical"` to stay at the C0
 *     physical state. The Sturm in-mode hits are normal/charged-type (category "attack" → Normal/Charged
 *     DMG bonus) but skill-LEVELED (`char_skill_elemental` — GO's `'skill'` leveling arg); both invisible
 *     at the C0 gate (all-10 talents, no dmg-type bonus) but correct for real builds (the Zibai gotcha).
 *
 * C0 lean — quarantined (conditional / teammate / party-state, all OFF or inert at solo C0, verified vs the
 * GO dump: A1 final mult = 1, A4 stacks = 0):
 *   - **A1 "Dawn Wind's March"**: the per-1,000-ATK → Anemo/PHEC DMG% conversion (needs a PHEC ally) AND
 *     the ×1.4/×2.2 conditional final multiplier on the Sturm/FWA/Azure subset (party Anemo/PHEC-count gate).
 *   - **A4 "Wind's Vanguard"**: the stack-capped DMG% on the same subset (source = nearby-party Swirl).
 *   - **C1** Lyrical Libation ×2 one-shot, **C2** 800%-ATK extra Anemo strike, **C3/C5** talent levels,
 *     **C4** team Swirl DMG% buff, **C6** combo-chain + per-stack CRIT DMG, and the runtime PHEC resolver.
 * Param keys (varka.gen.ts, Amber 10000128; GO `dmgFormulas` cross-checked + empirically dumped):
 *   s1: p1 = N1; p2/p3 = N2 (.2/.1); p4/p5 = N3 (.2/.1); p6/p7 = N4 (.1/.2); p8/p9 = N5 (.1/.2);
 *       p10/p11 = Charged 1/2; p12 = stamina (not dmg); p13/p14/p15 = plunge collision/low/high.
 *   s2: p1 = Tap cast (anemo); p2 = duration (not dmg); p3 = Sturm N1; p4/p5 = Sturm N2 (.2/.1);
 *       p6/p7 = Sturm N3 (.2/.1); p8/p9 = Sturm N4 (.1/.2); p10/p11 = Sturm N5 (.1/.2);
 *       p12/p13 = Sturm Charged 1/2; p14/p15 = Four Winds' 1/2; p16/p17 = Azure Devour 1/2 (per-hit; ×2 each);
 *       p18/p19/p20 = CDs (not dmg). (GO display order for each Sturm pair is .1-then-.2; talent indices swap.)
 *   s3: p1/p2 = Burst slash 1/2; p3/p4 = CD/energy (not dmg).
 */
import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { VarkaStatTable, VarkaTalents } from "../generated/varka.gen.js";

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      // base normals (out of mode) — display order N1, N2.1, N2.2, N3.1, N3.2, N4.1, N4.2, N5.1, N5.2
      if (name === "normal_hit_1") return VarkaTalents.s1.p1; // N1 ≈ 129.3972
      if (name === "normal_hit_2") return VarkaTalents.s1.p3; // N2.1 ≈ 47.4191
      if (name === "normal_hit_3") return VarkaTalents.s1.p2; // N2.2 ≈ 88.0641
      if (name === "normal_hit_4") return VarkaTalents.s1.p5; // N3.1 ≈ 64.1184
      if (name === "normal_hit_5") return VarkaTalents.s1.p4; // N3.2 ≈ 119.077
      if (name === "normal_hit_6") return VarkaTalents.s1.p6; // N4.1 ≈ 109.574
      if (name === "normal_hit_7") return VarkaTalents.s1.p7; // N4.2 ≈ 59.0014
      if (name === "normal_hit_8") return VarkaTalents.s1.p8; // N5.1 ≈ 137.8775
      if (name === "normal_hit_9") return VarkaTalents.s1.p9; // N5.2 ≈ 74.2417
      if (name === "charged_hit_1") return VarkaTalents.s1.p10; // Charged 1 ≈ 169.286
      if (name === "charged_hit_2") return VarkaTalents.s1.p11; // Charged 2 ≈ 91.154
      if (name === "plunge_hit") return VarkaTalents.s1.p13; // collision ≈ 147.441
      if (name === "plunge_low") return VarkaTalents.s1.p14; // ≈ 294.8195
      if (name === "plunge_high") return VarkaTalents.s1.p15; // ≈ 368.2455
    }
    if (talent === "skill") {
      if (name === "skill_cast") return VarkaTalents.s2.p1; // Tap "Windbound Execution" ≈ 501.12 (anemo)
      // Sturm und Drang in-mode normals — display order N1, N2.1, N2.2, N3.1, N3.2, N4.1, N4.2, N5.1, N5.2
      if (name === "sturm_normal_1") return VarkaTalents.s2.p3; // Sturm N1 ≈ 161.7465 (phec leg)
      if (name === "sturm_normal_2") return VarkaTalents.s2.p5; // Sturm N2.1 ≈ 59.2739 (anemo leg)
      if (name === "sturm_normal_3") return VarkaTalents.s2.p4; // Sturm N2.2 ≈ 110.0801 (phec leg)
      if (name === "sturm_normal_4") return VarkaTalents.s2.p7; // Sturm N3.1 ≈ 80.148 (anemo leg)
      if (name === "sturm_normal_5") return VarkaTalents.s2.p6; // Sturm N3.2 ≈ 148.8463 (phec leg)
      if (name === "sturm_normal_6") return VarkaTalents.s2.p8; // Sturm N4.1 ≈ 136.9675 (phec leg)
      if (name === "sturm_normal_7") return VarkaTalents.s2.p9; // Sturm N4.2 ≈ 73.7517 (anemo leg)
      if (name === "sturm_normal_8") return VarkaTalents.s2.p10; // Sturm N5.1 ≈ 172.3469 (phec leg)
      if (name === "sturm_normal_9") return VarkaTalents.s2.p11; // Sturm N5.2 ≈ 92.8022 (anemo leg)
      if (name === "sturm_charged_1") return VarkaTalents.s2.p12; // Sturm Charged 1 ≈ 211.6075 (phec leg)
      if (name === "sturm_charged_2") return VarkaTalents.s2.p13; // Sturm Charged 2 ≈ 113.9425 (anemo leg)
      if (name === "four_winds_1") return VarkaTalents.s2.p14; // Four Winds' Ascension 1 ≈ 316.368 (phec leg)
      if (name === "four_winds_2") return VarkaTalents.s2.p15; // Four Winds' Ascension 2 ≈ 170.352 (anemo leg)
      if (name === "azure_devour_1") return VarkaTalents.s2.p16; // Azure Devour 1 ≈ 168.48 per-hit (phec leg, ×2)
      if (name === "azure_devour_2") return VarkaTalents.s2.p17; // Azure Devour 2 ≈ 90.72 per-hit (anemo leg, ×2)
    }
    if (talent === "burst") {
      if (name === "burst_hit_1") return VarkaTalents.s3.p1; // Northwind Avatar slash 1 ≈ 606.528 (anemo)
      if (name === "burst_hit_2") return VarkaTalents.s3.p2; // Northwind Avatar slash 2 ≈ 326.592 (anemo)
    }
    throw new Error(`varka talents: unknown path '${path}'`);
  },
};

// In-mode hits are SKILL-leveled (GO's `'skill'` leveling arg on each dmgNode) despite their normal/charged
// damage type — the Zibai gotcha (LEVELING_TO_SLOT decouples leveling from category).
const IN_MODE = "char_skill_elemental";

const features: readonly Feature[] = [
  // ── Base normals / charged / plunge: PHYSICAL (claymore, no innate infusion → resolveElement default), ATK ──
  { name: "normal_hit_1", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }] },
  { name: "normal_hit_2", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }] },
  { name: "normal_hit_3", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
  { name: "normal_hit_4", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
  { name: "normal_hit_5", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }] },
  { name: "normal_hit_6", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_6") }] },
  { name: "normal_hit_7", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_7") }] },
  { name: "normal_hit_8", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_8") }] },
  { name: "normal_hit_9", category: "attack", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_9") }] },
  { name: "charged_hit_1", category: "attack", damageType: "charged", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }] },
  { name: "charged_hit_2", category: "attack", damageType: "charged", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }] },
  { name: "plunge_hit", category: "attack", damageType: "plunge", multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_hit") }] },
  { name: "plunge_low", category: "attack", damageType: "plunge", tags: ["plunge_shockwave"], multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }] },
  { name: "plunge_high", category: "attack", damageType: "plunge", tags: ["plunge_shockwave"], multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }] },
  // ── Tap cast "Windbound Execution": ANEMO skill hit ──
  { name: "skill_cast", category: "skill", element: "anemo", multipliers: [{ leveling: IN_MODE, values: talents.get("skill.skill_cast") }] },
  // ── Sturm und Drang in-mode normals (skill-leveled, normal-type). Dual-claymore: anemo leg explicit,
  // phec leg PHYSICAL at C0 (no PHEC ally → resolveElement default; runtime PHEC resolver quarantined). ──
  { name: "sturm_normal_1", category: "attack", multipliers: [{ leveling: IN_MODE, values: talents.get("skill.sturm_normal_1") }] }, // phec leg → physical
  { name: "sturm_normal_2", category: "attack", element: "anemo", multipliers: [{ leveling: IN_MODE, values: talents.get("skill.sturm_normal_2") }] },
  { name: "sturm_normal_3", category: "attack", multipliers: [{ leveling: IN_MODE, values: talents.get("skill.sturm_normal_3") }] }, // phec leg → physical
  { name: "sturm_normal_4", category: "attack", element: "anemo", multipliers: [{ leveling: IN_MODE, values: talents.get("skill.sturm_normal_4") }] },
  { name: "sturm_normal_5", category: "attack", multipliers: [{ leveling: IN_MODE, values: talents.get("skill.sturm_normal_5") }] }, // phec leg → physical
  { name: "sturm_normal_6", category: "attack", multipliers: [{ leveling: IN_MODE, values: talents.get("skill.sturm_normal_6") }] }, // phec leg → physical
  { name: "sturm_normal_7", category: "attack", element: "anemo", multipliers: [{ leveling: IN_MODE, values: talents.get("skill.sturm_normal_7") }] },
  { name: "sturm_normal_8", category: "attack", multipliers: [{ leveling: IN_MODE, values: talents.get("skill.sturm_normal_8") }] }, // phec leg → physical
  { name: "sturm_normal_9", category: "attack", element: "anemo", multipliers: [{ leveling: IN_MODE, values: talents.get("skill.sturm_normal_9") }] },
  // ── Sturm und Drang in-mode charged (skill-leveled, charged-type) ──
  { name: "sturm_charged_1", category: "attack", damageType: "charged", multipliers: [{ leveling: IN_MODE, values: talents.get("skill.sturm_charged_1") }] }, // phec leg → physical
  { name: "sturm_charged_2", category: "attack", damageType: "charged", element: "anemo", multipliers: [{ leveling: IN_MODE, values: talents.get("skill.sturm_charged_2") }] },
  // ── Four Winds' Ascension (special Skill, skill-type, skill-leveled). Four Winds' phec leg is skill-category
  // → carries explicit element:"physical" to stay at the C0 physical state (skill default would be anemo). ──
  { name: "four_winds_1", category: "skill", element: "physical", multipliers: [{ leveling: IN_MODE, values: talents.get("skill.four_winds_1") }] }, // phec leg → physical at C0
  { name: "four_winds_2", category: "skill", element: "anemo", multipliers: [{ leveling: IN_MODE, values: talents.get("skill.four_winds_2") }] },
  // ── Azure Devour (special Charged Attack, charged-type, skill-leveled; per-hit value, fires ×2 in-game) ──
  { name: "azure_devour_1", category: "attack", damageType: "charged", multipliers: [{ leveling: IN_MODE, values: talents.get("skill.azure_devour_1") }] }, // phec leg → physical
  { name: "azure_devour_2", category: "attack", damageType: "charged", element: "anemo", multipliers: [{ leveling: IN_MODE, values: talents.get("skill.azure_devour_2") }] },
  // ── Burst "Northwind Avatar": 2 ANEMO slashes (hit-1 converts to PHEC only with a PHEC ally — quarantined;
  // GO's solo 'physical' on hit-1 is a phecElement-fallback sentinel, not the in-game element). ──
  { name: "burst_hit_1", category: "burst", element: "anemo", multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_hit_1") }] },
  { name: "burst_hit_2", category: "burst", element: "anemo", multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_hit_2") }] },
];

export const varka: DbObjectChar = {
  name: "varka",
  gameId: 10000128,
  rarity: 5,
  element: "anemo",
  weapon: "claymore",
  origin: "mondstadt",
  statTable: VarkaStatTable,
  talents,
  features,
  multipliers: [], // lean C0: no char-level damage multipliers (A1 final mult / A4 stacks / C-buffs quarantined)
  conditions: [], // C0 gateable surface; A1 / A4 / runtime-PHEC resolver / constellations quarantined
  postEffects: [], // pure talent% × ATK — no reaction/utility post-effect on his own hits
};
