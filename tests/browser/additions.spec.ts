import { expect, test } from "@playwright/test";
// Browser checks for behavior added in the second FlowType pass.

test("a wrong final character waits for space, then finishes with the error", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "words", exact: true }).click();
  await page.getByRole("button", { name: "10 words", exact: true }).click();
  const input = page.getByRole("textbox", { name: "Typing input" });
  const text = (await page.locator("#target-passage").textContent()) ?? "";
  await input.focus();
  // Everything correct except the final character.
  await input.pressSequentially(text.slice(0, -1) + "~", { delay: 5 });
  await expect(page.getByText("Space to finish")).toBeVisible();
  await expect(page.locator(".char.incorrect")).toHaveCount(1);
  await input.press("Space");
  await expect(
    page.getByRole("heading", { name: "A moment of progress." }),
  ).toBeVisible();
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("flowtype.history.v1") ?? "[]")[0],
  );
  expect(saved.mismatches).toBe(1);
  expect(saved.accuracy).toBeLessThan(100);
});

test("Words preview is exactly the next practice passage, and shuffle changes it", async ({
  page,
}) => {
  await page.goto("/#/words");
  const preview = page.locator(".passage-preview");
  const first = ((await preview.textContent()) ?? "").replace(/…$/, "");
  await page.getByRole("button", { name: "Preview another passage" }).click();
  const second = ((await preview.textContent()) ?? "").replace(/…$/, "");
  expect(second).not.toBe(first);
  await page.getByRole("button", { name: /Settle in/ }).click();
  const passage = (await page.locator("#target-passage").textContent()) ?? "";
  expect(passage.startsWith(second)).toBe(true);
  // Next passage on the practice screen is also deterministic and different.
  await page.getByRole("button", { name: "Next passage" }).click();
  const third = (await page.locator("#target-passage").textContent()) ?? "";
  expect(third).not.toBe(passage);
});

test("keyboard-first: typing with nothing focused, and after changing duration", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Typing input" });
  await expect(input).not.toBeFocused();
  const text = (await page.locator("#target-passage").textContent()) ?? "";
  await page.keyboard.type(text.slice(0, 3));
  await expect(input).toHaveValue(text.slice(0, 3));
  // A config change via keyboard should hand focus back to the passage.
  await page.getByRole("button", { name: "60 seconds", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("");
  await expect(page.getByTestId("live-timer")).toContainText("60");
  // Shortcuts inside settings inputs are not hijacked.
  await page.goto("/#/words");
  const custom = page.getByLabel("Custom practice text");
  await custom.focus();
  await page.keyboard.type("abc");
  await expect(custom).toHaveValue(/abc$/);
});

test("command menu switches to any theme and word counts; dark uses its night scene", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Escape");
  await page.getByRole("combobox", { name: "Search commands" }).fill("ocean");
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "ocean");
  await page.getByRole("button", { name: "Open command menu" }).click();
  await page.getByRole("combobox", { name: "Search commands" }).fill("25 word");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "25 words", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator(".landscape img")).toHaveAttribute(
    "src",
    /landscape-night\.svg$/,
  );
  // The night scene is a real, loadable asset, not just a changed attribute.
  await expect
    .poll(() =>
      page.locator(".landscape img").evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);
});

test("resetting preferences keeps the selected custom passage", async ({
  page,
}) => {
  await page.goto("/#/words");
  await page.getByLabel("Custom practice text").fill("my own words");
  await page.getByRole("button", { name: "Use custom text", exact: true }).click();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Reset preferences" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Reset preferences" })
    .click();
  const config = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("flowtype.config.v1") ?? "{}"),
  );
  expect(config.customText).toBe("my own words");
  expect(config.source).toBe("passage");
});
