# Security Policy

## Reporting a vulnerability

Report security issues privately — not through GitHub issues or public discussions.

**Email:** security@vorion.org

Include:
- Affected package version (`@vorionsys/contracts@x.y.z`)
- Reproduction steps or a minimal test case
- Your assessment of severity and impact
- Whether you intend to disclose publicly, and on what timeline

We acknowledge reports within 3 business days. We aim to confirm or refute within 14 days of acknowledgment.

## Scope

In-scope:

- Zod schemas that accept inputs they should reject, producing validated objects that violate contract invariants
- Type definitions that permit states the rest of the Vorion platform cannot safely handle
- Serialization or normalization helpers (`parseCAR`, `generateCAR`, validator utilities) that round-trip unsafely
- Drizzle schemas whose default values or constraints contradict the type-level contract

Out-of-scope:

- Vulnerabilities in `zod`, `drizzle-orm`, `@noble/ed25519`, or other dependencies — report those to the upstream project
- Issues in consumers of this library (Aurais, AgentAnchor, Cognigate, etc.) — report those to the respective product teams
- Theoretical issues that require an attacker to already control the signing key used in `car/attestation.ts` verification

## Supported versions

Until `v2.0.0`, every minor version is supported only through the next minor. No LTS commitment. Users on early versions should expect to upgrade.

After `v2.0.0`, we plan to maintain the current minor and the previous minor with security fixes.

## Disclosure

We prefer coordinated disclosure. After we acknowledge and have a fix in progress, we will agree on a public disclosure date. Attribution to the reporter is included unless you request anonymity.

If a reported issue is already being exploited, we may publish immediately without waiting for a coordinated date.

## Cryptography

This package references Ed25519 helpers (via `@noble/ed25519`) for CAR attestation verification. We do not implement our own primitives. If you believe we are using these libraries incorrectly, that is in scope.

## PGP

Not offered at this time. Email is sufficient for our scale. If you require encrypted communication, ask and we will arrange.
