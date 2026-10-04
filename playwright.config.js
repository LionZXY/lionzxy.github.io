import process from 'node:process'
import { defineConfig } from '@playwright/test'

const layouts = [
  { name: 'chromium-phone-portrait-dpr3', browserName: 'chromium', viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 },
  { name: 'chromium-desktop-dpr1', browserName: 'chromium', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  { name: 'firefox-phone-landscape-dpr2', browserName: 'firefox', viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 },
  { name: 'firefox-laptop-dpr1', browserName: 'firefox', viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 },
  { name: 'webkit-tablet-portrait-dpr2', browserName: 'webkit', viewport: { width: 768, height: 1024 }, deviceScaleFactor: 2 },
  { name: 'webkit-tablet-landscape-dpr2', browserName: 'webkit', viewport: { width: 1024, height: 768 }, deviceScaleFactor: 2 },
]

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: layouts.map(({ name, ...use }) => ({ name, use })),
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
