# E2E Testing Framework Template

**Version**: 1.0  
**Source**: Chatooly-EmployerBrandTool (Proven Implementation)  
**Compatibility**: Playwright 1.40+, Node 16+  
**Use Case**: Canvas-based creative tools, complex UI applications, Chatooly projects

## Quick Setup Guide

### 🚀 1. Installation
```bash
# Add to package.json devDependencies
npm install --save-dev @playwright/test

# Install browsers
npx playwright install

# Add npm scripts to package.json
"scripts": {
  "test": "playwright test",
  "test:ui": "playwright test --ui",
  "test:debug": "playwright test --debug",
  "test:report": "playwright show-report tests/playwright-report"
}
```

### 📁 2. Directory Structure
```
tests/
├── playwright/
│   ├── playwright.config.js      # Copy from template below
│   └── your-feature.spec.js      # Your test files
├── unit/                         # Future unit tests
└── README.md                     # Documentation
```

### ⚙️ 3. Configuration File
Create `tests/playwright/playwright.config.js`:

```javascript
/**
 * Playwright Configuration Template
 * Proven configuration from Chatooly-EmployerBrandTool
 */

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/playwright',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'tests/playwright-report' }],
    ['list']
  ],
  
  /* Shared settings for all the projects below. */
  use: {
    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

## Template Test File

### 📝 Basic Test File Structure
Create `tests/playwright/your-feature.spec.js`:

```javascript
/**
 * Test Template for [Your Feature Name]
 * Based on proven patterns from Chatooly-EmployerBrandTool
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

// Adjust path to your HTML file
const APP_URL = `file://${path.join(__dirname, '../../index.html')}`;

test.describe('Your Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
    // CRITICAL: Wait for your app to initialize
    // Adjust condition based on your app's initialization pattern
    await page.waitForFunction(() => window.app && window.app.isInitialized);
  });

  test.describe('Feature Group 1', () => {
    test('should handle basic functionality', async ({ page }) => {
      // Arrange
      const element = page.locator('#your-element');
      
      // Act
      await element.click();
      
      // Assert
      await expect(element).toHaveClass(/active/);
    });
  });

  test.describe('Feature Group 2 (with setup)', () => {
    test.beforeEach(async ({ page }) => {
      // Feature-specific setup that all tests in this group need
      await page.locator('#setup-action').click();
      // Wait for setup to complete
      await page.waitForFunction(() => window.setupComplete === true);
    });

    test('should handle complex workflow', async ({ page }) => {
      // Test implementation using established setup
    });
  });
});
```

## Proven Pattern Templates

### 🎭 1. Dynamic Content Testing
```javascript
test('should handle dynamic content updates', async ({ page }) => {
  // Trigger content generation
  await page.locator('#generate-content').click();
  
  // Wait for content to be generated (adjust selector and condition)
  await page.waitForFunction(() => {
    const count = document.querySelector('#content-count');
    return count && parseInt(count.textContent) > 0;
  });
  
  // Validate the generated content
  const contentList = page.locator('.content-item');
  await expect(contentList).toHaveCount(4); // Adjust expected count
});
```

### 🔄 2. State Toggle Testing
```javascript
test('should toggle feature states correctly', async ({ page }) => {
  const toggleBtn = page.locator('#feature-toggle');
  const relatedElement = page.locator('#feature-element');
  
  // Test activation
  await toggleBtn.click();
  await expect(toggleBtn).toHaveClass(/active/);
  await expect(relatedElement).toBeVisible();
  
  // Test deactivation
  await toggleBtn.click();
  await expect(toggleBtn).not.toHaveClass(/active/);
  await expect(relatedElement).toBeHidden();
});
```

### 🧩 3. Multi-Step Workflow Testing
```javascript
test('should complete multi-step workflow', async ({ page }) => {
  // Step 1: Initial action
  await page.locator('#step-1-button').click();
  await expect(page.locator('#step-1-complete')).toBeVisible();
  
  // Step 2: Configure options
  await page.locator('#option-select').selectOption('text');
  await page.locator('#options-toggle').click();
  
  // Step 3: Validate final state
  const controls = page.locator('.workflow-controls');
  await expect(controls).toBeVisible();
  await expect(controls.locator('.control-item')).toHaveCount(3);
});
```

### 🛡️ 4. Error Handling Testing
```javascript
test('should handle edge cases gracefully', async ({ page }) => {
  // Test with empty input
  await page.locator('#input-field').fill('');
  await page.locator('#submit-button').click();
  
  // Should not crash (no error dialogs)
  const errorDialog = page.locator('[role="dialog"]');
  await expect(errorDialog).toHaveCount(0);
  
  // Should show appropriate UI state
  const warningMessage = page.locator('#warning-message');
  await expect(warningMessage).toBeVisible();
});
```

### ⚡ 5. Rapid Interaction Testing
```javascript
test('should handle rapid user interactions', async ({ page }) => {
  // Simulate rapid clicking
  for (let i = 0; i < 5; i++) {
    await page.locator('#button-1').click();
    await page.locator('#button-2').click();
    await page.locator('#button-3').click();
  }
  
  // Should end in consistent, predictable state
  await expect(page.locator('#final-state')).toHaveClass(/stable/);
});
```

## Selector Best Practices

### 🎯 Selector Priority Hierarchy
```javascript
// 1. Role-based (most reliable)
page.getByRole('button', { name: 'Submit' })
page.getByRole('textbox', { name: 'Username' })

// 2. Test IDs (when available)
page.locator('#submit-button')
page.locator('[data-testid="username-input"]')

// 3. CSS selectors (for specific elements)
page.locator('.primary-button')
page.locator('.form-group input')

// 4. Data attributes (for complex state)
page.locator('[data-state="active"]')
page.locator('[data-line="0"][data-align="left"]')

// 5. Text content (when unique)
page.locator('text=Submit Form')
page.getByText('Error: Invalid input')
```

## Advanced Patterns

### 🔄 Canvas/Drawing Testing
```javascript
test('should handle canvas interactions', async ({ page }) => {
  const canvas = page.locator('#drawing-canvas');
  
  // Get canvas dimensions for coordinate calculation
  const box = await canvas.boundingBox();
  
  // Simulate drawing gesture
  await canvas.click({ 
    position: { x: box.width / 2, y: box.height / 2 } 
  });
  
  // For visual validation (optional)
  await expect(page).toHaveScreenshot('canvas-state.png');
});
```

### 🎨 Color Picker Testing
```javascript
test('should handle color picker interactions', async ({ page }) => {
  const colorInput = page.locator('#color-picker');
  
  // Set color value
  await colorInput.fill('#ff0000');
  await expect(colorInput).toHaveValue('#ff0000');
  
  // Trigger color change event if needed
  await colorInput.dispatchEvent('change');
  
  // Validate color was applied
  const styledElement = page.locator('#styled-element');
  await expect(styledElement).toHaveCSS('color', 'rgb(255, 0, 0)');
});
```

### 📱 Responsive/Mobile Testing
```javascript
// Add to playwright.config.js projects array:
{
  name: 'Mobile Chrome',
  use: { ...devices['Pixel 5'] },
},

// Mobile-specific test
test('should work on mobile viewports', async ({ page }) => {
  // Mobile-specific interactions
  await page.locator('#mobile-menu-button').click();
  await expect(page.locator('#mobile-menu')).toBeVisible();
});
```

## Memory Integration Hooks

### 💾 Add to Your Test Files
```javascript
// At the top of important test files, add memory integration comment:
/**
 * MEMORY INTEGRATION:
 * - Feature: [Feature Name]
 * - Coverage: [Percentage or description]
 * - Patterns Used: [List key patterns from this test]
 * - Last Updated: [Date]
 */
