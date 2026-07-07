import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  TEAM_BUFF_SETS,
  OFF_FIELD_WEAPONS,
  SCROLL_TIER_OPTIONS,
} from "../teamBuffs.js";

/**
 * Drift guard: every curated gate must still exist as a literal in the engine's
 * characterConditions.ts. If a gate is renamed/removed there, this fails loudly
 * rather than silently emitting a dead key that the engine ignores.
 */
const CONDITIONS_SRC = readFileSync(
  fileURLToPath(new URL("../../../../packages/data/src/characterConditions.ts", import.meta.url)),
  "utf8"
);

function hasLiteral(s: string): boolean {
  return CONDITIONS_SRC.includes(`"${s}"`);
}

describe("teamBuffs gate drift guard", () => {
  it("every TEAM_BUFF_SETS gate exists as a set_other condition literal", () => {
    for (const set of TEAM_BUFF_SETS) {
      if (set.tierPick) {
        // tier gates are `${gate}_${tier}` booleans
        for (const tier of SCROLL_TIER_OPTIONS) {
          expect(hasLiteral(`set_other.${set.gate}_${tier}`), `${set.gate}_${tier}`).toBe(true);
        }
      } else {
        expect(hasLiteral(`set_other.${set.gate}`), set.gate).toBe(true);
      }
    }
  });

  it("every OFF_FIELD_WEAPONS gate exists as a condition literal (verbatim, with prefix)", () => {
    for (const w of OFF_FIELD_WEAPONS) {
      expect(hasLiteral(w.gate), w.gate).toBe(true);
    }
  });

  it("excludes the stat-conversion weapons (out of scope this wave)", () => {
    const gates = OFF_FIELD_WEAPONS.map((w) => w.gate);
    expect(gates).not.toContain("weapon_other.weapon_peak_patrol_song");
    expect(gates).not.toContain("weapon_other.weapon_key_of_khaj_nisut");
  });
});
