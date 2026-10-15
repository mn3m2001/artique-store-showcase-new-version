# New version — validation and scope

Validated on 2026-10-15.

- Independent public showcase repository; the original showcase and the live deployment source were not modified.
- The current photo-tour and responsive card source was compared with the current local deployment checkout. ProductCard, storefront glass styles and the photo-tour document match after normalizing line endings. Sanitized sample data and local authentication settings are intentionally retained.
- Eight new public-page screenshots cover desktop and mobile home, the product-photo tour, the store, and product details. The previous screenshots are retained separately.
- `npm ci`: completed.
- `npm run setup`: completed; generated local-only credentials and environment configuration are ignored by Git.
- `npm test`: 18 tests passed across 3 files.
- `npm run build`: Next.js production build and TypeScript checks passed.
- `npm audit --omit=dev`: no reported production dependency vulnerabilities.
- Full dependency audit: 5 high-severity findings in the development-only ESLint / fast-glob / micromatch / braces dependency chain. The suggested automatic remediation would downgrade the Next.js ESLint configuration across a major version, so it was not applied to this version-preserving snapshot. This remains a tooling maintenance item; the build and tests passed.
- A targeted scan found no embedded JWTs, private keys or common service-token patterns in the source files. This is a limited check, not a comprehensive security audit.

No customer records, order exports, payment evidence, admin screenshots, production environment files or shared credentials were added. The isolated local demo does not connect to the live store's database.

The portfolio presentation of this release is being reviewed locally before publishing the portfolio itself.
