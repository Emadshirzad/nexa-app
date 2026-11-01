# Nexa CRM — Project Overview

## 1. Executive Summary
**Nexa CRM** is a lightweight, personal, offline-first Customer Relationship Management (CRM) and business management mobile application built primarily for Android (smartphones and tablets).

Nexa CRM caters to solo business owners, independent sales professionals, and small teams (maximum 3–4 users per installation context) operating in Iran and Persian-speaking markets.

## 2. Core Tenets
1. **100% Offline-First:** Operates autonomously without requiring internet access, cloud servers, or third-party SaaS subscriptions. No external API dependencies for core business operations.
2. **Strict Financial Correctness:** Financial values are recorded in integer **Toman** (no floating-point rounding errors). Cash ledger follows immutable double-entry principles with compensating transactions for corrections.
3. **Inventory Integrity:** Product stock quantities are tracked as integers scaled by 1,000 (3 decimal places precision). Stock movements form an immutable ledger; the product stock balance is a reconciled cache of this ledger.
4. **Persian-First UX & Typography:** Native Right-to-Left (RTL) layout, Jalali calendar display and date pickers, IRANSansX typography, and official Iranian business invoicing conventions.
5. **Security & Privacy:** Local data protection via biometric / PIN authentication, local database encryption with SQLCipher, and AES-256-GCM encrypted backup archives for device transfers.

## 3. Technology Stack Summary
- **UI Framework:** Vue 3 (Composition API, `<script setup>`), TypeScript (Strict Mode)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS, PostCSS (RTL direction, custom brand palette)
- **Icons:** Lucide Icons
- **State Management:** Pinia (UI state only)
- **Routing:** Vue Router (mobile navigation, tab bar, sub-pages)
- **Validation:** Zod schemas
- **Mobile Container:** Capacitor (Native Android project, API 28+ / Android 9.0+)
- **Database:** SQLite with `@capacitor-community/sqlite` (SQLCipher encrypted)
- **Calendar:** Jalali (Solar Hijri) calendar with English digits
- **Currency:** Toman
- **Testing:** Vitest, Playwright, Component & Integration test suites
