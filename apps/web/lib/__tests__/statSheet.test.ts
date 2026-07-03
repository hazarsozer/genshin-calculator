import { describe, it, expect } from "vitest";
import { buildStatSheet } from "../statSheet";

// Real bag keys (dumped from computeBuild's default Bennett build, see task-1-report.md
// for the full Object.keys(result.stats!) list). The brief's sample fixture assumed
// `atk`/`hp`/`def`/`crit_rate`/`crit_damage`/`heal`/`heal_income`/`dmg_physical` — the
// actual bag uses `atk_total`/`hp_total`/`def_total`/`crit_rate_total`/`crit_dmg_total`/
// `healing`/`healing_recv`/`dmg_phys`, and only `atk` decomposes via a separate
// `atk_base` key (hp/def have no `_base` counterpart in the emitted bag).
const STATS: Record<string, number> = {
  hp_total: 25123,
  atk_total: 3293,
  atk_base: 1183,
  def_total: 900,
  mastery: 187,
  recharge_total: 130,
  crit_rate_total: 66,
  crit_dmg_total: 176.2,
  healing: 0,
  healing_recv: 0,
  shield: 0,
  dmg_pyro: 61.6,
  dmg_hydro: 0,
  dmg_normal: 0,
  dmg_all: 15,
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

  it("hides a core row's decomposed base pair from Other even though atk_base isn't in the registry directly", () => {
    const other = buildStatSheet(STATS).find((g) => g.title === "Other");
    expect(other?.rows.map((r) => r.key) ?? []).not.toContain("atk_base");
  });
});
