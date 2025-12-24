# Contributing to @AstroFusion/sweph

Thank you for your interest in contributing to the @AstroFusion/sweph library! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. By participating, you agree to:

- Be respectful and inclusive
- Focus on constructive feedback
- Accept responsibility for mistakes
- Show empathy towards other contributors
- Help create a positive community

## Getting Started

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm** or **yarn** or **pnpm**
- **Git**

### Quick Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/af-sweph.git
   cd af-sweph
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the project:
   ```bash
   npm run build
   ```
5. Run tests:
   ```bash
   npm test
   ```

## Development Setup

### Environment Setup

The project uses several tools for development:

- **TypeScript**: For type-safe JavaScript
- **Vitest**: For unit testing
- **ESLint**: For code linting
- **Prettier**: For code formatting (via ESLint)
- **node-gyp-build**: For native module loading

### Available Scripts

```bash
# Build the library
npm run build

# Build ESM version
npm run build:esm

# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Prepublish build (runs before npm publish)
npm run prepublishOnly
```

### Development Workflow

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes with tests

3. Run the test suite:
   ```bash
   npm test
   ```

4. Run linting:
   ```bash
   npm run lint
   ```

5. Build the project:
   ```bash
   npm run build
   ```

6. Commit your changes:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

7. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

8. Create a Pull Request

## Project Structure

```
├── src/                    # Source code
│   ├── index.ts           # Main entry point
│   ├── types.ts           # TypeScript type definitions
│   ├── constants.ts       # Constants and enums
│   ├── planets.ts         # Planet calculations
│   ├── houses.ts          # House and lagna calculations
│   ├── sun.ts             # Solar calculations
│   ├── moon.ts            # Lunar calculations
│   ├── utils.ts           # Utility functions
│   └── legacy.ts          # Legacy compatibility
├── dist/                  # Compiled JavaScript output
├── ephe/                  # Swiss Ephemeris data files
├── native/                # Native addon source
├── prebuilds/             # Pre-built binaries
├── node_modules/          # Dependencies
├── package.json           # Package configuration
├── tsconfig.json          # TypeScript configuration
├── vitest.config.ts       # Test configuration
├── binding.gyp            # Native build configuration
├── README.md              # Project documentation
├── API.md                 # API reference
└── CONTRIBUTING.md        # This file
```

## Coding Standards

### TypeScript Guidelines

- Use TypeScript for all new code
- Enable strict type checking
- Use interfaces for complex object types
- Prefer `type` for simple unions and aliases
- Use proper JSDoc comments for all public APIs

### Code Style

- Use ESLint configuration for consistent formatting
- Use 2 spaces for indentation
- Use single quotes for strings
- Use semicolons
- Maximum line length: 100 characters
- Use meaningful variable and function names

### Naming Conventions

- **Functions**: camelCase (`calculatePlanets`, `getAyanamsa`)
- **Interfaces**: PascalCase (`Planet`, `GeoLocation`)
- **Enums**: PascalCase (`PlanetId`, `AyanamsaType`)
- **Constants**: UPPER_SNAKE_CASE (`PLANETS`, `CALC_FLAGS`)
- **Files**: kebab-case (`planets.ts`, `sun-times.ts`)

### Error Handling

- Use specific error messages
- Throw `Error` objects with descriptive messages
- Handle edge cases gracefully
- Return `null` for "not found" cases rather than throwing

## Testing

### Test Structure

Tests are located alongside source files with `.test.ts` extension:

```
src/
├── planets.ts
├── planets.test.ts
├── utils.ts
└── utils.test.ts
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { calculatePlanets } from './planets';

describe('calculatePlanets', () => {
  it('should calculate all 9 planets', () => {
    const date = new Date('2024-01-01T12:00:00Z');
    const planets = calculatePlanets(date);

    expect(planets).toHaveLength(9);
    expect(planets[0].name).toBe('Sun');
    expect(planets[0].longitude).toBeGreaterThan(0);
    expect(planets[0].longitude).toBeLessThanOrEqual(360);
  });

  it('should handle different ayanamsa systems', () => {
    const date = new Date('2024-01-01T12:00:00Z');
    const planets = calculatePlanets(date, { ayanamsa: 5 }); // Krishnamurti

    expect(planets).toBeDefined();
    // Add specific assertions
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

Aim for high test coverage, especially for:

- Core calculation functions
- Edge cases (polar regions, boundary dates)
- Different ayanamsa systems
- Error conditions

## Documentation

### JSDoc Comments

All public functions must have comprehensive JSDoc comments:

```typescript
/**
 * Calculate positions for all 9 Vedic planets
 * @param date - Date and time for calculation (local time)
 * @param options - Calculation options including ayanamsa and location
 * @returns Array of planet positions with Vedic astrology details
 * @throws Error if Swiss Ephemeris calculation fails
 * @example
 * ```typescript
 * const planets = calculatePlanets(new Date(), {
 *   ayanamsa: AYANAMSA.LAHIRI
 * });
 * ```
 */
export function calculatePlanets(
  date: Date,
  options: CalculationOptions = {}
): Planet[] {
  // Implementation
}
```

### README Updates

When adding new features:

1. Update the README.md with usage examples
2. Update API.md with detailed function signatures
3. Add examples for new configuration options
4. Update the changelog

## Pull Request Process

### Before Submitting

1. **Test thoroughly**: Ensure all tests pass
2. **Lint your code**: Run `npm run lint`
3. **Build successfully**: Run `npm run build`
4. **Update documentation**: Add JSDoc comments and examples
5. **Write tests**: Add tests for new functionality

### PR Template

Use this template for pull requests:

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing performed

## Documentation
- [ ] JSDoc comments added
- [ ] README updated
- [ ] API.md updated
- [ ] Examples added

## Breaking Changes
List any breaking changes and migration guide
```

### Review Process

1. Automated checks run (tests, linting, build)
2. Code review by maintainers
3. Approval and merge
4. Automatic release (if applicable)

## Reporting Issues

### Bug Reports

Use the GitHub issue template for bugs:

- **Title**: Clear, descriptive title
- **Description**: Detailed description of the issue
- **Steps to reproduce**: Step-by-step reproduction guide
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: Node.js version, OS, library version
- **Code sample**: Minimal code to reproduce the issue

### Feature Requests

For new features:

- **Title**: Clear feature title
- **Description**: Detailed description of the proposed feature
- **Use case**: Why this feature would be useful
- **Implementation ideas**: How you think it should work
- **Alternatives**: Any alternative approaches considered

### Security Issues

For security-related issues, please email [security@astrofusion.com](mailto:security@astrofusion.com) instead of creating a public issue.

## Release Process

### Version Numbering

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Pre-release Checklist

- [ ] All tests pass
- [ ] Code is linted
- [ ] Documentation is updated
- [ ] Changelog is updated
- [ ] Version number is updated in package.json
- [ ] Build artifacts are generated
- [ ] Cross-platform testing completed

## Community

- **Discussions**: Use GitHub Discussions for questions and general discussion
- **Issues**: Use GitHub Issues for bugs and feature requests
- **Discord**: Join our Discord community for real-time discussion
- **Newsletter**: Subscribe for updates and announcements

## License

By contributing to this project, you agree that your contributions will be licensed under the same MIT License that covers the project.

Thank you for contributing to @AstroFusion/sweph! 🌟
