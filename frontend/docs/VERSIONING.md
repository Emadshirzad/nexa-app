# Nexa CRM — Versioning Strategy

## 1. Semantic Versioning (SemVer)
Nexa CRM strictly adheres to Semantic Versioning (`MAJOR.MINOR.PATCH`):
- **MAJOR:** Incompatible database migrations requiring manual backup/migration protocols, or fundamental architecture overhaul.
- **MINOR:** New business modules (e.g. adding barcode scanning, new report charts) with backward-compatible migrations.
- **PATCH:** Bug fixes, security patches, Persian font alignment tweaks, or performance optimizations.

## 2. Android Version Codes
- `versionCode` is a strictly monotonically increasing positive integer:
  - Format: `MMmmpp` (e.g., `1.0.0` -> `10000`, `1.1.2` -> `10102`).
  - Never reused or rolled backward.
- `versionName` mirrors the SemVer string (e.g., `"1.0.0"`).
