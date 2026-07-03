import { describe, it, expect } from "vitest";
import { buildStatSheet } from "../statSheet";

// Real bag keys (dumped from computeBuild's default Bennett build, see task-1-report.md
// for the full Object.keys(result.stats!) list). The brief's sample fixture assumed
// `atk`/`hp`/`def`/`crit_rate`/`crit_damage`/`heal`/`heal_income`/`dmg_physical` — the
// actual bag uses `atk_total`/`hp_total`/`def_total`/`crit_rate_total`/`crit_dmg_total`/
// `healing`/`healing_recv`/`dmg_phys`, and only `atk` decomposes via a separate
// `atk_base` key (hp/def have no `_base` counterpart in the emitted bag).
//
// Unit note (review fix): the engine emits `crit_rate_total`/`crit_dmg_total`, all
// `dmg_*` bonuses, and `shield` as 0-1 FRACTIONS (buildStats.ts's own `/100` at emit —
// see FRACTION_SCALE_KEYS in statSheet.ts for the exact citations), while
// `recharge_total` is a raw already-scaled number (FLAT_TOTAL_STATS, no `/100`). This
// fixture mirrors that: crit/dmg values are realistic fractions (0.66, 1.762, 0.616,
// 0.15), recharge_total stays a raw percent-point number (130).
const STATS: Record<string, number> = {
  hp_total: 25123,
  atk_total: 3293,
  atk_base: 1183,
  def_total: 900,
  mastery: 187,
  recharge_total: 130,
  crit_rate_total: 0.66,
  crit_dmg_total: 1.762,
  healing: 0,
  healing_recv: 0,
  shield: 0,
  dmg_pyro: 0.616,
  dmg_hydro: 0,
  dmg_normal: 0,
  dmg_all: 0.15,
  some_char_specific_key: 42,
};

describe("buildStatSheet", () => {
  it("computes base/bonus/total for core stats", () => {
    const groups = buildStatSheet(STATS);
    const base = groups.find((g) => g.title === "Base Stats")!;
    const atk = base.rows.find((r) => r.key === "atk_total")!;
    expect(atk).toMatchObject({ base: 1183, bonus: 2110, total: 3293, format: "flat" });
  });

  it("percent stats have null base and bonus == total", () => {
    const rows = buildStatSheet(STATS).flatMap((g) => g.rows);
    const pyro = rows.find((r) => r.key === "dmg_pyro")!;
    expect(pyro).toMatchObject({ base: null, bonus: 61.6, total: 61.6, format: "percent" });
  });

  it("normalizes fraction-scale bag values (crit/dmg/reaction/shield/healing) to percent points, but leaves recharge_total (already a raw percent-point number) untouched", () => {
    const rows = buildStatSheet(STATS).flatMap((g) => g.rows);
    const critRate = rows.find((r) => r.key === "crit_rate_total")!;
    const critDmg = rows.find((r) => r.key === "crit_dmg_total")!;
    const recharge = rows.find((r) => r.key === "recharge_total")!;
    expect(critRate).toMatchObject({ total: 66, format: "percent" });
    expect(critDmg).toMatchObject({ total: 176.2, format: "percent" });
    expect(recharge).toMatchObject({ total: 130, format: "percent" });
  });

  it("hides zero-value optional rows but always shows the core set", () => {
    const rows = buildStatSheet(STATS).flatMap((g) => g.rows).map((r) => r.key);
    expect(rows).not.toContain("dmg_hydro"); // zero, optional → hidden
    expect(rows).toContain("mastery"); // core → always shown even at 0 elsewhere
  });

  it("unknown keys land visibly in Other (flag-don't-hide)", () => {
    const other = buildStatSheet(STATS).find((g) => g.title === "Other")!;
    expect(other.rows.map((r) => r.key)).toContain("some_char_specific_key");
  });

  it("excludes internal keys (enemy_*, *_base) from Other", () => {
    const other = buildStatSheet({ ...STATS, enemy_res_pyro: 10 }).find((g) => g.title === "Other");
    expect(other?.rows.map((r) => r.key) ?? []).not.toContain("enemy_res_pyro");
    expect(other?.rows.map((r) => r.key) ?? []).not.toContain("atk_base");
  });
});
