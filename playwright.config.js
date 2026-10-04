import process from 'node:process'
import { defineConfig } from '@playwright/test'
// All responsive breakpoints on both sides, portrait/landscape and densities.
const screens = [[320,568],[380,812],[381,812],[390,844],[640,360],[641,900],[768,1024],[1024,768],[1025,900],[1440,900],[2560,1440]]
const projects = ['chromium', 'firefox', 'webkit'].flatMap((browserName) => screens.flatMap(([width, height]) => [1,2,3,...([390,1440].includes(width) ? [1.25,1.5] : []),...(width===390 ? [4] : [])].map((deviceScaleFactor) => ({ name: `${browserName}-${width}x${height}-dpr${deviceScaleFactor}`, use: { browserName, viewport: { width, height }, deviceScaleFactor } }))))
export default defineConfig({ testDir: './tests/browser', fullyParallel: true, workers: 3, retries: 0, timeout: 45_000, reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]], outputDir: 'test-results', use: { baseURL: 'http://127.0.0.1:4173', screenshot: 'only-on-failure', trace: 'retain-on-failure' }, projects, webServer: { command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI, timeout: 120_000 } })
