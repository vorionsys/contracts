# Changelog

All notable changes to `@vorionsys/contracts` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2026-07-13

### Added

- **`VERIFICATION_REQUIRED` reason code** (`@vorionsys/contracts/basis`, additive,
  12 -> 13): emitted when a verification-gated capability lacks a fresh,
  evidence-committed attestation in the chain — no agent has final say on its own
  work. Ships with `@vorionsys/gate-core@0.6.0` (verificationGates: attestations are
  emitted by a different principal, human-validated via the escalation machinery,
  and expire by count-window). `@vorionsys/verify@0.6.0` rebuilds same-day.
## [1.5.0] - 2026-07-12

### Added

- **`APPROVAL_CEILING_EXCEEDED` reason code** (`@vorionsys/contracts/basis`, additive,
  11 -> 12): emitted when a quorum-approved escalation still exceeds the policy's
  approval ceiling — human approval grants permission within policy, never beyond it
  ("approval is not authority"). The chain shows the full story as a linked triple:
  escalation -> signed HUMAN_APPROVED vote -> gate denial. Ships with
  `@vorionsys/gate-core@0.5.0` (resolution-time re-checks) and the basis-demo
  approval-conflict scenarios; `@vorionsys/verify@0.5.0` rebuilds same-day.
## [1.4.0] - 2026-07-09

### Added

- **`CIRCUIT_BREAKER_OPEN` reason code** (`@vorionsys/contracts/basis`, additive,
  10 → 11): emitted by gates whose degradation policy has tripped the breaker for a
  capability class — the agent's accumulated strikes ended its non-read authority.
  Ships with `@vorionsys/gate-core@0.4.0` (multi-level degradation engine) and the
  basis-demo Gauntlet mode. `@vorionsys/verify@0.3.0` rebuilds against this same-day;
  older verify schema-rejects records carrying the code.
## [1.3.0] - 2026-07-08

### Added

- **Three BASIS reason codes** (additive, `@vorionsys/contracts/basis`):
  `CAPABILITY_NOT_GRANTED` (tier lacks the capability regardless of domain),
  `PARAM_NOT_ALLOWLISTED` (a parameter value violates policy — e.g. a prohibited
  lending decision basis), and `RATE_LIMIT_EXCEEDED` (velocity cap computed from
  the proof chain itself). Consumers that exhaustively switch on `ReasonCode`
  should add the new arms. Verifiers built against 1.2.0 schema-reject records
  carrying the new codes — `@vorionsys/verify@0.2.0` ships rebuilt against this.
## [1.2.0] - 2026-07-06

### Added

- **BASIS decision-record wire format** under the new `@vorionsys/contracts/basis`
  subpath: `DecisionRecordSchema` (strict Zod, v1), chain/keys file envelopes
  (`ChainFileSchema`, `KeysFileSchema`, `parseChainFile`, `parseKeysFile`),
  `toSignable()`, and the frozen v1 vocabularies (`DECISIONS`, `REASON_CODES`,
  `CREDENTIAL_STATUSES`). Two schema-level invariants ride along: a credential
  with `status: "none"` must carry `expiresAt: null`, and human resolutions
  (`HUMAN_APPROVED`/`HUMAN_DENIED`) must link to the escalation they resolve.
  Deliberately **not** re-exported from the package root — the `Decision*` names
  would collide with the v2 platform contracts. Consumers: `@vorionsys/verify`,
  `@vorionsys/gate-core`, and the basis-demo app. Canonicalization (RFC 8785),
  hashing, and Ed25519 signing intentionally live in `@vorionsys/verify`, not here.
  Reason-code/domain vocabularies to reconcile into `@vorionsys/shared-constants`
  before any v2 of the record format (tracked in the source header).
## [1.1.2] - 2026-06-15

### Changed

- **Widened the `typescript` peer range to `^5.0.0 || ^6.0.0`.** The previous
  `^5.0.0`-only peer forced an `ERESOLVE` install failure on consumers that had moved
  to TypeScript 6 (e.g. `@vorionsys/rainbow`). Purely a constraint widening — no
  source, type, or runtime changes. The package is built and tested with TypeScript
  5.x; its emitted `dist/` declarations are consumable by TypeScript 6 projects
  (verified by typechecking a TS6 consumer against the packaged types). Note:
  building this package's *own source* under `tsc` 6 is not yet clean (a global
  `crypto` resolution gap in `src/car/`), so its `devDependencies.typescript` stays
  on 5.x; that is independent of what consumers compile with.

## [1.1.1] - 2026-06-12

### Fixed

