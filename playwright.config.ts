import { defineConfig } from "@playwright/test";
// Local test servers must bypass any workstation HTTP proxy.
process.env.NO_PROXY = [process.env.NO_PROXY, "127.0.0.1", "localhost"]
  .filter(Boolean)
  .join(",");
process.env.no_proxy = process.env.NO_PROXY;
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.js",
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:5175",
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    },
  },
  webServer: {
    command: process.env.E2E_PREVIEW ? "npm run preview -- --host 127.0.0.1 --port 5175 --strictPort" : "npm run dev -- --host 127.0.0.1 --port 5175 --strictPort",
    url: "http://127.0.0.1:5175",
    reuseExistingServer: false,
  },
});
