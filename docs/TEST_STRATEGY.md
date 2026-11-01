# Nexa CRM — Automated Testing Strategy

## 1. Testing Pyramid

```
          /  E2E Tests  \          Playwright / Android Real Device
         /----------------\
        / Integration Tests \       SQLite in-memory, Repositories, Migrations
       /----------------------\
      /       Unit Tests       \     Pure Domain, Math, Currency, Stock logic
     /--------------------------\
```

## 2. Unit Testing Scope (Fast, Zero Dependencies)
- **Financial Calculations:**
  - Invoice subtotal, item discounts, invoice-level discounts, final amount.
  - Zero floating-point rounding errors (strict integer Toman math).
  - Debt calculation ($Debt = \text{Issued Total} - \text{Payments}$).
- **Inventory Logic:**
  - Scaled integer calculations ($quantity \times 1000$).
  - Cancellation compensatory stock restoration.
- **Input Validations:**
  - Zod schemas for mobile phone numbers, customer names, SKUs, and prices.
- **Date & Calendar Formatting:**
  - Jalali conversion, leap year handling, English digit representation.

## 3. Integration Testing Scope
- Database migrations applying cleanly from clean state.
- Repository operations with SQLite foreign key constraints enabled.
- Concurrent transactions and rollback validation.
- Encrypted backup creation and 10-step restore round-trip.

## 4. Test Frameworks
- Test Runner: **Vitest**
- Assertions: Vitest built-in expect
- Mocking: Vitest vi
- DOM / Component testing: `@vue/test-utils` + JSDOM
