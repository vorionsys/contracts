# Changelog

All notable changes to `@vorionsys/contracts` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
