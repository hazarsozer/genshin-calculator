import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Full-roster browser verification sweep (2026-07 verification pass).
 *
 * Consumes e2e/fixtures/browser-pilot.json (written by
 * lib/__tests__/browserPilot.gen.test.ts, where every scenario's engine output
 * is hard-gated against the Aspirine oracle fixtures — 432 scenarios across
 * base/C6/weapon-passive for all 107 characters plus every curated oracle
 * family). Each test navigates to the encoded build hash and asserts the top
 * engine-expected damage averages are rendered — closing the chain
 * DOM == engine == Aspirine.
 *
 * ~2.5 min for the full sweep, so it is OPT-IN: RUN_SWEEP=1 pnpm exec
 * playwright test e2e/browser-pilot.spec.ts. The default e2e suite skips it.
 */

interface Check {
  featureKey: string;
  avg: number;
  text: string;
}
interface Entry {
  id: string;
  char: string;
  hash: string;
  checks: Check[];
}

const entries: Entry[] = JSON.parse(
  readFileSync(join(__dirname, "fixtures", "browser-pilot.json"), "utf8")
);

const RUN_SWEEP = process.env.RUN_SWEEP === "1";

for (const entry of entries) {
  test(`${entry.id}: rendered numbers match the Aspirine-gated engine values`, async ({
    page,
  }) => {
    test.skip(!RUN_SWEEP, "full-roster sweep is opt-in: RUN_SWEEP=1");
    await page.goto(`/#${entry.hash}`);
    await expect(page.getByTestId("result-avg").first()).toBeVisible({ timeout: 10_000 });

    for (const check of entry.checks) {
      const matches = page.getByText(check.text, { exact: true });
      // The value must be RENDERED (attached); visibility may require expanding a
      // breakdown row / switching tab — recorded via annotation, spot-checked via MCP.
      await expect(
        matches.first(),
        `${entry.id} ${check.featureKey} expected ${check.text} in the DOM`
      ).toBeAttached({ timeout: 5_000 });
      const visibleCount = await matches.filter({ visible: true }).count();
      if (visibleCount === 0) {
        test.info().annotations.push({
          type: "hidden-only",
          description: `${entry.id} ${check.featureKey} ${check.text}`,
        });
        console.log(`HIDDEN-ONLY: ${entry.id} ${check.featureKey} ${check.text}`);
      }
    }
  });
}
