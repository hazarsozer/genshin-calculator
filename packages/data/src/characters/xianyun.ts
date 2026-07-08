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
 * P3.5.3). The 3 C4 "mystery" heals (other.xianyun_mystery_{1,2,3}_heal, all
 * partyHeal:true, ConditionConstellation(4)) are also modelled (display-gap
 * burndown Task 4).
 *
 * SELF passives (Tier-B, ported):
 *   - A1 `xianyun_galefeather_pursuit` — a plunge crit-rate stacks condition
 *     (crit_rate_plunge 4/6/8/10 by stack 1-4). Ported as a `static-level` table
 *     gated by a `boolean-value` (settings[name] >= 1), so 0 stacks stays inert —
 *     raw/genshin_calc_pub/src/js/db/Char/Xianyun.js:299-317.
 *   - A4/C2 `xianyun_consider_the_adeptus_in_her_realm` — a Boolean-gated ATK→
 *     plunge-SHOCKWAVE DMG conversion (min(200%×ATK, 9000); C2 raises it to
 *     min(400%×ATK, 18000) via `xianyun_a4_level`). Ported as a self `CharMultiplier`
 *     (the same primitive as the already-ported teammate mirror) — raw Xianyun.js:319-328
 *     (self multiplier) + :374-383 (C2 level-2 publisher).
 *   - C6 `xianyun_cloudkeepers_spirit` — a `ConditionStacksLevels` stacks-table
 *     (crit_dmg_xianyun = [15,35,70] indexed directly by stack 1-3, non-cumulative,
 *     same shape as A1 galefeather), gated `and[constellation:6, stacks>=1]` (her
 *     `DbObjectConstellation.getConditions` only includes entry i when
 *     `char_constellation >= i+1` — array index 5 = C6). Ported as `static-level` +
 *     `boolean-value` (Galefeather precedent), wrapped in an explicit constellation
 *     gate. Folds into the 3 driftcloud-wave features via `critDamageBonuses`
 *     (base-inert opt-in) — raw Xianyun.js:427-441 + :216,227,238 (the bonus keys).
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
  // element='anemo', critDamageBonuses=['crit_dmg_xianyun'] (C6 cloudkeepersSpirit stacks — see
  // cloudkeepersSpirit condition below; base-inert opt-in, reads 0 stacks/C<6).
  // damageType resolves to 'plunge' (PlungeShockWave) → dmg_plunge bonus, matching fixture.
  {
    name: "xianyun_driftcloud_wave_1_dmg",
    category: "skill",
    element: "anemo",
    damageType: "plunge",
    tags: ["plunge_shockwave"],
    critDamageBonuses: ["crit_dmg_xianyun"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.xianyun_driftcloud_wave_1_dmg") }],
  },
  // raw: FeatureDamagePlungeShockWave (no name → xianyun_driftcloud_wave_2_dmg), category='skill'
  {
    name: "xianyun_driftcloud_wave_2_dmg",
    category: "skill",
    element: "anemo",
    damageType: "plunge",
    tags: ["plunge_shockwave"],
    critDamageBonuses: ["crit_dmg_xianyun"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.xianyun_driftcloud_wave_2_dmg") }],
  },
  // raw: FeatureDamagePlungeShockWave (no name → xianyun_driftcloud_wave_3_dmg), category='skill'
  {
    name: "xianyun_driftcloud_wave_3_dmg",
    category: "skill",
    element: "anemo",
    damageType: "plunge",
    tags: ["plunge_shockwave"],
    critDamageBonuses: ["crit_dmg_xianyun"],
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
  // --- C4 "The Wine-Cellar's Cloudy Vintage" mystery heals (other.xianyun_mystery_{1,2,3}_heal) ---
  // raw: 3× FeatureHeal({ category:'other', partyHeal:true, multipliers:[FeatureMultiplier({
  //   source:'constellation4', values:new StatTable('xianyun_mystery_{1,2,3}_heal', [50/80/150]) })],
  //   condition:ConditionConstellation({constellation:4}) })  Xianyun.js:284-316. No `scaling` field
  // on any of the three → default atk* (same as heal/heal_dot above). ALL THREE carry
  // `partyHeal:true` in raw — this corrects an earlier assumption that mystery_1 was self-only;
  // verified directly against Xianyun.js:284-293 (mystery_1's own FeatureHeal block also sets
  // `partyHeal: true`, identical to mystery_2/_3). Constant values → leveling:"".
  {
    name: "xianyun_mystery_1_heal",
    category: "other",
    output: { kind: "heal", partyHeal: true },
    condition: { type: "constellation", constellation: 4 },
    multipliers: [
      { scaling: "atk", leveling: "", values: { getValue: () => 50 }, source: "constellation4" },
    ],
  },
  {
    name: "xianyun_mystery_2_heal",
    category: "other",
    output: { kind: "heal", partyHeal: true },
    condition: { type: "constellation", constellation: 4 },
    multipliers: [
      { scaling: "atk", leveling: "", values: { getValue: () => 80 }, source: "constellation4" },
    ],
  },
  {
    name: "xianyun_mystery_3_heal",
    category: "other",
    output: { kind: "heal", partyHeal: true },
    condition: { type: "constellation", constellation: 4 },
    multipliers: [
      { scaling: "atk", leveling: "", values: { getValue: () => 150 }, source: "constellation4" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Purifying Wind": ConditionStatic, no real stats — SKIP.
// C2 "Aloof from the World": ConditionBoolean toggle (atk_percent:20) + a settings-publisher
//   (xianyun_a4_level:2, the A4 conversion's level-2 tier) — both ported below.
// C3 "Creations of Star and Moon": +3 burst talent (char_skill_burst_bonus).
// C4 "Mystery Millet Gourmet": ConditionStatic with text_percent (display-only) — SKIP; the
//   actual heals are the other.xianyun_mystery_{1,2,3}_heal features above (display-gap
//   burndown Task 4).
// C5 "Astride Rose-Tinted Clouds": +3 skill talent (char_skill_elemental_bonus).
// C6 "They Call Her Cloud Retainer": ConditionStacksLevels (crit_dmg_xianyun) —
//   ported below as `cloudkeepersSpirit` (stacks-table, base-inert at 0 stacks).
// Sources: raw/genshin_calc_pub/src/js/db/Char/Xianyun.js:364-445

const constellationConditions: readonly Condition[] = [
  // SELF "Aloof from the World" (C2) — +20% ATK, lifting every Xianyun (ATK-scaled) damage feature.
  // ConditionBoolean gated at C2. SELF mirror of party.xianyun_aloof_from_the_world; the port
  // modelled only the party.* version → golden-blind SKIP. atk_percent:20.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Xianyun.js:374-383 (constellation[1] conditions[0]).
  {
    type: "boolean",
    name: "xianyun_aloof_from_the_world",
    stats: { atk_percent: 20 },
    condition: { type: "constellation", constellation: 2 },
  },
  // C2's second condition (constellation[1] conditions[1]) — a settings-publisher raising the A4
  // ATK→plunge-dmg conversion's `xianyun_a4_level` to 2 (400%×ATK, cap 18000; see `multipliers`
  // below). Same idiom as C3/C5's talent-bonus publishers.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Xianyun.js:384-393 (settings: {xianyun_a4_level: 2}).
  { type: "constellation", constellation: 2, settings: { xianyun_a4_level: 2 } },
  // C3 — +3 Elemental Burst (Stars Gather at Dusk).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5 — +3 Elemental Skill (White Clouds at Dawn).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// A1 "Galefeather Pursuit" (raw Xianyun.js:299-317, ConditionStacksLevels) — a plunge crit-rate
// stacks condition. realStats crit_rate_plunge = [4,6,8,10] indexed DIRECTLY by stack count
// (1-4, non-cumulative table lookup — her ConditionStacksLevels.getStats calls
// `real.getValue(stacksCnt)`, NOT the base ConditionStacks per-stack×count multiply). Ported as
// `static-level` (levelSetting reads the stack-count setting as-is, no `fromZero`) gated by a
// `boolean-value` (>=1) so 0 stacks stays inactive — static-level alone defaults level to 1 when
// the setting is absent (her `getLevel || 1`), which would wrongly contribute crit_rate_plunge:4
// at rest; the gate reproduces her `ConditionStacks.isActive` (settings[name] > 0) exactly.
// The ascension-1 subcondition is dropped (always true at full ascension, matching every other
// A1/A4 gate in this port). maxStacks=4 clamping is inherited free from staticLevelGetValue's
// level>length→last-value clamp (identical to StatTable.getValue).
const galefeatherPursuit: Condition = {
  type: "static-level",
  levelSetting: "xianyun_galefeather_pursuit",
  levelStats: { crit_rate_plunge: [4, 6, 8, 10] },
  condition: { type: "boolean-value", setting: "xianyun_galefeather_pursuit", cond: "ge", value: 1 },
};

// C6 "They Call Her Cloud Retainer" (raw Xianyun.js:427-441, ConditionStacksLevels,
// serializeId 4) — crit_dmg_xianyun = [15, 35, 70] indexed DIRECTLY by stack count (1-3,
// maxStacks:3, non-cumulative table lookup, same `static-level` + `boolean-value` shape as
// A1 galefeatherPursuit above). Unlike A1 (ascension-gated, always true), this entry lives at
// constellation-array index 5 → her `DbObjectConstellation.getConditions(level)` only splices
// it in when `char_constellation >= 5+1 = 6` — so the port needs an EXPLICIT constellation
// gate (Gorou/Chiori `and[]` precedent), combined with the stacks>=1 activity gate.
const cloudkeepersSpirit: Condition = {
  type: "static-level",
  levelSetting: "xianyun_cloudkeepers_spirit",
  levelStats: { crit_dmg_xianyun: [15, 35, 70] },
  condition: {
    type: "and",
    items: [
      { type: "constellation", constellation: 6 },
      { type: "boolean-value", setting: "xianyun_cloudkeepers_spirit", cond: "ge", value: 1 },
    ],
  },
};

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
  // Xianyun's OWN A4 self-multiplier (Xianyun.js:319-328) — the SELF mirror of the already-ported
  // teammate version, reusing the SAME CharMultiplier primitive (Shenhe Icy Quill precedent).
  // min(ratio×her own atk_total, cap); ratio/cap read `xianyun_a4_level` (1 → 200%/9000, 2 →
  // 400%/18000 via the C2 publisher above). Gated by the A4 master toggle; targets
  // plunge_shockwave-tagged features only (damageTypes:[] = no type filter).
  multipliers: [
    {
      source: "ascension4",
      scaling: "atk",
      leveling: "xianyun_a4_level",
      values: { getValue: (level) => (level >= 2 ? 400 : 200) },
      capValueFromTable: { table: [9000, 18000], levelSetting: "xianyun_a4_level" },
      condition: { type: "boolean", name: "xianyun_consider_the_adeptus_in_her_realm" },
      target: { damageTypes: [], tags: ["plunge_shockwave"] },
    } satisfies CharMultiplier,
  ],
  conditions: [...constellationConditions, galefeatherPursuit, cloudkeepersSpirit],
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
