import { test, expect } from "@playwright/test";

// Minimal GOOD JSON: one flower piece (HP main, two substats). Enough to verify
// the parse path runs end-to-end and damage output remains > 0.
const MINIMAL_GOOD_JSON = JSON.stringify({
  format: "GOOD",
  artifacts: [
    {
      setKey: "GladiatorsFinale",
      slotKey: "flower",
      level: 20,
      rarity: 5,
      mainStatKey: "hp",
      substats: [
        { key: "critRate_", value: 3.5 },
        { key: "critDMG_", value: 7.0 },
      ],
    },
  ],
});

test("default build produces a damage number", async ({ page }) => {
  await page.goto("/");

  // The default form (bennett + dark_iron_sword) has a character selected.
  // The Breakdown panel shows feature damage immediately on page load.
  const firstAvg = page.getByTestId("result-avg").first();
  await expect(firstAvg).toBeVisible({ timeout: 10_000 });

  const text = await firstAvg.innerText();
  const num = Number(text.replace(/[^0-9]/g, ""));
  expect(num).toBeGreaterThan(0);
});

test("GOOD import produces a damage number", async ({ page }) => {
  await page.goto("/");

  // Open the Artifacts drawer via the "Equip" rail button
  await page.getByRole("tab", { name: "Equip" }).click();

  // Switch to GOOD Import tab
  await page.getByRole("button", { name: "GOOD Import" }).click();

  // Paste a minimal GOOD JSON into the textarea
  const textarea = page.getByLabel("GOOD JSON");
  await textarea.fill(MINIMAL_GOOD_JSON);

  // Verify the parse succeeded ("✓ Loaded" appears)
  await expect(page.getByText(/✓ Loaded/)).toBeVisible({ timeout: 5_000 });

  // Damage numbers should still be visible and > 0 with the imported stats
  const firstAvg = page.getByTestId("result-avg").first();
  await expect(firstAvg).toBeVisible({ timeout: 5_000 });

  const text = await firstAvg.innerText();
  const num = Number(text.replace(/[^0-9]/g, ""));
  expect(num).toBeGreaterThan(0);
});