- Restored runtime exports required by the already-published `@vorionsys/a3i`
  consumer that were unintentionally dropped (contracts#4). No public type changes.

## [1.1.0] - 2026-06-06

### Added

- **Canonical trust-bus wire enums** — `BusSignalType` (15 cross-layer governance
  signal types) and the rainbow-era `BusSeverity` (`low` / `medium` / `high` /
  `critical` / `emergency`) at `@vorionsys/contracts/canonical/trust-bus`, per the
  Trust Signal Bus whitepaper §2.1–2.2. This is the single canonical source for
  these enums; `@vorionsys/rainbow` and other consumers re-export from here
  instead of vendoring copies. Member names and string values are a **frozen wire
  contract** guarded by `tests/canonical-trust-bus.test.ts`.
- `busSignalTypeSchema` Zod validator alongside the existing bus schemas.
- Explicit `./canonical/trust-bus` entry in the `exports` map (previously reachable
  only via the `./canonical/*` wildcard).

### Changed

- **`./canonical/trust-bus` is now a zero-dependency leaf.** The Zod schemas that
  lived there (`trustBusSignalSchema`, `emitTrustBusSignalSchema`,
  `busSubscriptionSchema`, payload schema, and the enum validators) moved to
  `./canonical/trust-bus-schemas`, which re-exports the enums for convenience.
  Enum-only imports no longer pull `zod` (or anything else) into the module graph.
- **`BusSeverity` members replaced.** The previous syslog-style members
  (`EMERGENCY`/`ALERT`/`WARNING`/`INFO`) are superseded by the five-member wire
  surface above. The old members were published in `1.0.0` but only reachable via
  the undocumented `./canonical/*` wildcard subpath, were not re-exported from
  `./canonical`, and have no known consumers (org-wide sweep + npm). Schema
  defaults that used `BusSeverity.INFO` now use `BusSeverity.LOW` ("normal
  operational event" in both vocabularies). If you compared against the old
  string values, migrate: `info` → `low`, `warning` → `medium`/`high` per your
  routing semantics, `alert` → `critical`.
- `bugs.url` now points at this repository's issue tracker.

## [1.0.0] - 2026-04-21

### First release under the OSS rebuild

- Package moves from an internal monorepo (proprietary license) to its own public repository under Apache-2.0.
- Public TypeScript surface is substantially compatible with the prior `0.x` line; type narrowing tightened in the `v2` namespace.
- Pre-1.0 versions (`0.1.0` through `0.4.x`) on npm are deprecated and should not be depended on. Migrate to `1.0.0`.

### Contents

- **v2 contract types** — `Intent`, `Decision`, `FluidDecision`, `TrustProfile`, `ProofEvent`, `PolicyBundle`.
- **Trust system types** — `TrustBand` (T0–T7), `ObservationTier`, `TrustDimensions`, `TrustWeights`, `TrustDynamics`.
- **Decision system** — `DecisionTier` (GREEN / YELLOW / RED), `RefinementAction`, `WorkflowState`, `FluidDecision`.
- **ATSF v2.0 types** — `CanaryProbe`, `CanaryCategory`, `PreActionGate`, `RiskLevel`, `GateVerification`.
- **ERPL compliance types** — `Evidence` and retention contracts.
- **Canonical agent types** with Zod schemas — `AgentConfig`, `AgentTask`, `AgentLifecycleStatus`, `AgentRuntimeStatus`, `AgentPermission`, `AgentSpecialization`, `AgentCapability`.
- **Canonical governance module** — trust bands, trust scores, risk levels, trust signals, middleware types.
- **CAR** (Categorical Agentic Registry) — `parseCAR` / `generateCAR`, `CapabilityLevel` (L0–L7), `CertificationTier`, `RuntimeTier`, attestations, JWT claims, effective permissions, domain/skill bitmasks.
- **Validators** — Zod schemas for `Intent`, `Decision`, `TrustProfile`, `ProofEvent` with `validate`, `safeValidate`, `formatValidationErrors` helpers.
- **Common primitives** — `UUIDSchema`, `SemVerSchema`, `TimestampSchema`, `HashSchema`, `ActorSchema`, `TrustBandSchema`, `AutonomyLevelSchema`.
- **Feature flag registry** — `FLAGS`, `FLAG_METADATA`, `isFeatureEnabled`, `getEnabledFeatures`, `getFlagsByCategory`, `getFlagsByPhase`.
- **Drizzle schemas** — relational persistence for contract types under `@vorionsys/contracts/db`.

Further history is in the git log of this repository.

## [0.1.2] - 2026-02-17

### Changed
- Pinned internal workspace dependencies to real version ranges for npm publish

## [0.1.1] - 2026-02-16

### Added
- Comprehensive README with full API reference, usage examples, and subpath import documentation
- CHANGELOG.md for tracking version history
- Extended keywords in package.json for npm discoverability

### Changed
- Updated package.json `files` field to include README.md, CHANGELOG.md, and LICENSE instead of non-existent `schemas` directory
- Improved package.json description to mention Zod validators and TypeScript types

### Fixed
- README license section now correctly states Apache-2.0 (was incorrectly listed as MIT)

## [0.1.0] - 2026-01-15

### Added
- Initial release of `@vorionsys/contracts`
- v2 contract types: Intent, Decision, FluidDecision, TrustProfile, ProofEvent, PolicyBundle
- Trust system: TrustBand (T0-T7), ObservationTier, TrustDimensions, TrustWeights, TrustDynamics
- Decision system: DecisionTier (GREEN/YELLOW/RED), RefinementAction, WorkflowState, FluidDecision
- ATSF v2.0 types: CanaryProbe, CanaryCategory, PreActionGate, RiskLevel, GateVerification
- ERPL compliance types: Evidence and Retention contracts
- Canonical agent types with Zod schemas: AgentConfig, AgentTask, AgentLifecycleStatus, AgentRuntimeStatus, AgentPermission, AgentSpecialization, AgentCapability
- Canonical governance module: trust bands, trust scores, risk levels, trust signals, middleware types
- CAR (Categorical Agentic Registry): parseCAR/generateCAR, CapabilityLevel (L0-L7), CertificationTier, RuntimeTier, attestations, JWT claims, effective permissions, domain/skill bitmasks
- Validators module: Zod schemas for Intent, Decision, TrustProfile, ProofEvent with utility functions (validate, safeValidate, formatValidationErrors)
- Common primitives: UUIDSchema, SemVerSchema, TimestampSchema, HashSchema, ActorSchema, TrustBandSchema, AutonomyLevelSchema
- Feature flag registry: FLAGS constant, FLAG_METADATA, isFeatureEnabled, getEnabledFeatures, getFlagsByCategory, getFlagsByPhase
- Database schemas: Drizzle ORM table definitions for agents, tenants, attestations, proofs, and more
- ACI module (deprecated alias for CAR, backwards compatibility)
- Subpath exports for granular imports: /common, /v2, /validators, /car, /aci, /canonical, /db
