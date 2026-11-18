# Changelog

## [1.3.0] - 2026-11-19

- Drag links by the grip handle to reorder them within their category.
- Added accessible arrow-key reordering (focus the handle, press Up/Down).
- Ordering is saved locally and optionally synced across devices with Chrome Sync.
- Older v1.2 link records stay intact; first reorder initializes ordering for that category.
- Moving links to a different category places them at the end if that category is ordered.
- JSON exports preserve the visible link order for fresh restores.
- Reordering is disabled while search is active to prevent hidden-item surprises.

## [1.2.0] - 2026-11-17

- Added English as the default UI language and optional Persian (فارسی).
- Added instant RTL/LTR layout switching and locally remembered language preference.
- Retained optional cross-device Chrome Sync and local-first storage.
- Included AraanCo Design 2 icons at 16, 32, 48, and 128 pixels.

## [1.1.0]

- Added link editing, search, current-tab capture, JSON import/export, URL validation, and duplicate protection.
- Added optional Chrome Sync with per-link records and conflict handling.
- Added light/dark theme and fixed extension ID for manual installations.
