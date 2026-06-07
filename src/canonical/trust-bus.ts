// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 Vorion LLC

/**
 * @fileoverview Trust Bus enums for cross-layer governance propagation.
 *
 * This module is a **zero-dependency leaf**: it must contain no imports
 * (especially not `zod` or `drizzle-orm`) so that enum-only consumers —
 * signal producers, adapters, and analytics layers — can import the wire
 * enums without pulling any runtime dependency into their module graph.
 * The Zod schemas that previously lived here are in `trust-bus-schemas.ts`.
 *
 * `BusSeverity` and `BusSignalType` are the **frozen wire surface** shared
 * with `@vorionsys/rainbow` and the rainbow-interop harness. Member names
 * and string values are the contract; changing either breaks every consumer
 * comparing against these values. The guard test
 * `tests/canonical-trust-bus.test.ts` pins the exact member sets.
 *
 * The signal schema is open-source (Apache-2.0). The Bus Router that routes
 * and correlates these signals is an AgentAnchor Pro/Enterprise feature.
 *
 * @see {@link trust-bus-protocol-v0.md} for the full protocol specification
 * @module @vorionsys/contracts/canonical/trust-bus
 */

// ============================================================================
// Enums (zero-dependency wire surface)
// ============================================================================

/**
 * Governance layers that participate in Trust Bus signal propagation.
 */
export enum GovernanceLayer {
  /** CAR Registry, Paramesphere (future) — agent classification and credentials */
  IDENTITY = 'identity',
  /** CogniGate, Policy Engine — enforcement, trust scoring, proof chain */
  GOVERNANCE = 'governance',
  /** Phantom Runtime (future) — execution isolation, behavioral monitoring */
  CONTAINMENT = 'containment',
  /** A3I Orchestrator, Council — agent lifecycle coordination */
  ORCHESTRATION = 'orchestration',
  /** Observer layer — audit, compliance reporting, dashboards */
  OBSERVATION = 'observation',
}

/**
 * Signal delivery priority. Affects routing order and latency guarantees.
 */
export enum SignalPriority {
  /** Circuit breaker triggers, security events — <20ms target */
  CRITICAL = 'critical',
  /** Trust score changes, compliance violations — <50ms target */
  HIGH = 'high',
  /** Routine signals (success, decay) — <50ms target */
  NORMAL = 'normal',
  /** Informational, analytics — best-effort */
  LOW = 'low',
}

/**
 * Signal urgency classification per Trust Signal Bus whitepaper Section 2.1.
 *
 * NOTE: Distinct from the action risk levels (READ through LIFE_CRITICAL)
 * in `@vorionsys/basis`.
 */
export enum BusSeverity {
  /** Normal operational event */
  LOW = 'low',
  /** Moderate concern — enhanced monitoring */
  MEDIUM = 'medium',
  /** Significant event — immediate attention */
  HIGH = 'high',
  /** Severe event — enforcement action required */
  CRITICAL = 'critical',
  /** Immediate halt required — coordinated attack or life-safety threat */
  EMERGENCY = 'emergency',
}

/**
 * Cross-layer governance signal types per Trust Signal Bus whitepaper
 * Section 2.2.
 *
 * NOTE: Distinct from the intra-layer SignalType (ACTION_SUCCESS, etc.).
 */
export enum BusSignalType {
  /** Active threat identified (probe, tampering, injection) */
  THREAT_DETECTED = 'threat_detected',
  /** Behavioral or structural anomaly outside expected bounds */
  ANOMALY = 'anomaly',
  /** Gradual deviation from baseline (weight drift, behavioral drift) */
  DRIFT = 'drift',
  /** Agent actively probing execution environment (Heisenberg trigger) */
  PROBE_DETECTED = 'probe_detected',
  /** CSSR rotation executed; new execution surface active */
  ROTATION_TRIGGERED = 'rotation_triggered',
  /** Agent's policy envelope has been restricted */
  POLICY_TIGHTENED = 'policy_tightened',
  /** Agent's trust score or tier has changed */
  TRUST_UPDATED = 'trust_updated',
  /** Canary probe passed — positive trust signal */
  CANARY_PASSED = 'canary_passed',
  /** Canary probe failed — negative trust signal */
  CANARY_FAILED = 'canary_failed',
  /** Dormancy milestone reached — stepped trust deduction applied */
  DORMANCY_DEDUCTION = 'dormancy_deduction',
  /** Rolling 24h risk accumulator crossed warning threshold (>=60) */
  RISK_ACCUMULATOR_WARNING = 'risk_accumulator_warning',
  /** Rolling 24h risk accumulator crossed degraded threshold (>=120) */
  RISK_ACCUMULATOR_DEGRADED = 'risk_accumulator_degraded',
  /** Circuit breaker tripped — all operations halted */
  CIRCUIT_BREAKER_TRIPPED = 'circuit_breaker_tripped',
  /** RAINBOW detected a sustained trust trend (rising/falling) */
  TREND_DETECTED = 'trend_detected',
  /** RAINBOW detected a fleet-wide anomaly pattern */
  FLEET_ANOMALY = 'fleet_anomaly',
}
