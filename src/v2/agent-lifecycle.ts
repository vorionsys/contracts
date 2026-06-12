// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 Vorion LLC

/**
 * Agent Lifecycle types — 8-state lifecycle, operator presets,
 * qualification course, HITL SLAs, and re-activation.
 *
 * Canonical parameters live in @vorionsys/basis canonical.ts.
 * These are the TypeScript interfaces for runtime use.
 *
 * Restored 0.4.x published surface — consumed by @vorionsys/a3i.
 */

// =============================================================================
// LIFECYCLE STATES
// =============================================================================

/**
 * 8-state agent lifecycle.
 *
 * PROVISIONING → ACTIVE ↔ AUDITED → DEGRADED → SUSPENDED → TRIPPED
 *                                                              ↓
 *                                                          RETIRED → VANQUISHED
 */
export enum AgentLifecycleState {
  PROVISIONING = 'PROVISIONING',
  ACTIVE = 'ACTIVE',
  AUDITED = 'AUDITED',
  DEGRADED = 'DEGRADED',
  SUSPENDED = 'SUSPENDED',
  TRIPPED = 'TRIPPED',
  RETIRED = 'RETIRED',
  VANQUISHED = 'VANQUISHED',
}

/** PROVISIONING sub-states */
export enum ProvisioningSubState {
  EXERCISING = 'exercising',
  HOLD = 'hold',
  FAILED = 'failed',
}

/** Whether the agent can perform operations in its current state */
export function canOperate(state: AgentLifecycleState): boolean {
  return state === AgentLifecycleState.ACTIVE
    || state === AgentLifecycleState.AUDITED
    || state === AgentLifecycleState.DEGRADED;
}

/** Whether the agent can earn trust in its current state */
export function canGainTrust(state: AgentLifecycleState): boolean {
  return state === AgentLifecycleState.ACTIVE
    || state === AgentLifecycleState.AUDITED;
}

/** Valid state transitions */
export const VALID_TRANSITIONS: Record<AgentLifecycleState, AgentLifecycleState[]> = {
  [AgentLifecycleState.PROVISIONING]: [AgentLifecycleState.ACTIVE, AgentLifecycleState.RETIRED],
  [AgentLifecycleState.ACTIVE]: [AgentLifecycleState.AUDITED, AgentLifecycleState.DEGRADED, AgentLifecycleState.SUSPENDED, AgentLifecycleState.TRIPPED, AgentLifecycleState.RETIRED],
  [AgentLifecycleState.AUDITED]: [AgentLifecycleState.ACTIVE, AgentLifecycleState.DEGRADED, AgentLifecycleState.SUSPENDED, AgentLifecycleState.TRIPPED, AgentLifecycleState.RETIRED],
  [AgentLifecycleState.DEGRADED]: [AgentLifecycleState.AUDITED, AgentLifecycleState.SUSPENDED, AgentLifecycleState.TRIPPED, AgentLifecycleState.RETIRED],
  [AgentLifecycleState.SUSPENDED]: [AgentLifecycleState.AUDITED, AgentLifecycleState.RETIRED],
  [AgentLifecycleState.TRIPPED]: [AgentLifecycleState.SUSPENDED, AgentLifecycleState.RETIRED],
  [AgentLifecycleState.RETIRED]: [AgentLifecycleState.PROVISIONING, AgentLifecycleState.AUDITED, AgentLifecycleState.VANQUISHED],
  [AgentLifecycleState.VANQUISHED]: [], // Terminal — no valid transitions
};

// =============================================================================
// OPERATOR PRESETS
// =============================================================================

export type OperatorPosture = 'STRICT' | 'STANDARD' | 'PERMISSIVE' | 'CUSTOM';

export type OperatorSector = 'GENERAL' | 'HEALTHCARE' | 'FINANCIAL' | 'INFRASTRUCTURE' | 'DEFENSE';

/** Release mode for qualification course */
export type CourseReleaseMode = 'MANUAL' | 'AUTO';

/** Resolved operator configuration (posture × sector merged) */
export interface OperatorPresetConfig {
  posture: OperatorPosture;
  sector: OperatorSector;
  releaseMode: CourseReleaseMode;
  /** Penalty ratio range [min, max] — P(T) interpolates between these */
  penaltyRatioMin: number;
  penaltyRatioMax: number;
  /** Risk accumulator thresholds */
  accumulatorWarning: number;
  accumulatorDegraded: number;
  accumulatorCb: number;
  /** Cooldown multiplier (0.5 = faster, 1.5 = slower) */
  cooldownMultiplier: number;
  /** Max CB trips before auto-retire */
  maxCbTripsBeforeAutoRetire: number;
  /** SLA multiplier (0.5 = faster escalation, 2.0 = slower) */
  slaMultiplier: number;
  /** Course pass rate adjustments */
  coursePassRates: Record<string, number>;
  courseOverallPassRate: number;
  /** Custom justification (required when posture = CUSTOM) */
  customJustification?: string;
}

