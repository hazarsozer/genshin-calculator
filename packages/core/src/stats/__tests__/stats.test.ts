import { describe, it, expect } from "vitest";
import { Stats } from "../Stats.js";

describe("Stats accumulator", () => {
  it("starts empty: get returns 0 for any key", () => {
    const s = new Stats();
    expect(s.get("atk_base")).toBe(0);
    expect(s.get("atk_percent")).toBe(0);
    expect(s.get("atk")).toBe(0);
  });

  it("add accumulates values for the same key", () => {
    const s = new Stats();
    s.add("atk", 100);
    s.add("atk", 50);
    expect(s.get("atk")).toBe(150);
  });

  it("set overwrites the key regardless of prior value", () => {
    const s = new Stats();
    s.add("atk", 100);
    s.set("atk", 200);
    expect(s.get("atk")).toBe(200);
  });

  it("concat merges all keys from a plain object", () => {
    const s = new Stats();
    s.add("hp_base", 1000);
    s.concat({ hp_base: 500, atk: 200 });
    expect(s.get("hp_base")).toBe(1500);
    expect(s.get("atk")).toBe(200);
  });

  it("constructor with data object initializes all keys", () => {
    const s = new Stats({ atk_base: 100, atk_percent: 18 });
    expect(s.get("atk_base")).toBe(100);
    expect(s.get("atk_percent")).toBe(18);
  });

  it("getTotal: totalATK = base*(1+percent/100) + flat", () => {
    const s = new Stats();
    s.add("atk_base", 800);
    s.add("atk_percent", 18);   // 18% of base
    s.add("atk", 200);          // flat
    // getTotal('atk') = base + (base * percent / 100) + flat
    //                 = 800 + (800 * 18 / 100) + 200
    //                 = 800 + 144 + 200 = 1144
    const total = s.getTotal("atk");
    expect(total).toBeCloseTo(1144, 5);
  });

  it("getTotal: no base → returns flat only", () => {
    const s = new Stats();
    s.add("atk", 300);
    expect(s.getTotal("atk")).toBe(300);
  });

  it("getTotal: base only → base", () => {
    const s = new Stats();
    s.add("atk_base", 500);
    expect(s.getTotal("atk")).toBe(500);
  });

  it("del removes a key (subsequent get returns 0)", () => {
    const s = new Stats();
    s.add("atk", 100);
    s.del("atk");
    expect(s.get("atk")).toBe(0);
  });

  it("isSet returns true iff key was explicitly set", () => {
    const s = new Stats();
    expect(s.isSet("atk")).toBe(false);
    s.add("atk", 1);
    expect(s.isSet("atk")).toBe(true);
  });

  it("isEmpty returns true when no keys are set", () => {
    const s = new Stats();
    expect(s.isEmpty()).toBe(true);
    s.add("atk", 1);
    expect(s.isEmpty()).toBe(false);
  });
});
