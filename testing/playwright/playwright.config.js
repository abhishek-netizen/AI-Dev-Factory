import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir:   './tests',
  outputDir: './results',

  // Run tests in parallel
  fullyParallel: true,
  retries:       1,
  workers:       2,

  reporter: [
    ['list'],
    ['json',  { outputFile: './results/results.json'  }],
    ['html',  { outputFolder: './results/html-report', open: 'never' }],
  ],

  use: {
    // Web app URL (running in Docker)
    baseURL:       'http://web:3000',
    screenshot:    'only-on-failure',
    video:         'retain-on-failure',
    trace:         'on-first-retry',

    // Save screenshots to /screenshots so agent can read them
    screenshotPath: '/screenshots',
  },

  projects: [
    {
      name: 'chromium',
      use:  { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use:  { ...devices['Pixel 5'] },
    },
  ],
});
