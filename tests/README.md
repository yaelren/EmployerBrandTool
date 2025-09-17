# Tests for Chatooly-EmployerBrandTool

This directory contains comprehensive tests for the Employer Brand Tool, ensuring quality and reliability of all features.

## Test Structure

```
tests/
├── playwright/           # End-to-end tests using Playwright
│   ├── text-component.spec.js  # TextComponent system tests
│   └── playwright.config.js    # Playwright configuration
├── unit/                # Unit tests (Jest or similar)
└── README.md            # This file
```

## Playwright Tests

### TextComponent System Tests (`text-component.spec.js`)

Comprehensive E2E tests covering the centralized TextComponent architecture:

#### Main Text Features
- ✅ **Text Rendering**: Initial text display and line alignment controls
- ✅ **Text Styling**: Bold, Italic, Underline, Highlight toggles
- ✅ **Highlight Color**: Color picker show/hide functionality
- ✅ **Text Color**: Color input changes
- ✅ **Line Alignment**: Per-line L/C/R alignment controls

#### Spot Detection & Management
- ✅ **Spot Detection**: Successful spot finding algorithm
- ✅ **Spots Navigation**: Tab switching and spot list display
- ✅ **Spot Controls**: Type selection and settings visibility

#### Spot Text Features  
- ✅ **Type Conversion**: Changing spots to Text type
- ✅ **Text Input**: Entering text in spot text areas
- ✅ **Spot Styling**: Bold, Italic, Underline, Highlight for spots
- ✅ **Spot Alignment**: L/C/R alignment for spot text
- ✅ **Spot Colors**: Text and highlight color controls

#### System Integration
- ✅ **Mode Persistence**: Styling maintained across mode switches
- ✅ **Dynamic Updates**: Text changes update line controls
- ✅ **Spot Clearing**: Text changes clear existing spots

#### Error Handling
- ✅ **Empty Text**: Graceful handling of empty content
- ✅ **Rapid Interactions**: No UI race conditions

## Running Tests

### Prerequisites
```bash
# Install Playwright
npm install @playwright/test
npx playwright install
```

### Run All Tests
```bash
# Run all Playwright tests
npx playwright test

# Run with UI mode (visual test runner)
npx playwright test --ui

# Run specific test file
npx playwright test text-component.spec.js
```

### View Test Reports
```bash
# Open HTML report
npx playwright show-report tests/playwright-report
```

### Debug Tests
```bash
# Run in debug mode
npx playwright test --debug

# Run specific test in debug mode
npx playwright test text-component.spec.js --debug
```

## Test Coverage

Current test coverage focuses on:

### ✅ Implemented Features
- **TextComponent Architecture**: Base class, MainTextComponent, SpotTextComponent
- **Main Text Styling**: All text styling options and controls
- **Spot Text System**: Complete spot text functionality
- **UI Integration**: All user interface interactions
- **Cross-Feature Integration**: Feature interactions and data flow

### 🚧 Future Test Areas
- **Canvas Rendering**: Visual validation of text rendering
- **Performance**: Load testing with many spots
- **Accessibility**: WCAG compliance validation
- **Cross-Browser**: Extended browser compatibility
- **Mobile**: Responsive design validation

## Test Development Guidelines

### Writing New Tests

1. **File Naming**: Use descriptive names like `feature-name.spec.js`
2. **Test Structure**: Group related tests in `describe` blocks
3. **Setup/Teardown**: Use `beforeEach` for common setup
4. **Assertions**: Use meaningful assertions with clear error messages
5. **Selectors**: Prefer role-based selectors over CSS selectors

### Example Test Structure
```javascript
test.describe('New Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForFunction(() => window.app?.isInitialized);
  });

  test('should handle basic functionality', async ({ page }) => {
    // Arrange
    const element = page.locator('#feature-element');
    
    // Act
    await element.click();
    
    // Assert
    await expect(element).toHaveClass(/active/);
  });
});
```

### Best Practices

1. **Isolation**: Each test should be independent
2. **Readability**: Tests should be self-documenting
3. **Reliability**: Use proper waits and assertions
4. **Coverage**: Test both happy path and edge cases
5. **Performance**: Keep tests fast and focused

## Memory Integration

This testing framework is integrated with Claude's memory system to:

- **Track Feature Coverage**: Ensure all implemented features have tests
- **Document Test Patterns**: Reusable patterns for future features  
- **Quality Assurance**: Maintain high quality standards
- **Regression Prevention**: Catch breaking changes early

## Continuous Integration

Tests can be integrated with CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Playwright Tests
  run: |
    npm install @playwright/test
    npx playwright install
    npx playwright test
```

This comprehensive testing framework ensures the Employer Brand Tool maintains high quality and reliability as new features are added.