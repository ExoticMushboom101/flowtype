import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("configuration changes deliberately reset active tests, including commands on results", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Typing input" });
  await input.focus();
  await input.pressSequentially("hello");
  await page.getByRole("button", { name: "15 seconds", exact: true }).click();
  await expect(input).toHaveValue("");
  await expect(page.getByTestId("live-timer")).toContainText("15");
  await input.focus();
  await input.pressSequentially("hi");
  await page.clock.runFor(15050);
  await expect(
    page.getByRole("heading", { name: "A moment of progress." }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByRole("combobox", { name: "Search commands" })
    .fill("15 second");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Find your rhythm." }),
  ).toBeVisible();
  await expect(input).toHaveValue("");
});

test("cursor remains on the active wrapped line and returns correctly after backspace", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Typing input" });
  const text = (await page.locator("#target-passage").textContent()) ?? "";
  await input.focus();
  await input.pressSequentially(text.slice(0, 180), { delay: 2 });
  const check = async () => {
    await page.waitForTimeout(100);
    const cursor = await page.locator(".typing-cursor").boundingBox();
    const active = await page.locator('[data-current="true"]').boundingBox();
    const viewport = await page.locator(".typing-viewport").boundingBox();
    expect(cursor).not.toBeNull();
    expect(active).not.toBeNull();
    expect(Math.abs(cursor!.x - active!.x)).toBeLessThan(3);
    expect(Math.abs(cursor!.y - active!.y)).toBeLessThan(2);
    expect(active!.y).toBeGreaterThanOrEqual(viewport!.y);
    expect(active!.y + active!.height).toBeLessThanOrEqual(
      viewport!.y + viewport!.height + 1,
    );
  };
  await check();
  for (let i = 0; i < 35; i++) await input.press("Backspace");
  await check();
});

test("composition commits once, and paste is blocked without starting a ready test", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Typing input" });
  await input.focus();
  await input.dispatchEvent("paste");
  await expect(input).toHaveValue("");
  await expect(page.getByTestId("live-timer")).toContainText("30");
  await input.dispatchEvent("compositionstart");
  await input.fill("漢");
  await expect(page.locator(".char.incorrect")).toHaveCount(0);
  await input.dispatchEvent("compositionend");
  await expect(page.locator(".char.incorrect")).toHaveCount(1);
  await expect(input).toHaveValue("漢");
});

test("preference reset requires confirmation and preserves history; skip link does not route away", async ({
  page,
}) => {
  await page.goto("/#/settings");
  await page.getByRole("button", { name: "Sunset theme", exact: true }).click();
  await page.getByRole("button", { name: "Reset preferences" }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sunset");
  await page.getByRole("button", { name: "Reset preferences" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Reset preferences" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("link", { name: "Skip to content" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await expect(page).toHaveURL(/settings/);
});

test("mobile theme contrast, command menu and real results have no automated WCAG violations", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const theme of ["light", "dark", "pastel", "sunset", "ocean"]) {
    await page.evaluate((theme) => {
      localStorage.setItem("flowtype.settings.v1", JSON.stringify({ theme }));
    }, theme);
    await page.reload();
    const scan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      scan.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.failureSummary),
      })),
      theme,
    ).toEqual([]);
  }
  await page.keyboard.press("Escape");
  const commands = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    commands.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.failureSummary),
    })),
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "words", exact: true }).click();
  await page.getByRole("button", { name: "10 words", exact: true }).click();
  const text = (await page.locator("#target-passage").textContent()) ?? "";
  const input = page.getByRole("textbox", { name: "Typing input" });
  await input.focus();
  await input.pressSequentially(text, { delay: 10 });
  await expect(
    page.getByRole("region", { name: "Test results" }),
  ).toBeFocused();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    results.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.failureSummary),
    })),
  ).toEqual([]);
});
