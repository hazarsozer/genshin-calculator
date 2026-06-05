/**
 * Xianyun — anemo catalyst, plunge-focused.
 *
 * Direct anemo features modelled for the solo C0 fixed build:
 *   - 3-hit normal combo (normal_hit_1/2/3), charged attack, plunge collision +
 *     low/high shockwave. All anemo (her normals are anemo-infused by kit).
 *   - Skill: skill_dmg (FeatureDamageSkill) plus 3 driftcloud-wave hits. The waves
 *     are FeatureDamagePlungeShockWave in raw → category "skill" but damageType
 *     "plunge" (so the dmg_<type> key is dmg_plunge, matching the fixture).
 *   - Burst: burst_dmg + xianyun_starwicker_dmg.
 *
 * Heals (burst.heal, burst.heal_dot) modelled as output:{kind:"heal"} (ATK-scaled,
 * P3.5.3). The 3 C4 "mystery" heals (ConditionConstellation(4)) stay omitted (solo C0).
 *
 * SOLO-C0 OFF passives (deliberately not folded):
 *   - A1 `xianyun_galefeather_pursuit` — a plunge crit-rate stacks condition
 *     (crit_rate_plunge), party/stack-gated → 0 in solo build.
 *   - A4 `xianyun_consider_the_adeptus_in_her_realm` — a Boolean-gated flat ATK%
 *     bonus to plunge_shockwave hits; the char-level multiplier is condition-gated
 *     OFF (and char-level `multipliers` are not applied by compileCharacter anyway).
 *   - C6 `xianyun_cloudkeepers_spirit` (crit_dmg_xianyun on the driftcloud waves) —
 *     a constellation stacks bonus → absent at C0; the raw critDamageBonuses key
 *     reads 0 and is dropped here.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Xianyun.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Xianyun)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Xianyun)
 */

