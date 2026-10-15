// Reproduce real application screenshots using the running local Vite server.
// Run from this app: node scripts/verify-visuals.mjs
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
await mkdir("artifacts/verification", { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const capture = async (name) => {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200); // Capture the resting palette, not a hover/theme transition.
  await page.screenshot({
    path: `artifacts/verification/${name}.png`,
    fullPage: true,
  });
};
await page.goto("http://localhost:5173");
await capture("practice-desktop");
await page.setViewportSize({ width: 390, height: 844 });
await capture("practice-mobile");
await page.setViewportSize({ width: 1440, height: 900 });
await page.getByRole("button", { name: "Switch to dark theme" }).click();
await capture("practice-dark");
await page.getByRole("button", { name: "Switch to light theme" }).click();
await page.getByRole("button", { name: "15 seconds", exact: true }).click();
const input = page.getByRole("textbox", { name: "Typing input" });
const passage = (await page.locator("#target-passage").textContent()) ?? "";
await input.focus();
for (let i = 0; i < 15; i++) {
  if (!(await input.count())) break;
  await input.pressSequentially(passage.slice(i * 6, (i + 1) * 6));
  await page.waitForTimeout(1000);
}
await page.getByRole("heading", { name: "A moment of progress." }).waitFor();
await capture("results-desktop");
await page.getByRole("button", { name: /View stats/ }).click();
await capture("stats-desktop");
await page.getByRole("link", { name: "Settings", exact: true }).click();
await capture("settings-desktop");
await page.getByRole("link", { name: "Words", exact: true }).click();
await capture("words-desktop");
console.log(
  JSON.stringify({
    screenshots: 7,
    browserErrors: errors,
    historyRecords: await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("flowtype.history.v1") ?? "[]").length,
    ),
  }),
);
await browser.close();
if (errors.length) process.exitCode = 1;
