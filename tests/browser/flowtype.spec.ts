import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("keyboard typing, correction, restart, completion, history and clearing", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "words", exact: true }).click();
  await page.getByRole("button", { name: "10 words", exact: true }).click();
  const input = page.getByRole("textbox", { name: "Typing input" });
  const text = (await page.locator("#target-passage").textContent()) ?? "";
  expect(text.split(" ")).toHaveLength(10);
  await input.focus();
  await input.pressSequentially(text[0] + "~");
  await expect(page.locator(".char.incorrect")).toHaveCount(1);
  await input.press("Backspace");
  await expect(page.locator(".char.incorrect")).toHaveCount(0);
  await input.press("Tab");
  await expect(
    page.getByRole("button", { name: "Restart test", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("");
  await input.pressSequentially(text, { delay: 12 });
  await expect(
    page.getByRole("heading", { name: "A moment of progress." }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /Typing speed over time/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /View stats/ }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.reload();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Clear history", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Clear history", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Clear history", exact: true })
    .click();
  await expect(
    page.getByText("Your story starts with a single word."),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("timed test derives deadline, freezes results and saves exactly once", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "15 seconds", exact: true }).click();
  await expect(page.getByTestId("live-timer")).toContainText("15");
  const input = page.getByRole("textbox", { name: "Typing input" });
  await input.focus();
  await input.pressSequentially("hello");
  await page.clock.runFor(15100);
  await expect(
    page.getByRole("heading", { name: "A moment of progress." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("flowtype.history.v1") ?? "[]").length,
    ),
  ).toBe(1);
  await page.clock.runFor(30000);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("flowtype.history.v1") ?? "[]").length,
    ),
  ).toBe(1);
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("");
  await expect(page.getByTestId("live-timer")).toContainText("15");
});

test("all themes and preferences persist, custom text is validated and preserved", async ({
  page,
}) => {
  await page.goto("/#/settings");
  for (const theme of ["Dark", "Pastel", "Sunset", "Ocean", "Light"]) {
    await page
      .getByRole("button", { name: `${theme} theme`, exact: true })
      .click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      theme.toLowerCase(),
    );
  }
  await page.getByRole("button", { name: "Ocean theme", exact: true }).click();
  await page.getByRole("switch", { name: /Landscape background/ }).uncheck();
  await page.getByRole("switch", { name: /Live WPM/ }).uncheck();
  await page.getByRole("switch", { name: /Visible timer/ }).uncheck();
  await page.getByLabel("Cursor style").selectOption("block");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "ocean");
  await expect(
    page.getByRole("switch", { name: /Landscape background/ }),
  ).not.toBeChecked();
  await page.getByRole("link", { name: "Words", exact: true }).click();
  await page
    .getByRole("button", { name: "Use custom text", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Add a few words");
  const custom = "hello  world\nnext line";
  await page.getByLabel("Custom practice text").fill(custom);
  await page.getByRole("link", { name: "Stats", exact: true }).click();
  await page.getByRole("link", { name: "Words", exact: true }).click();
  await expect(page.getByLabel("Custom practice text")).toHaveValue(custom);
  await page
    .getByRole("button", { name: "Use custom text", exact: true })
    .click();
  await page.getByRole("button", { name: /Settle in/ }).click();
  await expect(page.locator("#target-passage")).toHaveText(custom);
  await expect(page.locator(".cursor-block")).toHaveCount(1);
  await expect(page.locator(".landscape")).toHaveCount(0);
  await expect(page.getByTestId("live-wpm")).toContainText("···");
  await expect(page.getByTestId("live-timer")).toContainText("···");
  const input = page.getByRole("textbox", { name: "Typing input" });
  await input.focus();
  await input.pressSequentially("hello  world");
  await input.press("Enter");
  await input.pressSequentially("next line");
  await expect(
    page.getByRole("heading", { name: "A moment of progress." }),
  ).toBeVisible();
});

test("commands are keyboard navigable; theme does not reset a run; navigation is guarded", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Typing input" });
  await input.focus();
  await input.pressSequentially("test");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(input).toHaveValue("test");
  await input.focus();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("combobox", { name: "Search commands" }).fill("restart");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await input.pressSequentially("hello");
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Leave this moment");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(input).toHaveValue("hello");
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Leave test", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your space, your pace." }),
  ).toBeVisible();
  await page.getByLabel("Font size").focus();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("invalid local data and a missing background do not break practice", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("flowtype.settings.v1", "{oops");
    localStorage.setItem("flowtype.history.v1", '[null,{"wpm":"bad"}]');
    localStorage.setItem(
      "flowtype.config.v1",
      JSON.stringify({ source: "custom", customText: "" }),
    );
  });
  await page.route("**/landscape.svg", (route) => route.abort());
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Find your rhythm." }),
  ).toBeVisible();
  const input = page.getByRole("textbox", { name: "Typing input" });
  await input.focus();
  await input.pressSequentially("a");
  await expect(input).toHaveValue("a");
});

for (const [width, height] of [
  [1440, 900],
  [1280, 800],
  [768, 1024],
  [390, 844],
  [320, 640],
]) {
  test(`responsive pages without horizontal overflow at ${width}x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    for (const route of ["practice", "stats", "words", "settings"]) {
      await page.goto(`/#/${route}`);
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  });
}

test("WCAG automated checks across all themes and pages", async ({ page }) => {
  await page.goto("/");
  for (const theme of ["light", "dark", "pastel", "sunset", "ocean"]) {
    await page.evaluate((theme) => {
      localStorage.setItem("flowtype.settings.v1", JSON.stringify({ theme }));
    }, theme);
    for (const route of ["practice", "settings", "words", "stats"]) {
      await page.goto(`/#/${route}`);
      await page.reload();
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        scan.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
        `${theme} / ${route}`,
      ).toEqual([]);
    }
  }
});
