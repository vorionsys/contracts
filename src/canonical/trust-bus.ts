// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 Vorion LLC

/**
 * @fileoverview Trust Bus signal types for cross-layer governance propagation.
 *
 * Trust Bus signals extend the intra-layer TrustSignal with routing metadata
 * for propagating trust-relevant events across governance layers (Identity,
 * Governance, Containment, Orchestration, Observation).
 *
 * The signal schema is open-source (Apache-2.0). The Bus Router that routes
 * and correlates these signals is an AgentAnchor Pro/Enterprise feature.
 *
 * @see {@link trust-bus-protocol-v0.md} for the full protocol specification
 * @module @vorionsys/contracts/canonical/trust-bus
 */

import { z } from 'zod';
import { signalTypeSchema } from './trust-signal.js';

// ============================================================================
// Enums
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
 * Signal urgency classification.
 */
export enum BusSeverity {
  /** Immediate halt required */
  EMERGENCY = 'emergency',
  /** Immediate attention required */
  ALERT = 'alert',
  /** Potential issue detected */
  WARNING = 'warning',
  /** Normal operational event */
  INFO = 'info',
}

// ============================================================================
// Zod Schemas
// ============================================================================

export const governanceLayerSchema = z.nativeEnum(GovernanceLayer, {
  errorMap: () => ({ message: 'Invalid governance layer' }),
});

export const signalPrioritySchema = z.nativeEnum(SignalPriority, {
  errorMap: () => ({ message: 'Invalid signal priority' }),
});

export const busSeveritySchema = z.nativeEnum(BusSeverity, {
  errorMap: () => ({ message: 'Invalid bus severity' }),
});

/**
 * Trust Bus signal payload — the event data carried by the signal.
 */
export const trustBusPayloadSchema = z.object({
  /** What happened — human-readable event description */
  event: z.string().min(1).max(500),

  /** Trust score delta recommended by the emitting layer */
  recommendedDelta: z.number().min(-1000).max(1000).optional(),

  /** Trust tier at time of emission (T0-T7) */
  currentTier: z
    .enum(['T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'])
    .optional(),

  /** Current trust score at time of emission (0-1000) */
  currentScore: z.number().min(0).max(1000).optional(),

  /** Enforcement decision that triggered this signal */
  decision: z.enum(['allow', 'deny', 'escalate', 'degrade']).optional(),

  /** Layer-specific structured data */
  details: z.record(z.unknown()).optional(),
});

/**
 * Trust Bus signal — a cross-layer governance event.
 *
 * This is the atomic unit of the Trust Bus protocol. Each signal carries
 * a trust-relevant event from one governance layer to one or more others,
 * with cryptographic hash linkage to the proof chain.
 */
export const trustBusSignalSchema = z.object({
  // ── Identity ──
  /** Unique signal identifier (UUID v4) */
  signalId: z.string().uuid(),

  /** Groups related signals across layers for correlation */
  correlationId: z.string().uuid(),

  // ── Routing ──
  /** Which governance layer emitted this signal */
  sourceLayer: governanceLayerSchema,

  /** Target layers (empty array = broadcast to all) */
  targetLayers: z.array(governanceLayerSchema).default([]),

  /** Delivery priority — affects routing order and latency */
  priority: signalPrioritySchema.default(SignalPriority.NORMAL),

  // ── Payload ──
  /** Agent this signal concerns */
  agentId: z.string().min(1),

  /** Tenant/organization scope */
  tenantId: z.string().min(1),

  /** Signal type — reuses canonical SignalType enum */
  signalType: signalTypeSchema,

  /** Signal urgency classification */
  severity: busSeveritySchema.default(BusSeverity.INFO),

  /** Event payload with layer-specific data */
  payload: trustBusPayloadSchema,

  // ── Integrity ──
  /** When this signal was emitted (ISO 8601 UTC) */
  timestamp: z.string().datetime(),

  /** SHA-256 hash of the previous signal for this agent (chain linkage) */
  previousHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),

  /** SHA-256 hash of this signal's content */
  signalHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),

  // ── Context ──
  /** Additional contextual metadata */
  metadata: z.record(z.unknown()).optional(),

  /** Signal relevance window — expired signals are dropped (ISO 8601 UTC) */
  expiresAt: z.string().datetime().optional(),
});

/**
 * Schema for creating/emitting a Trust Bus signal.
 * Hash fields are computed by the emitter, not provided by the caller.
 */
export const emitTrustBusSignalSchema = z.object({
  correlationId: z.string().uuid().optional(),
  sourceLayer: governanceLayerSchema,
  targetLayers: z.array(governanceLayerSchema).default([]),
  priority: signalPrioritySchema.default(SignalPriority.NORMAL),
  agentId: z.string().min(1),
  tenantId: z.string().min(1),
  signalType: signalTypeSchema,
  severity: busSeveritySchema.default(BusSeverity.INFO),
  payload: trustBusPayloadSchema,
  metadata: z.record(z.unknown()).optional(),
  expiresAt: z.string().datetime().optional(),
});

/**
 * Bus subscription — defines what signals a consumer wants to receive.
 */
export const busSubscriptionSchema = z.object({
  /** Which layers to receive signals from */
  sourceLayers: z.array(governanceLayerSchema).min(1),

  /** Which signal types to receive (empty = all) */
  signalTypes: z.array(signalTypeSchema).optional(),

  /** Minimum severity to receive */
  minSeverity: busSeveritySchema.optional(),

  /** Minimum priority to receive */
  minPriority: signalPrioritySchema.optional(),

  /** Webhook URL for signal delivery */
  deliveryUrl: z.string().url(),

  /** Shared secret for webhook HMAC signature verification */
  signingSecret: z.string().min(32),
});

// ============================================================================
// Type Inference
// ============================================================================

/** Inferred TrustBusSignal type from Zod schema */
export type TrustBusSignal = z.infer<typeof trustBusSignalSchema>;

/** Inferred emit request type from Zod schema */
export type EmitTrustBusSignal = z.infer<typeof emitTrustBusSignalSchema>;

/** Inferred payload type from Zod schema */
export type TrustBusPayload = z.infer<typeof trustBusPayloadSchema>;

/** Inferred subscription type from Zod schema */
export type BusSubscription = z.infer<typeof busSubscriptionSchema>;
