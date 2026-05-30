import { describe, it, expect } from "vitest";
import type { EvalContext } from "@genshin/types";
import { Stats } from "../Stats.js";
import { applyPostEffects, type PostEffect } from "../postEffects.js";

describe("post-effect ordering: aggregate → derive → read", () => {
  it("HP→ATK post-effect applied AFTER aggregation, BEFORE formula reads", () => {
    // Aggregate phase: set raw stats
    const s = new Stats();
    s.add("hp_base", 10000);
    s.add("hp_percent", 0);      // 0% hp bonus
    s.add("hp", 0);              // 0 flat hp
    s.add("atk_base", 100);
    s.add("atk_percent", 0);
    s.add("atk", 0);

    // The HP→ATK post-effect: adds (hp_total * ratio) to flat atk
    // This must run AFTER aggregation but BEFORE totalATK is consumed
    // hp_total = 10000 * (1 + 0/100) + 0 = 10000
    // hp_to_atk: 4% of max HP, with a cap of 400% of base ATK
    const ratio = 0.04; // 4% of HP
    const cap = s.get("atk_base") * 4; // 400% of base ATK = 400

    const hpToAtkEffect: PostEffect = {
      priority: 1,
      contribute(readStats: Stats): Record<string, number> {
        const hpTotal = readStats.getTotal("hp");
        const bonus = Math.min(hpTotal * ratio, cap);
        return { atk: bonus };
      },
    };

    // Before post-effect: total atk = 100 (just base)
    const atkBeforeEffect = s.getTotal("atk");
    expect(atkBeforeEffect).toBe(100);

    // Apply post-effect
    applyPostEffects(s, [hpToAtkEffect]);

    // After post-effect: flat atk += min(10000 * 0.04, 400) = min(400, 400) = 400
    // total atk = 100 * (1 + 0/100) + (0 + 400) = 500
    const atkAfterEffect = s.getTotal("atk");
    expect(atkAfterEffect).toBe(500);
  });

  it("post-effects run in priority order (lower priority first)", () => {
    const s = new Stats();
    const log: number[] = [];

    const effects: PostEffect[] = [
      { priority: 3, contribute: () => { log.push(3); return {}; } },
      { priority: 1, contribute: () => { log.push(1); return {}; } },
      { priority: 2, contribute: () => { log.push(2); return {}; } },
    ];

    applyPostEffects(s, effects);
    expect(log).toEqual([1, 2, 3]);
  });

  it("post-effects at the same priority all run before higher-priority ones", () => {
    const s = new Stats();
    s.add("atk_base", 100);

    const effects: PostEffect[] = [
      {
        priority: 2,
        contribute(): Record<string, number> { return { atk: 50 }; },
      },
      {
        priority: 1,
        contribute(): Record<string, number> { return { atk_base: 10 }; },
      },
    ];

    applyPostEffects(s, effects);
    // Priority 1 runs first: atk_base becomes 110
    // Priority 2 runs second: atk flat += 50
    // total atk = 110 + 50 = 160
    expect(s.getTotal("atk")).toBe(160);
  });

  it("threads the settings EvalContext to contribute() (condition-gated effect)", () => {
    // Her getData(this, settings): a post-effect can gate on settings. Here the
    // HP→ATK bonus only applies when settings.hutao_paramita_papilio is truthy.
    const s = new Stats();
    s.add("hp_base", 20000);
    s.add("atk_base", 800);

    const gatedEffect: PostEffect = {
      priority: 1,
      contribute(readStats: Stats, settings: EvalContext): Record<string, number> {
        if (!settings["hutao_paramita_papilio"]) return {};
        return { atk: readStats.getTotal("hp") * 0.02 };
      },
    };

    // Settings OFF → effect contributes nothing → atk_total = 800
    const off = new Stats(s.toRecord());
    applyPostEffects(off, [gatedEffect], {});
    expect(off.getTotal("atk")).toBe(800);

    // Settings ON → effect contributes 20000*0.02=400 → atk_total = 1200
    const on = new Stats(s.toRecord());
    applyPostEffects(on, [gatedEffect], { hutao_paramita_papilio: true });
    expect(on.getTotal("atk")).toBeCloseTo(1200, 5);
  });

  it("defaults settings to an empty context when omitted", () => {
    const s = new Stats();
    s.add("atk_base", 500);
    let seen: EvalContext | undefined;
    const effect: PostEffect = {
      priority: 1,
      contribute(_readStats: Stats, settings: EvalContext): Record<string, number> {
        seen = settings;
        return {};
      },
    };
    applyPostEffects(s, [effect]);
    expect(seen).toEqual({});
  });

  it("applying no post-effects leaves stats unchanged", () => {
    const s = new Stats();
    s.add("atk_base", 500);
    applyPostEffects(s, []);
    expect(s.getTotal("atk")).toBe(500);
  });

  it("getTotal reads AFTER post-effects to give correct total", () => {
    // Demonstrates the aggregate→derive→read contract:
    // If you read totals BEFORE post-effects, you get a wrong answer.
    const s = new Stats();
    s.add("hp_base", 20000);
    s.add("atk_base", 800);

    // Without post-effects: atk_total = 800
    expect(s.getTotal("atk")).toBe(800);

    // HP→ATK: 2% HP, no cap in this test
    const effect: PostEffect = {
      priority: 1,
      contribute(readStats: Stats): Record<string, number> {
        const hpTotal = readStats.getTotal("hp");
        return { atk: hpTotal * 0.02 };
      },
    };
    applyPostEffects(s, [effect]);

    // After: atk_total = 800 + 20000 * 0.02 = 800 + 400 = 1200
    expect(s.getTotal("atk")).toBeCloseTo(1200, 5);
  });

  it("same-priority effects read pre-group snapshot (isolation: 400, not 900)", () => {
    // Regression for the batching bug: two same-priority effects where B reads
    // a stat that A writes. With sequential (buggy) logic, B sees A's write and
    // the result is 900. With correct batch isolation (her Stats.js:213-222), B
    // reads the PRE-GROUP stats, so the result is 400.
    //
    // Setup:
    //   atk_base = 100  →  atk_total (pre-group) = 100
    //
    // Effect A (priority 1): writes atk += 500
    //   Sequential (wrong): stats.atk += 500 → atk_total becomes 600
    //
    // Effect B (priority 1): reads atk_total, writes atk += atk_total * 0.5
    //   Sequential (wrong): sees 600 → contributes 300 → final atk_total = 900
    //   Batched  (correct): sees pre-group 100 → contributes 50 → final atk_total = 650
    //   Wait — let's re-derive the exact 400/900 case from the brief.
    //
    // Brief scenario (400 not 900):
    //   atk_base = 100, atk = 0  →  atk_total = 100
    //   A (priority 1): contribute { atk: 800 }
    //   B (priority 1): reads atk_total, contribute { atk: atk_total * 4 }
    //     Sequential:  B sees 100+800=900 → atk = 0+800 + 900*4 = 4400 → too large
    //   Let's use the exact numbers from the brief directly:
    //   "for two same-priority effects where B reads a stat A writes, her result = 400, the current port = 900"
    //   So the final stat (what we assert) is 400 (batched) vs 900 (sequential).
    //
    //   Minimal construction:
    //     atk_base = 0, atk = 0
    //     A: contribute { atk: 500 }          — writes atk
    //     B: reads atk (flat), contributes { atk: atk * 0.8 }
    //        Batched:     reads atk=0  → +0    → total atk = 500 + 0  = 500  (not 400/900)
    //
    //   Exact brief reproduction (the two-stat case):
    //     Start: hp_base=0, hp=0, atk_base=0, atk=0
    //     A: contribute { hp: 1000 }  — writes hp flat
    //     B: reads hp_total, contribute { atk: hp_total * 0.4 }
    //        Sequential (wrong): B sees hp_total=1000 → atk += 400 → final atk=400... wait that IS 400.
    //
    //   The brief says sequential gives 900, batched gives 400. Let's use that directly:
    //     Start: atk_base=0, atk=500  — pre-existing flat atk
    //     A (priority 1): reads atk, writes { atk: atk * 0.8 }  i.e. adds 500*0.8=400
    //     B (priority 1): reads atk, writes { atk: atk * 0.8 }  same formula
    //       Sequential: A runs first → atk=500+400=900, B sees 900 → +720 (not 900 result)
    //
    //   Simplest case that gives exactly 400 vs 900:
    //     Start: hp_base=0, hp=0, atk_base=0, atk=0
    //     A (priority 1): contribute { hp: 500 }     — sets hp flat to 500
    //     B (priority 1): reads hp_total (hp_base + hp) → contribute { atk: hp_total }
    //       Batched (correct): B reads pre-group hp_total=0 → atk += 0. (still wrong)
    //
    //   Direct from brief: "her result = 400, current port = 900"
    //   Work backwards: 900 - 400 = 500 extra. A writes something that B over-reads by 500.
    //     Start: atk=0
    //     A: writes { atk: 400 }
    //     B: reads stats.atk (flat), writes { atk: stats.atk * 1.25 }
    //       Batched:     B reads pre-group atk=0 → contributes 0      → final atk = 0+400+0   = 400 ✓
    //       Sequential:  A applies atk=400, B reads atk=400 → 400*1.25=500 → final atk=400+500=900 ✓
    //
    const s = new Stats();
    // atk starts at 0 (base and flat both 0)

    const effectA: PostEffect = {
      priority: 1,
      contribute(): Record<string, number> {
        // Writes atk flat += 400
        return { atk: 400 };
      },
    };

    const effectB: PostEffect = {
      priority: 1,
      contribute(readStats: Stats): Record<string, number> {
        // Reads pre-group atk flat (the stat A writes), multiplies by 1.25
        // Batched (correct):    reads 0   → contributes 0
        // Sequential (buggy):  reads 400  → contributes 500
        return { atk: readStats.get("atk") * 1.25 };
      },
    };

    applyPostEffects(s, [effectA, effectB]);

    // Batched: A contributes 400, B contributes 0*1.25=0 → total atk = 400
    // Sequential (buggy): A applies 400 first, B reads 400 → contributes 500 → total = 900
    expect(s.getTotal("atk")).toBe(400);
  });
});
