# Nexa CRM — UI/UX & Design System Guidelines

## 1. Visual Direction: Modern Minimal & Mobile-First
Nexa CRM is designed for fast, focused touch interactions in busy retail and field-sales environments. The interface eliminates decorative fluff, heavy gradients, and sluggish animations in favor of crisp visual hierarchy and immediate tactile feedback.

## 2. Brand Color Palette
- **Graphite (`#17212B`):** Deep charcoal for primary dark backgrounds, high-contrast headings, and dominant accents in light mode.
- **Dark Slate (`#243746`):** Secondary container surface in dark mode, borders, and sub-text badges.
- **Emerald (`#10B981`):** Primary action color, positive balances, successful receipts, and verified statuses.
- **Mint (`#E8F5EF`):** Subtle emerald tint for badge backgrounds, active pill highlights, and light mode notification states.
- **White (`#FFFFFF`):** Clean background in light mode, high-contrast text in dark mode.
- **Crimson (`#EF4444`):** Warning states, overdue tasks, negative balances, and destructive action triggers.

## 3. Typography & RTL Conventions
- **Font Family:** `IRANSansX`, system Persian sans-serif fallback.
- **Direction:** `dir="rtl"` enforced on the root viewport.
- **Numbers:** Persian text uses English digits (0-9) to avoid digit confusion in financial math and invoice numbers while maintaining Persian typographic elegance.
- **Calendar & Dates:** All dates presented in Solar Hijri (Jalali, e.g. ۱۴۰۵/۰۸/۱۱ or 1405/08/11) with English numerals.

## 4. Theme Support
- Light Theme (default high-contrast clean white and graphite)
- Dark Theme (OLED-friendly `#17212B` base with emerald highlights)
- System Theme Auto-detection with manual override in Settings.

## 5. Touch Targets & Ergonomics
- Minimum touch target: $48 \times 48\text{dp}$.
- Bottom navigation bar: Height $64\text{dp}$, persistent across top-level views.
- Safe Area Insets: Supports Android notch, gesture navigation bar, and status bar padding (`env(safe-area-inset-*)`).
