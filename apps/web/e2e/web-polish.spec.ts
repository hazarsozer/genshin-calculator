import { test, expect } from "@playwright/test";

/**
 * Task 6 web polish batch — a11y coverage for the hand-rolled Rail tab
 * selector and the ConditionControl InfoTooltip's aria-describedby lifecycle.
 * No component test harness (testing-library/jsdom) exists in apps/web, so
 * these DOM-observable a11y attributes are covered via Playwright per the
 * task brief's fallback guidance.
 */

test("Rail exposes tablist/tab roles with aria-selected reflecting the open drawer", async ({
  page,
}) => {
  await page.goto("/");

  const tablist = page.getByRole("tablist");
  await expect(tablist).toBeVisible();

  const buildTab = page.getByRole("tab", { name: "Build", exact: true });
  const equipTab = page.getByRole("tab", { name: "Equip", exact: true });
  await expect(buildTab).toHaveAttribute("aria-selected", "false");
  await expect(equipTab).toHaveAttribute("aria-selected", "false");

  await buildTab.click();
  await expect(buildTab).toHaveAttribute("aria-selected", "true");
  await expect(equipTab).toHaveAttribute("aria-selected", "false");

  // Toggling the same tab closes the drawer again.
  await buildTab.click();
  await expect(buildTab).toHaveAttribute("aria-selected", "false");
});

test("InfoTooltip only references aria-describedby while the tooltip is open", async ({
  page,
}) => {
  await page.goto("/");
  // The default weapon (dark_iron_sword) has a passive with a CSV description,
  // surfacing an InfoTooltip in the Weapon drawer.
  await page.getByRole("tab", { name: "Weapon", exact: true }).click();

  const info = page.getByLabel("Condition description").first();
  await expect(info).toBeVisible();

  // Closed: no aria-describedby attribute at all (not just an empty one).
  await expect(info).not.toHaveAttribute("aria-describedby");

  await info.click();
  const describedBy = await info.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  await expect(page.locator(`#${describedBy}`)).toBeVisible();

  await info.click();
  await expect(info).not.toHaveAttribute("aria-describedby");
});
