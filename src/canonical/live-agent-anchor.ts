// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 Vorion LLC

/**
 * @fileoverview Live Agent Anchor — real-time trust posture for a governed agent.
 *
 * The Live Agent Anchor is the mutable convergence point for all Trust Bus
 * signals. It represents the current trust state of an agent across every
 * governance layer, updated in real-time as signals propagate through the
 * Trust Bus.
 *
 * This is the "digital twin" of an agent's trust posture:
 *   - Trust Bus signals WRITE to the anchor (via delta application)
 *   - Enforcement decisions READ from the anchor (current trust context)
 *   - AgentAnchor dashboards SUBSCRIBE to anchor state changes
 *
 * Architecture:
 *   Trust Bus Signal → Bus Router → Live Agent Anchor (update) → Subscribers
 *
 * Patent relevance: CG-10 (Live Agent Anchor — real-time trust convergence).
 *
 * @see {@link trust-bus.ts} for signal schema
 * @see {@link trust-bus-protocol-v0.md} for protocol specification
 * @module @vorionsys/contracts/canonical/live-agent-anchor
 */

import { z } from 'zod';
import { governanceLayerSchema } from './trust-bus-schemas.js';

// ============================================================================
// Enums
// ============================================================================

/**
 * Per-layer governance health status.
 *
 * Each governance layer independently reports its health for this agent.
 * The anchor aggregates these into a composite view.
 */
export enum LayerHealth {
  /** Layer is operating normally for this agent */
  HEALTHY = 'healthy',
  /** Layer has detected warnings but is still functional */
  DEGRADED = 'degraded',
  /** Layer has active blocks or failures for this agent */
  IMPAIRED = 'impaired',
  /** Layer has no data for this agent (not yet evaluated) */
  UNKNOWN = 'unknown',
}

/**
 * Observation tier — how much internal visibility we have into the agent's model.
 *
 * Determines the trust ceiling: agents we can't inspect get lower max trust.
 *
 * @see packages/a3i/src/observation/tiers.ts for runtime implementation
 */
export enum ObservationTier {
  /** No internal access — API-only interaction */
  BLACK_BOX = 'black_box',
  /** Partial access — embeddings, attention weights */
  GRAY_BOX = 'gray_box',
  /** Full weight access — open-source model, self-hosted */
  WHITE_BOX = 'white_box',
  /** Hardware attestation — TEE-verified execution */
  ATTESTED = 'attested',
  /** Formally verified — mathematical proofs of behavior */
  VERIFIED = 'verified',
}

/**
 * Circuit breaker state for this agent.
 */
export enum AgentCircuitState {
  /** Normal operation */
  CLOSED = 'closed',
  /** Failures exceeded threshold — all requests blocked */
  OPEN = 'open',
  /** Cooling down — allowing probe requests */
  HALF_OPEN = 'half_open',
}

// ============================================================================
// Zod Schemas
// ============================================================================

export const layerHealthSchema = z.nativeEnum(LayerHealth, {
  errorMap: () => ({ message: 'Invalid layer health status' }),
});

export const observationTierSchema = z.nativeEnum(ObservationTier, {
  errorMap: () => ({ message: 'Invalid observation tier' }),
});

export const agentCircuitStateSchema = z.nativeEnum(AgentCircuitState, {
  errorMap: () => ({ message: 'Invalid circuit breaker state' }),
});

/**
 * Per-layer governance state snapshot.
 *
 * Each governance layer reports its current status for this agent.
 */
export const layerStateSchema = z.object({
  /** Which governance layer */
  layer: governanceLayerSchema,

  /** Current health of this layer for the agent */
  health: layerHealthSchema.default(LayerHealth.UNKNOWN),

  /** Last signal hash received from this layer */
  lastSignalHash: z
    .string()
    .regex(/^sha256:[a-f0-9]{64}$/)
    .optional(),

  /** When this layer last reported (ISO 8601 UTC) */
  lastReportedAt: z.string().datetime().optional(),

  /** Layer-specific status details */
  details: z.record(z.unknown()).optional(),
});

/**
 * Trust decay state — tracks inactivity-based trust erosion.
 *
 * The 182-day stepped decay with 50% floor is a core invariant.
 */
export const decayStateSchema = z.object({
  /** Days since last qualifying activity */
  daysInactive: z.number().min(0),

  /** Current decay factor (1.0 = no decay, 0.5 = floor) */
  decayFactor: z.number().min(0.5).max(1.0),

  /** Which decay milestone we're at (0-9) */
  currentMilestone: z.number().int().min(0).max(9),

  /** Score before decay was applied */
  preDecayScore: z.number().int().min(0).max(1000),

  /** When the agent was last active (ISO 8601 UTC) */
  lastActivityAt: z.string().datetime(),
});

/**
 * ParameSphere integrity state — model-interior trust evidence.
 *
 * ParameSphere provides trust evidence from INSIDE the model (behavioral
 * envelope analysis), not just from observing I/O behavior. This is the
 * "fifth force" beyond behavioral fingerprinting.
 *
 * Status: PROPOSED — No implementation yet. Target: H2 2026.
 * When implemented, this will feed into S_composite = S_behavioral × I(θ).
 */
export const parameSphereStateSchema = z.object({
  /** Whether ParameSphere analysis is available for this agent's model */
  available: z.boolean().default(false),

  /** Integrity multiplier I(θ) — multiplicative modifier on trust score */
  integrityMultiplier: z.number().min(0).max(1).optional(),

  /** Behavioral envelope hash of the model's behavioral patterns */
  envelopeHash: z.string().optional(),

  /** Whether the current fingerprint matches the registered baseline */
  baselineMatch: z.boolean().optional(),

  /** Cognitive envelope compliance — is the model within expected bounds? */
  envelopeCompliant: z.boolean().optional(),

  /** When the last ParameSphere analysis was performed (ISO 8601 UTC) */
  lastAnalyzedAt: z.string().datetime().optional(),
});

