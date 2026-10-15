import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  // One browser worker keeps local Chrome startup stable on shared IDE hosts.
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: "http://localhost:5173",
    channel: "chrome",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 5173",
    url: "http://localhost:5173",
    reuseExistingServer: true,
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
