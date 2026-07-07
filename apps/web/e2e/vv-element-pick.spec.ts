import { test, expect } from "@playwright/test";

// VV4 self-worn element pick: a solo Anemo character wearing Viridescent Venerer
// 4pc had no way to pick their own swirled element (the self-worn `dropdown-element`
// gate `set.viridescent_venerer_4` requires char-element:anemo + pieces-count:4).
// This surfaces that pick as an element <select> and asserts it actually changes
// the damage output (RES shred applies).
test("VV4 self-worn element pick surfaces and shreds RES", async ({ page }) => {
  await page.goto("/");

  // (1) Select an Anemo VV-wearer (Kaedehara Kazuha) via the Character drawer.
  await page.getByRole("button", { name: "Build", exact: true }).click();
  await page.getByPlaceholder("Search…").first().fill("kazuha");
  await page.getByRole("button", { name: /Kaedehara Kazuha/i }).click();

  // (2) Open the Equip (Artifacts) drawer, switch to Manual, and equip
  //     Viridescent Venerer on all 5 slots (>= 4pc) via the SetPicker.
  await page.getByRole("button", { name: "Equip" }).click();
  await page.getByRole("button", { name: "Manual" }).click();
  await page.getByRole("button", { name: "Browse artifact set" }).click();
  await page.getByRole("button", { name: "Viridescent Venerer" }).click();
  await page.getByRole("button", { name: "Apply to all slots" }).click();

  // (3) The self-worn element select appears in Set Conditions.
  const select = page.getByTestId("set-element-select-set.viridescent_venerer_4");
  await expect(select).toBeVisible();

  // (4) Capture the pyro swirl-plunge damage (the row `enemy_res_pyro` shred actually
  //     affects), pick "pyro", and assert it changes (RES shred applied). Picking an
  //     unrelated element (or none) leaves this row untouched — this is the anti-gaming
  //     guard: a broad "any number on the page changed" assertion would pass even if the
  //     select wrote nowhere the engine reads.
  const pyroRow = page.getByTestId("pin-attack.kazuha_plunge_pyro").locator("..").locator("..");
  const pyroValue = pyroRow.getByTestId("result-avg");
  await expect(pyroValue).toBeVisible({ timeout: 10_000 });
  const before = await pyroValue.textContent();
  await select.selectOption("pyro");
  await expect(pyroValue).not.toHaveText(before ?? "");
});