```

## CI/CD Integration

### 🤖 GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npx playwright install --with-deps
    - run: npx playwright test
    - uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: playwright-report
        path: tests/playwright-report/
```

## Troubleshooting Guide

### 🚨 Common Issues & Solutions

1. **Flaky Tests**: Always use `waitForFunction()` instead of `waitForTimeout()`
2. **Selector Failures**: Use role-based selectors when possible
3. **Race Conditions**: Proper setup in `beforeEach()` blocks
4. **CI Failures**: Increase retries and use proper wait conditions

### 📊 Success Criteria
- [ ] All tests pass consistently across browsers
- [ ] No flaky tests (>95% reliability)
- [ ] Test execution time <5 minutes
- [ ] Clear failure messages for debugging
- [ ] Coverage of all critical user workflows

## Template Customization Checklist

When adapting this template for your project:

- [ ] Update `APP_URL` path to your HTML file
- [ ] Modify `window.app.isInitialized` condition to match your app
- [ ] Adjust selector patterns to match your UI framework
- [ ] Add project-specific test patterns as needed
- [ ] Update browser configuration based on your requirements
- [ ] Configure CI/CD integration for your platform

This template provides a battle-tested foundation for reliable E2E testing based on proven patterns from the Chatooly-EmployerBrandTool implementation.