import { describe, it, expect } from "vitest";
import { StatTable } from "../StatTable.js";
import { StatTableAscensionScale } from "../StatTable.js";

describe("StatTable", () => {
  it("getValue returns values[level-1] for 1-indexed level", () => {
    const t = new StatTable([1.0, 1.083, 1.166]);
    expect(t.getValue(1)).toBe(1.0);
    expect(t.getValue(2)).toBe(1.083);
    expect(t.getValue(3)).toBe(1.166);
  });

  it("getValue returns 0 for level 0", () => {
    const t = new StatTable([1.0, 1.083]);
    expect(t.getValue(0)).toBe(0);
  });

  it("getValue clamps to last entry if level exceeds array length", () => {
    const t = new StatTable([1.0, 2.0]);
    expect(t.getValue(100)).toBe(2.0);
  });

  it("getValue returns correct value at a mid-range level", () => {
    // s5atk[89] = 8.739 (level 90, index 89)
    const s5atk = [1.000, 1.083, 1.166, 1.250, 1.333, 1.417, 1.500, 1.584, 1.668, 1.751, 1.835, 1.919, 2.003, 2.088, 2.172, 2.256, 2.341, 2.425, 2.510, 2.594, 2.679, 2.764, 2.849, 2.934, 3.019, 3.105, 3.190, 3.275, 3.361, 3.446, 3.532, 3.618, 3.704, 3.789, 3.875, 3.962, 4.048, 4.134, 4.220, 4.307, 4.393, 4.480, 4.567, 4.653, 4.740, 4.827, 4.914, 5.001, 5.089, 5.176, 5.263, 5.351, 5.438, 5.526, 5.614, 5.702, 5.790, 5.878, 5.966, 6.054, 6.142, 6.230, 6.319, 6.407, 6.496, 6.585, 6.673, 6.762, 6.851, 6.940, 7.029, 7.119, 7.208, 7.297, 7.387, 7.476, 7.566, 7.656, 7.746, 7.836, 7.926, 8.016, 8.106, 8.196, 8.286, 8.377, 8.467, 8.558, 8.649, 8.739, 8.830, 8.921, 9.012, 9.103, 9.195, 9.286, 9.377, 9.469, 9.560, 9.652];
    const t = new StatTable(s5atk);
    expect(t.getValue(90)).toBe(8.739);
  });
});

describe("StatTableAscensionScale", () => {
  it("getValue: no scale, no ascension → returns base", () => {
    const t = new StatTableAscensionScale({ base: 100 });
    expect(t.getValue(1, 0)).toBe(100);
    expect(t.getValue(90, 0)).toBe(100);
  });

  it("getValue: with levelScaling only", () => {
    // base=10, scale=[1.0, 2.0, 3.0]
    const scale = new StatTable([1.0, 2.0, 3.0]);
    const t = new StatTableAscensionScale({ base: 10, scale });
    // level 1: 10 * 1.0 = 10
    expect(t.getValue(1, 0)).toBeCloseTo(10, 5);
    // level 2: 10 * 2.0 = 20
    expect(t.getValue(2, 0)).toBeCloseTo(20, 5);
  });

  it("getValue: with ascension only", () => {
    // base=100, ascension=[10, 20, 30, 40, 50, 60]
    const ascension = new StatTable([10, 20, 30, 40, 50, 60]);
    const t = new StatTableAscensionScale({ base: 100, ascension });
    // ascension 0 → 0 bonus (ascensionTable.getValue(0) = 0)
    expect(t.getValue(1, 0)).toBe(100);
    // ascension 1 → 10 bonus
    expect(t.getValue(1, 1)).toBe(110);
    // ascension 6 → 60 bonus
    expect(t.getValue(1, 6)).toBe(160);
  });

  it("getValue: Hu Tao base ATK at level 90, ascension 6 (hand-pulled from CharTables.js)", () => {
    // Source: raw/genshin_calc_pub/src/js/db/generated/CharTables.js Hutao entry
    //   base: 8.2859
    //   ascension: [7.1039, 12.1514, 18.8814, 23.9289, 28.9764, 34.0239]  (StatTable values)
    //   scale: charScales.s5atk
    // Source: raw/genshin_calc_pub/src/js/db/generated/CharScale.js s5atk
    //   s5atk[89] = 8.739  (level 90, 0-indexed as 89)
    //
    // Expected: 8.2859 * 8.739 + 34.0239 = 106.4343801
    const s5atk = [1.000, 1.083, 1.166, 1.250, 1.333, 1.417, 1.500, 1.584, 1.668, 1.751, 1.835, 1.919, 2.003, 2.088, 2.172, 2.256, 2.341, 2.425, 2.510, 2.594, 2.679, 2.764, 2.849, 2.934, 3.019, 3.105, 3.190, 3.275, 3.361, 3.446, 3.532, 3.618, 3.704, 3.789, 3.875, 3.962, 4.048, 4.134, 4.220, 4.307, 4.393, 4.480, 4.567, 4.653, 4.740, 4.827, 4.914, 5.001, 5.089, 5.176, 5.263, 5.351, 5.438, 5.526, 5.614, 5.702, 5.790, 5.878, 5.966, 6.054, 6.142, 6.230, 6.319, 6.407, 6.496, 6.585, 6.673, 6.762, 6.851, 6.940, 7.029, 7.119, 7.208, 7.297, 7.387, 7.476, 7.566, 7.656, 7.746, 7.836, 7.926, 8.016, 8.106, 8.196, 8.286, 8.377, 8.467, 8.558, 8.649, 8.739, 8.830, 8.921, 9.012, 9.103, 9.195, 9.286, 9.377, 9.469, 9.560, 9.652];
    const scale = new StatTable(s5atk);
    const ascension = new StatTable([7.1039, 12.1514, 18.8814, 23.9289, 28.9764, 34.0239]);
    const t = new StatTableAscensionScale({ base: 8.2859, scale, ascension });
    // 8.2859 * 8.739 + 34.0239 ≈ 106.434
    expect(t.getValue(90, 6)).toBeCloseTo(106.4344, 3);
  });

  it("getValue: ascension 0 adds nothing", () => {
    const scale = new StatTable([1.0]);
    const ascension = new StatTable([10, 20, 30]);
    const t = new StatTableAscensionScale({ base: 100, scale, ascension });
    expect(t.getValue(1, 0)).toBe(100);
  });
});
