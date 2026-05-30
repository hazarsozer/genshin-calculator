import { describe, it, expect } from "vitest";
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
      apply(stats: Stats): void {
        const hpTotal = stats.getTotal("hp");
        const bonus = Math.min(hpTotal * ratio, cap);
        stats.add("atk", bonus);
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
      { priority: 3, apply: () => { log.push(3); } },
      { priority: 1, apply: () => { log.push(1); } },
      { priority: 2, apply: () => { log.push(2); } },
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
        apply(stats: Stats): void { stats.add("atk", 50); },
      },
      {
        priority: 1,
        apply(stats: Stats): void { stats.add("atk_base", 10); },
      },
    ];

    applyPostEffects(s, effects);
    // Priority 1 runs first: atk_base becomes 110
    // Priority 2 runs second: atk flat += 50
    // total atk = 110 + 50 = 160
    expect(s.getTotal("atk")).toBe(160);
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
      apply(stats: Stats): void {
        const hpTotal = stats.getTotal("hp");
        stats.add("atk", hpTotal * 0.02);
      },
    };
    applyPostEffects(s, [effect]);

    // After: atk_total = 800 + 20000 * 0.02 = 800 + 400 = 1200
    expect(s.getTotal("atk")).toBeCloseTo(1200, 5);
  });
});
