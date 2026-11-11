const { defineConfig } = require("@playwright/test");

if (!process.env.HA_URL) throw new Error("Set HA_URL to your Home Assistant address, e.g. https://ha.example.com");

module.exports = defineConfig({
  testDir: ".",
  // One Home Assistant, one test view: run in order, never in parallel.
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
  use: {
    baseURL: process.env.HA_URL,
    browserName: "chromium",
    viewport: { width: 1400, height: 900 },
    deviceScaleFactor: 2,
    screenshot: "only-on-failure",
    // Never turn tracing on: a trace records the access token.
    trace: "off",
  },
});
