/**
 * Playwright configuration specific for spots system tests
 */

const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/spots-system.spec.js',
  timeout: 15000, // 15 seconds per test
  expect: {
    timeout: 8000 // 8 seconds for assertions
  },
  use: {
    headless: false,
    slowMo: 500, // Slow down actions by 500ms
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...require('@playwright/test').devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    }
  ],
  reporter: [
    ['html', { outputFolder: 'test-results/spots-html-report' }],
    ['list']
  ]
});