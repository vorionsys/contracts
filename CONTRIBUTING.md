# Contributing to @vorionsys/contracts

Thank you for considering a contribution. This repository holds the shared contract types and Zod validators for the Vorion AI governance platform. Scrutiny, counter-proposals, and independent implementations against this surface are welcome.

## What we accept

**Bug fixes.** Corrections to existing Zod schemas, validators, or type definitions where a constraint is wrong or a type is imprecise. Include a failing test that would have caught the bug.

**Documentation, typos, clarifications.** Always welcome.

**New Zod validators** for existing types that lack them. Open an issue first to confirm the type is stable enough to lock behind a validator.

**Drizzle schema additions** for existing contract types that need relational persistence. Open an issue first so migrations can be coordinated across dependent packages.

## What we do not accept without discussion

- **New contract types.** The type surface is versioned and lives on a deprecation calendar. New types should be proposed via issue with a named consumer in mind.
- **Breaking type changes** in published subpaths without a major version bump. Tightening type narrowing is minor-breaking and must follow semver.
- **Changes to `canonical/*`** that disagree with `@vorionsys/basis-spec` canonical values. `@vorionsys/basis-spec` is the single source of truth for trust parameters; this package mirrors it. If you find a mismatch, file an issue naming both packages.

## Before you open a PR

- Read the relevant subpath's types to understand the existing shape.
- Open an issue to discuss significant changes. This avoids work on a direction that will not merge.
- Run `npm install`.
- Run `npm run build` and confirm TypeScript compiles clean.
- Run `npm run test` and confirm Vitest passes.
- Add or update tests that demonstrate the change.

## Commit style

Conventional commits are encouraged but not mandatory:

- `feat(v2):` new capability in the `v2` namespace
- `fix(validators):` correct a Zod schema
- `docs:` documentation clarification
- `chore:` repository housekeeping
- `test:` add or update tests

## Reporting security issues

Do not open a public issue for security vulnerabilities. See [SECURITY.md](./SECURITY.md).

## Code of conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating you agree to uphold this code.

## License

By submitting a Contribution, you agree to license your work under the Apache License, Version 2.0 (the license this project carries). You retain copyright on your Contribution; the license grants us and all users the right to use, modify, and redistribute under the same terms.

## Who decides what merges

Vorion LLC maintains this repository and has final commit authority. Substantive disagreements about type-surface direction are resolved through the issue tracker with visible rationale.

## Thanks

Every review, test, reproduction, and counter-argument improves the schema surface. If a type is wrong somewhere, we want to know.
