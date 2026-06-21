import { test, expect } from "@playwright/test";

test("pick a character + see a damage number", async ({ page }) => {
  await page.goto("/");

  // The character picker trigger is a combobox labelled by <label htmlFor="character-picker">
  // Default is already "bennett", but we explicitly open + select to exercise the picker.
  const trigger = page.getByLabel(/character/i);
  await trigger.click();

  // @base-ui/react Select items render with role="option"
  await page.getByRole("option", { name: "Bennett" }).click();

  // After selection, the results table should populate with positive damage numbers.
  const firstAvg = page.getByTestId("result-avg").first();
  await expect(firstAvg).toBeVisible();

  const text = await firstAvg.innerText();
  const num = Number(text.replace(/[^0-9]/g, ""));
  expect(num).toBeGreaterThan(0);
});