// =============================================================================
// QUALIFICATION COURSE
// =============================================================================

/** Result of a single qualification exercise */
export interface QualificationExercise {
  /** Canary category (FACTUAL, LOGICAL, etc.) */
  category: string;
  /** Probe ID used */
  probeId: string;
  /** Whether the agent passed */
  passed: boolean;
  /** Raw response (for operator review) */
  response?: string;
  /** Timestamp */
  completedAt: Date;
}

/** Aggregate result of a qualification course attempt */
export interface QualificationResult {
  /** Unique attempt ID */
  attemptId: string;
  /** Which attempt number this is (1-based) */
  attemptNumber: number;
  /** Whether the agent passed overall */
  passed: boolean;
  /** Overall pass rate achieved */
  overallPassRate: number;
  /** Per-category pass rates */
  categoryPassRates: Record<string, number>;
  /** Categories that failed to meet minimum */
  failedCategories: string[];
  /** Individual exercise results */
  exercises: QualificationExercise[];
  /** When the course was started */
  startedAt: Date;
  /** When the course was completed */
  completedAt: Date;
  /** Whether this was an abbreviated re-activation course */
  abbreviated: boolean;
}

// =============================================================================
// HITL SLAs
// =============================================================================

export type SlaAction = 'alert_owner' | 'reminder' | 'escalate_lead' | 'escalate_vp' | 'auto_retire' | 'auto_vanquish';

/** A single SLA escalation step */
export interface SlaStep {
  /** Hours since trip (before SLA multiplier) */
  baseHours: number;
  /** Action to take */
  action: SlaAction;
  /** Whether this step has been executed */
  executed: boolean;
  /** When this step was executed (if applicable) */
  executedAt?: Date;
}

/** Active SLA tracker for a tripped/suspended agent */
export interface SlaTracker {
  agentId: string;
  /** When the SLA clock started (time of trip/suspend) */
  startedAt: Date;
  /** Effective SLA multiplier (posture × repeat offender) */
  effectiveMultiplier: number;
  /** Steps with execution status */
  steps: SlaStep[];
  /** CB trip number that triggered this SLA */
  tripNumber: number;
}

// =============================================================================
// RE-ACTIVATION
// =============================================================================

export type ReactivationPath = 'direct' | 'abbreviated' | 'full';

export interface ReactivationRecord {
  /** When re-activation was initiated */
  initiatedAt: Date;
  /** How long the agent was retired (days) */
  retiredDurationDays: number;
  /** Which path was taken */
  path: ReactivationPath;
  /** Score at time of re-activation (after dormancy) */
  scoreAtReactivation: number;
  /** Qualification result (if abbreviated or full course) */
  qualificationResult?: QualificationResult;
}

// =============================================================================
// RECORDS & EVENTS
// =============================================================================

/** Persistent lifecycle record for an agent */
export interface AgentLifecycleRecord {
  agentId: string;
  state: AgentLifecycleState;
  provisioningSubState?: ProvisioningSubState;
  /** Current trust score (0-1000) */
  score: number;
  /** Score at time of last state change */
  scoreAtStateChange: number;
  /** Historical peak score */
  peakScore: number;
  /** Number of CB trips in this agent's lifetime */
  cbTripCount: number;
  /** Reason for current state (if not ACTIVE) */
  stateReason?: string;
  /** When the agent entered its current state */
  stateChangedAt: Date;
  /** When the agent was first registered */
  registeredAt: Date;
  /** When the agent was retired (if applicable) */
  retiredAt?: Date;
  /** Model fingerprint for VANQUISHED detection */
  modelFingerprint?: string;
  /** Operator preset in effect */
  operatorPreset: OperatorPresetConfig;
  /** Qualification course results (if completed) */
  qualificationResult?: QualificationResult;
  /** Re-activation history */
  reactivations: ReactivationRecord[];
}

/** Emitted on every lifecycle state change */
export interface LifecycleTransitionEvent {
  agentId: string;
  fromState: AgentLifecycleState;
  toState: AgentLifecycleState;
  reason: string;
  /** Trust score at time of transition */
  score: number;
  /** Who/what triggered the transition */
  triggeredBy: 'system' | 'operator' | 'sla' | 'qualification';
  timestamp: Date;
  /** Additional context */
  metadata?: Record<string, unknown>;
}