/**
 * Live Agent Anchor — the real-time trust posture of a governed agent.
 *
 * This is the convergence point for all Trust Bus signals. Every governance
 * layer writes to this anchor, and every enforcement decision reads from it.
 *
 * The anchor is the mutable state object. The proof chain is the immutable
 * audit trail. Together they provide real-time governance with cryptographic
 * accountability.
 *
 * Invariants:
 *   - trustScore is always in [0, 1000]
 *   - trustTier must match the score per TIER_THRESHOLDS
 *   - trustCeiling is determined by observationTier
 *   - layerStates has exactly one entry per active governance layer
 *   - signalHash links to the most recent Trust Bus signal
 */
export const liveAgentAnchorSchema = z.object({
  // ── Identity ──
  /** Agent identifier (matches Trust Bus agentId) */
  agentId: z.string().min(1),

  /** Tenant/organization scope */
  tenantId: z.string().min(1),

  /** CAR string — immutable agent classification identifier */
  carString: z
    .string()
    .regex(/^CAR-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/)
    .optional(),

  // ── Trust State ──
  /** Current trust score (0-1000) */
  trustScore: z.number().int().min(0).max(1000),

  /** Current trust tier (T0-T7) — must match score per TIER_THRESHOLDS */
  trustTier: z.enum(['T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']),

  /** Maximum trust score achievable given observation tier */
  trustCeiling: z.number().int().min(0).max(1000),

  /** How much visibility we have into the agent's model internals */
  observationTier: observationTierSchema.default(ObservationTier.BLACK_BOX),

  // ── Governance Layer States ──
  /** Per-layer governance health and status */
  layerStates: z.array(layerStateSchema).default([]),

  /** Composite governance health — worst-of across all layers */
  compositeHealth: layerHealthSchema.default(LayerHealth.UNKNOWN),

  // ── Circuit Breaker ──
  /** Agent-level circuit breaker state */
  circuitState: agentCircuitStateSchema.default(AgentCircuitState.CLOSED),

  /** Consecutive failure count (resets on success) */
  consecutiveFailures: z.number().int().min(0).default(0),

  /** When circuit breaker was last tripped (ISO 8601 UTC) */
  circuitTrippedAt: z.string().datetime().optional(),

  // ── Decay ──
  /** Trust decay tracking */
  decay: decayStateSchema.optional(),

  // ── ParameSphere ──
  /** Model-interior integrity state (future — H2 2026) */
  parameSphere: parameSphereStateSchema.optional(),

  // ── Signal Chain ──
  /** Hash of the most recent Trust Bus signal applied to this anchor */
  lastSignalHash: z
    .string()
    .regex(/^sha256:[a-f0-9]{64}$/)
    .optional(),

  /** Total signals received and applied */
  signalCount: z.number().int().min(0).default(0),

  // ── Timestamps ──
  /** When this anchor was created (ISO 8601 UTC) */
  createdAt: z.string().datetime(),

  /** When this anchor was last updated (ISO 8601 UTC) */
  updatedAt: z.string().datetime(),

  /** When the agent was last evaluated by enforcement (ISO 8601 UTC) */
  lastEnforcedAt: z.string().datetime().optional(),
});

/**
 * Schema for creating a new Live Agent Anchor (initial registration).
 * Omits computed fields that are set by the system.
 */
export const createLiveAgentAnchorSchema = z.object({
  agentId: z.string().min(1),
  tenantId: z.string().min(1),
  carString: z
    .string()
    .regex(/^CAR-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/)
    .optional(),
  trustScore: z.number().int().min(0).max(1000).default(250),
  trustTier: z.enum(['T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']).default('T1'),
  observationTier: observationTierSchema.default(ObservationTier.BLACK_BOX),
});

/**
 * Schema for anchor state change events (emitted on update).
 *
 * AgentAnchor dashboards subscribe to these for real-time display.
 */
export const anchorStateChangeSchema = z.object({
  /** The agent whose anchor changed */
  agentId: z.string().min(1),

  /** Tenant scope */
  tenantId: z.string().min(1),

  /** What field(s) changed */
  changedFields: z.array(z.string()).min(1),

  /** Previous trust score (if trust changed) */
  previousScore: z.number().int().min(0).max(1000).optional(),

  /** New trust score (if trust changed) */
  newScore: z.number().int().min(0).max(1000).optional(),

  /** Previous tier (if tier changed) */
  previousTier: z
    .enum(['T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'])
    .optional(),

  /** New tier (if tier changed) */
  newTier: z
    .enum(['T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'])
    .optional(),

  /** The signal that triggered this change */
  triggerSignalId: z.string().uuid().optional(),

  /** When this change occurred (ISO 8601 UTC) */
  timestamp: z.string().datetime(),
});

// ============================================================================
// Type Inference
// ============================================================================

/** Real-time trust posture of a governed agent */
export type LiveAgentAnchor = z.infer<typeof liveAgentAnchorSchema>;

/** Input for creating a new agent anchor */
export type CreateLiveAgentAnchor = z.infer<typeof createLiveAgentAnchorSchema>;

/** Per-layer governance state */
export type LayerState = z.infer<typeof layerStateSchema>;

/** Trust decay tracking state */
export type DecayState = z.infer<typeof decayStateSchema>;

/** ParameSphere integrity state */
export type ParameSphereState = z.infer<typeof parameSphereStateSchema>;

/** Anchor state change event */
export type AnchorStateChange = z.infer<typeof anchorStateChangeSchema>;