import type { CharMultiplier, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Xianyun as XianyunStatTable } from "../generated/charTables.js";
import { Xianyun as XianyunTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return XianyunTalents.s1.p1;
      if (name === "normal_hit_2") return XianyunTalents.s1.p2;
      if (name === "normal_hit_3") return XianyunTalents.s1.p3;
      if (name === "charged_hit")  return XianyunTalents.s1.p5;
      if (name === "plunge")       return XianyunTalents.s1.p7;
      if (name === "plunge_low")   return XianyunTalents.s1.p8;
      if (name === "plunge_high")  return XianyunTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "skill_dmg")                    return XianyunTalents.s2.p1;
      if (name === "xianyun_driftcloud_wave_1_dmg") return XianyunTalents.s2.p2;
      if (name === "xianyun_driftcloud_wave_2_dmg") return XianyunTalents.s2.p3;
      if (name === "xianyun_driftcloud_wave_3_dmg") return XianyunTalents.s2.p4;
    }
    if (talent === "burst") {
      if (name === "burst_dmg")               return XianyunTalents.s3.p1;
      if (name === "xianyun_starwicker_dmg")  return XianyunTalents.s3.p2;
      if (name === "heal_percent")     return XianyunTalents.s3.p4;
      if (name === "heal_flat")        return XianyunTalents.s3.p3;
      if (name === "heal_dot_percent") return XianyunTalents.s3.p6;
      if (name === "heal_dot_flat")    return XianyunTalents.s3.p5;
    }
    throw new Error(`xianyun talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (anemo) ---
  // raw: FeatureDamageNormal element='anemo' (no name → normal_hit_1/2/3)
  {
    name: "normal_hit_1",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // --- Charged attack (anemo) ---
  // raw: FeatureDamageCharged element='anemo' (no name → charged_hit)
  {
    name: "charged_hit",
    category: "attack",
    element: "anemo",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (anemo) ---
  // raw: FeatureDamagePlungeCollision element='anemo' (plunge)
  {
    name: "plunge",
    category: "attack",
    element: "anemo",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave element='anemo' (plunge_low)
  // tags:["plunge_shockwave"] — her ShockWave.js:8 constructor pushes it (target of her own A4 buff).
  {
    name: "plunge_low",
    category: "attack",
    element: "anemo",
    damageType: "plunge",
    tags: ["plunge_shockwave"],
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave element='anemo' (plunge_high)
  {
    name: "plunge_high",
    category: "attack",
    element: "anemo",
    damageType: "plunge",
    tags: ["plunge_shockwave"],
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: White Clouds at Dawn (anemo) ---
  // raw: FeatureDamageSkill element='anemo' (no name → skill_dmg)
  {
    name: "skill_dmg",
    category: "skill",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // raw: FeatureDamagePlungeShockWave name='xianyun_driftcloud_wave_1_dmg', category='skill',
  // element='anemo', critDamageBonuses=['crit_dmg_xianyun'] (C6 stacks → 0 at C0, dropped).
  // damageType resolves to 'plunge' (PlungeShockWave) → dmg_plunge bonus, matching fixture.
  {
    name: "xianyun_driftcloud_wave_1_dmg",
    category: "skill",
    element: "anemo",
    damageType: "plunge",
    tags: ["plunge_shockwave"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.xianyun_driftcloud_wave_1_dmg") }],
  },
  // raw: FeatureDamagePlungeShockWave (no name → xianyun_driftcloud_wave_2_dmg), category='skill'
  {
    name: "xianyun_driftcloud_wave_2_dmg",
    category: "skill",
    element: "anemo",
    damageType: "plunge",
    tags: ["plunge_shockwave"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.xianyun_driftcloud_wave_2_dmg") }],
  },
  // raw: FeatureDamagePlungeShockWave (no name → xianyun_driftcloud_wave_3_dmg), category='skill'
  {
    name: "xianyun_driftcloud_wave_3_dmg",
    category: "skill",
    element: "anemo",
    damageType: "plunge",
    tags: ["plunge_shockwave"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.xianyun_driftcloud_wave_3_dmg") }],
  },
  // --- Burst: Stars Gather at Dusk (anemo) ---
  // raw: FeatureDamageBurst element='anemo' (no name → burst_dmg)
  {
    name: "burst_dmg",
    category: "burst",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // raw: FeatureDamageBurst element='anemo' (no name → xianyun_starwicker_dmg)
  {
    name: "xianyun_starwicker_dmg",
    category: "burst",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.xianyun_starwicker_dmg") }],
  },
  // --- Burst heals (FeatureHeal) — ATK-scaled (her default), output:{kind:"heal"} ---
  // burst.heal: cast heal — ATK% (s3.p4) + flat (s3.p3). burst.heal_dot: field per-tick — ATK% (s3.p6) + flat (s3.p5).
  // raw/genshin_calc_pub/src/js/db/Char/Xianyun.js:264-283 (FeatureMultiplierList, char_skill_burst, partyHeal).
  // The 3 C4 "mystery" heals (ConditionConstellation(4)) are gated OFF at C0 → omitted.
  {
    name: "heal",
    category: "burst",
    output: { kind: "heal", partyHeal: true },
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.heal_percent"), flatValues: talents.get("burst.heal_flat") },
    ],
  },
  {
    name: "heal_dot",
    category: "burst",
    output: { kind: "heal", partyHeal: true },
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.heal_dot_percent"), flatValues: talents.get("burst.heal_dot_flat") },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Purifying Wind": ConditionStatic, no real stats — SKIP.
// C2 "Aloof from the World": ConditionBoolean toggle (atk_percent:20) — SKIP.
// C3 "Creations of Star and Moon": +3 burst talent (char_skill_burst_bonus).
// C4 "Mystery Millet Gourmet": ConditionStatic with text_percent (display-only) — SKIP.
// C5 "Astride Rose-Tinted Clouds": +3 skill talent (char_skill_elemental_bonus).
// C6 "They Call Her Cloud Retainer": ConditionStacksLevels (crit_dmg_xianyun) —
//   stacks toggle, OFF at canonial C6 build (toggles off) → reads 0. SKIP.
// Sources: raw/genshin_calc_pub/src/js/db/Char/Xianyun.js:364-445

const constellationConditions: readonly Condition[] = [
  // C3 — +3 Elemental Burst (Stars Gather at Dusk).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5 — +3 Elemental Skill (White Clouds at Dawn).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

// partyData (P3.5.2 Xianyun sub-pass) — her A4 "Consider, the Adeptus in Her Realm"
// teammate buff: adds min(200% × Xianyun's ATK, 9000) plunge-SHOCKWAVE DMG to every party
// member, targeted via tags:["plunge_shockwave"] (the feature-tags subsystem). NOT the
// plunge collision — damageTypes:['plunge'] would wrongly buff it; only the tag discriminates.
// Source: raw/genshin_calc_pub/src/js/db/Char/Xianyun.js:446-514.
export const xianyun: DbObjectChar = {
  name: "xianyun",
  gameId: 10000093,
  rarity: 5,
  element: "anemo",
  weapon: "catalyst",
  origin: "liyue",
  statTable: XianyunStatTable,
  talents,
  features,
  // Xianyun's OWN A4 self-multiplier (Xianyun.js:319-328, also tags:['plunge_shockwave'])
  // stays unported — pre-existing scope decision; her solo golden matches at HEAD without it.
  multipliers: [],
  conditions: constellationConditions,
  partyData: {
    loadStats: { stats: ["atk_total"] },
    conditions: [
      // Lift Xianyun's atk_total into the recipient bag as xianyun_atk_total (the multiplier's
      // scaling). raw: ConditionNumber({name:'xianyun_atk_total', partyStat:'atk_total', max:10000}).
      { type: "number", name: "xianyun_atk_total", max: 10000 },
      // A4 master toggle gating the buff (raw: party.xianyun_consider_the_adeptus_in_her_realm).
      { type: "boolean", name: "party.xianyun_consider_the_adeptus_in_her_realm" },
    ],
    multipliers: [
      // A4: min(200% × xianyun_atk_total, 9000) summed into the base-damage term of every
      // plunge-SHOCKWAVE hit (tags:["plunge_shockwave"]) of the recipient — NOT the plunge
      // collision. damageTypes:[] = no type filter (the tag is the only constraint).
      // C0/level-1 only: the C2 level-2 variant (400% × ATK capped 18000, via
      // xianyun_a4_level_party=2) is DEFERRED — it needs a leveled values+capValue
      // (cf. Sigewinne E5 level-indexed cap). The C0 rep is exact at 200% / cap 9000.
      // raw/genshin_calc_pub/src/js/db/Char/Xianyun.js:501-512
      {
        source: "xianyun",
        scaling: "xianyun_atk_total",
        leveling: "",
        values: { getValue: () => 200 },
        capValue: 9000,
        condition: { type: "boolean", name: "party.xianyun_consider_the_adeptus_in_her_realm" },
        target: { damageTypes: [], tags: ["plunge_shockwave"] },
      } satisfies CharMultiplier,
    ],
  },
};
