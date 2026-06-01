/**
 * Shared stat-block presets for the parameterized golden harness and carriedFixes.
 *
 * Both presets come verbatim from tools/oracle/build-configs.mjs:
 *   SAMPLE_BLOCK   — the fixed canonical "sampleStats" build used across all oracle families
 *   HIGH_ATK_HP_BLOCK — the "high-atk-hp" build that exercises percent-cap post-effects
 *
 * Sources:
 *   tools/oracle/build-configs.mjs (FIXED_BUILD / HIGH_ATK_HP_BLOCK)
 *   tests/golden/fixtures/_manifest.json (base.statBlock)
 *   packages/data/src/__tests__/carriedFixes.test.ts (original inline literals)
 */

/** Fixed canonical block (sampleStats) — tests/golden/fixtures/_manifest.json `base`. */
export const SAMPLE_BLOCK = {
  atk_base: 871,
  atk_percent: 18,
  crit_dmg_base: 50,
  crit_rate_base: 5,
  def_base: 876,
  dmg_burst: 64,
  dmg_charged: 16,
  dmg_electro: 2,
  dmg_normal: 8,
  dmg_phys: 4,
  dmg_skill: 32,
  hp_base: 13226,
  mastery_base: 55,
  recharge_base: 100,
} as const;

/** high-ATK/high-HP block — tools/oracle/build-configs.mjs HIGH_ATK_HP_BLOCK. */
export const HIGH_ATK_HP_BLOCK = {
  recharge_base: 100,
  hp_base: 30000,
  atk_base: 871,
  def_base: 876,
  crit_dmg_base: 200,
  crit_rate_base: 70,
  dmg_pyro: 46.6,
  dmg_normal: 8,
  dmg_charged: 16,
  dmg_skill: 32,
  dmg_burst: 64,
  mastery_base: 200,
  atk_percent: 50,
  hp_percent: 46.6,
} as const;
