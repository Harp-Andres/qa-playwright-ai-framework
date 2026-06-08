# QA Playwright AI Framework

This repository hosts an advanced, scalable QA automation framework built with Playwright and TypeScript. Designed for modern testing needs, it includes:

1. **Web Automation (2 Flows)**
   - Example flow 1: Login and validate inventory/home page.
   - Example flow 2: Add product to cart and complete checkout.
2. **API Tests for 2 Sample Services**
   - Service 1: Authentication flow with token handling.
   - Service 2: Resource retrieval and validation against secured/public endpoints.
3. **Design Patterns**
   - Page Object Model (POM) with selectors separated from page actions.
4. **Scalable Features**
   - Retry for flaky/environmental failures.
   - Parallel execution.
   - Docker and Kubernetes integration.
5. **AI-Ready Layer**
   - Self-healing locator strategy.
   - Failure/flaky analysis hooks.
   - Extensible architecture ready for LLM integration.
6. **Environment Configurations**
   - `local`, `dev`, and `qa` environments.
   - Variable-driven execution compatible with Azure DevOps Classic Release.
7. **Best Practices**
   - Secure secrets handling.
   - Logging, reporting, CI/CD, linting, formatting, and scalable project structure.

## Proposed Demo Targets

### Web
- **Target app:** Sauce Demo
- **URL:** configured per environment but initially the same test URL across local/dev/qa
- **Flow 1:** Login with standard user and validate inventory page
- **Flow 2:** Add item to cart, complete checkout, validate confirmation

### API
- **Target service A:** ReqRes authentication endpoint
- **Flow 1:** Obtain token using login endpoint and validate token response
- **Target service B:** Fake Store API or JSONPlaceholder-compatible resource service
- **Flow 2:** Query product/user resource and validate schema/status/business assertions

## Quick Start

```bash
npm install
npm run test:web:dev
npm run test:api:dev
```

## Status

Bootstrap files initialized. Full framework scaffold will be added next.
