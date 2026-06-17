# AstroVerse - Quality Assurance & Test Strategy

This document outlines the testing strategy, tools, and assertion frameworks for verifying both backend and frontend components of AstroVerse.

---

## 1. Test Architecture

The platform quality assurance spans three levels of verification:

```text
┌─────────────────────────────────────────────────────────┐
│              E2E / Playwright Integration               │
│        (Verify login, bookings, chart overlays)         │
└────────────────────────────┬────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────┐
│             xUnit Web API Controller Tests              │
│       (Verify JWT auth guards, limits, error codes)     │
└────────────────────────────┬────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────┐
│               Core Astrological Unit Tests              │
│        (Check Guna Milan calculations, charts)          │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Backend Unit Testing (`AstroVerse.Tests`)
We will use **xUnit** along with **FluentAssertions** for our backend testing.

### 2.1. Core Logic Assertions
Unit tests are focused on verifying mathematical calculations without database latency:
- **Guna Milan Points Engine**: Validate Guna points mapping for specific Nakshatras (e.g. check that Ashwini & Krittika calculate the correct Guna points matching standard rules).
- **Muhurat Score Calculations**: Ensure that the planner returns appropriate Muhurat timeframes given a date range.
- **Vimshottari Dasha Engine**: Check that Dasha start/end boundaries align correctly with the solar age progression of a profile.

### 2.2. Web API Integration Mocking
- **In-Memory DbContext**: Use Entity Framework Core's in-memory provider to mock user registrations, vaults, and subscription updates.
- **Mock Token Handler**: Validate that expired JWT signatures are successfully rejected.

---

## 3. Frontend Component & E2E Testing
- **Jest & React Testing Library**:
  - Assert that SVG birth charts dynamically render coordinates passed down through properties.
  - Verify that the `TranslationContext` updates texts across component trees when language is changed.
- **Playwright E2E**:
  - Complete the automated checkout flow simulator.
  - Validate that vault trees render nodes correctly on mobile viewports.

---

## 4. Run Commands

To trigger all backend tests:
```bash
dotnet test
```

To run frontend component tests:
```bash
npm run test
```
