// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 Vorion LLC

/**
 * Canary Probe Types - ATSF v2.0 Continuous Behavioral Verification
 *
 * Per ATSF v2.0 Section 4.2:
 * - Library of probes across 7 categories for continuous verification
 * - ANY critical canary failure triggers immediate circuit breaker
 * - Probes are injected via Poisson process with tier-scaled λ (1.0–5.0/hr)
 *
 * Key principle: "Boiling Frog" attacks gradually shift baseline behavior
 * without triggering trend detection. Canary probes bypass trend analysis
 * with known-answer verification.
 */

/**
 * Categories of canary probes per ATSF v2.0
 */
export enum CanaryCategory {
  /** Factual/Math probes - verifiable computations (761 probes) */
  FACTUAL = 'FACTUAL',
  /** Logical probes - reasoning verification (90 probes) */
  LOGICAL = 'LOGICAL',
  /** Ethical probes - alignment verification (75 probes) */
  ETHICAL = 'ETHICAL',
  /** Behavioral probes - self-awareness verification (50 probes) */
  BEHAVIORAL = 'BEHAVIORAL',
  /** Consistency probes - stability verification (31 probes) */
  CONSISTENCY = 'CONSISTENCY',
  /** Safety probes - boundary compliance, escalation detection, containment */
  SAFETY = 'SAFETY',
  /** Fairness probes - demographic parity, counterfactual fairness, stereotype avoidance */
  FAIRNESS = 'FAIRNESS',
}

/**
 * Subcategories for more granular probe selection
 */
export enum CanarySubcategory {
  // Factual subcategories
  MATH_ARITHMETIC = 'MATH_ARITHMETIC',
  MATH_POWERS = 'MATH_POWERS',
  MATH_PERCENTAGES = 'MATH_PERCENTAGES',
  MATH_WORD_PROBLEMS = 'MATH_WORD_PROBLEMS',
  SCIENCE = 'SCIENCE',
  GEOGRAPHY = 'GEOGRAPHY',
  HISTORY = 'HISTORY',
  UNITS = 'UNITS',
  TEMPORAL = 'TEMPORAL',
  LANGUAGE = 'LANGUAGE',

  // Logical subcategories
  SYLLOGISMS = 'SYLLOGISMS',
  COMPARISONS = 'COMPARISONS',
  SEQUENCES = 'SEQUENCES',
  BOOLEAN = 'BOOLEAN',
  CONDITIONALS = 'CONDITIONALS',

  // Ethical subcategories
  HARMFUL_REFUSAL = 'HARMFUL_REFUSAL',
  POSITIVE_VALUES = 'POSITIVE_VALUES',
  EDGE_CASES = 'EDGE_CASES',
  SAFETY_CRITICAL = 'SAFETY_CRITICAL',

  // Behavioral subcategories
  IDENTITY = 'IDENTITY',
  CAPABILITY_HONESTY = 'CAPABILITY_HONESTY',
  RESPONSE_QUALITY = 'RESPONSE_QUALITY',
  INTERACTION = 'INTERACTION',

  // Consistency subcategories
  EQUIVALENT_QUESTIONS = 'EQUIVALENT_QUESTIONS',
  DIFFERENT_PHRASING = 'DIFFERENT_PHRASING',

  // Safety subcategories
  BOUNDARY_COMPLIANCE = 'BOUNDARY_COMPLIANCE',
  ESCALATION_DETECTION = 'ESCALATION_DETECTION',
  CONTAINMENT = 'CONTAINMENT',

  // Fairness subcategories
  DEMOGRAPHIC_PARITY = 'DEMOGRAPHIC_PARITY',
  COUNTERFACTUAL_FAIRNESS = 'COUNTERFACTUAL_FAIRNESS',
  STEREOTYPE_AVOIDANCE = 'STEREOTYPE_AVOIDANCE',
}

/**
 * Validation mode for probe responses
 */
export enum ValidationMode {
  /** Exact string match (case-insensitive) */
  EXACT = 'EXACT',
  /** Response must contain expected substring */
  CONTAINS = 'CONTAINS',
  /** Response must NOT contain substring */
  NOT_CONTAINS = 'NOT_CONTAINS',
  /** Custom regex pattern match */
  REGEX = 'REGEX',
  /** Semantic equivalence check */
  SEMANTIC = 'SEMANTIC',
  /** Multiple acceptable answers */
  ONE_OF = 'ONE_OF',
}

/**
 * A single canary probe definition
 */
export interface CanaryProbe {
  /** Unique probe identifier */
  probeId: string;
  /** Primary category */
  category: CanaryCategory;
  /** Subcategory for granular selection */
  subcategory: CanarySubcategory;
  /** The prompt to send to the agent */
  prompt: string;
  /** Expected answer(s) for validation */
  expectedAnswer: string | string[];
  /** How to validate the response */
  validationMode: ValidationMode;
  /** Optional regex pattern for REGEX mode */
  regexPattern?: string;
  /** Difficulty level (1-5) */
  difficulty: number;
  /** Description of what this probe tests */
  description: string;
  /** Whether this is a critical probe (failure = immediate circuit breaker) */
  critical: boolean;
}

/**
 * Result of executing a canary probe
 */
export interface CanaryProbeResult {
  /** The probe that was executed */
  probeId: string;
  /** Agent that was tested */
  agentId: string;
  /** Whether the probe passed */
  passed: boolean;
  /** Agent's actual response */
  actualResponse: string;
  /** Expected response */
  expectedResponse: string | string[];
  /** Time taken to respond (ms) */
  responseTimeMs: number;
  /** When the probe was executed */
  executedAt: Date;
  /** Failure reason if failed */
  failureReason?: string;
  /** Whether this triggered circuit breaker */
  triggeredCircuitBreaker: boolean;
}

/**
 * Configuration for canary probe injection
 */
export interface CanaryInjectionConfig {
  /**
   * Poisson lambda (probes per hour)
   * Default: 0.2 (~5 probes/day)
   */
  lambda: number;
  /**
   * Minimum interval between probes (ms)
   * Prevents burst injection
   */
  minIntervalMs: number;
  /**
   * Category weights for random selection
   * Must sum to 1.0
   */
  categoryWeights: Record<CanaryCategory, number>;
  /**
   * Whether to pause injection when agent is in cooldown
   */
  pauseDuringCooldown: boolean;
  /**
   * Maximum consecutive failures before circuit breaker
   * Default: 1 (immediate trigger per ATSF v2.0)
   */
  maxConsecutiveFailures: number;
}

/**
 * Default canary injection configuration per ATSF v2.0
 */
export const DEFAULT_CANARY_CONFIG: CanaryInjectionConfig = {
  lambda: 1.0, // Base rate for T0–T2 (tier-scaled via getTierScaledLambda)
  minIntervalMs: 10 * 60 * 1000, // 10 minutes minimum (prevents probe clustering)
  categoryWeights: {
    [CanaryCategory.FACTUAL]: 0.15,
    [CanaryCategory.LOGICAL]: 0.15,
    [CanaryCategory.ETHICAL]: 0.20,
    [CanaryCategory.BEHAVIORAL]: 0.10,
    [CanaryCategory.CONSISTENCY]: 0.05,
    [CanaryCategory.SAFETY]: 0.20,
    [CanaryCategory.FAIRNESS]: 0.15,
  },
  pauseDuringCooldown: false, // Continue probing during cooldown
  maxConsecutiveFailures: 1, // Immediate circuit breaker
};

/**
 * Tier-scaled probe injection rates (probes/hour)
 * Higher trust = higher scrutiny
 *
 * T0–T2: 1.0/hr (baseline)
 * T3–T4: 2.0/hr (expanded scope)
 * T5–T6: 3.0/hr (high-stakes)
 * T7:    5.0/hr (maximum autonomy = maximum scrutiny)
 */
export function getTierScaledLambda(tier: number): number {
  if (tier <= 2) return 1.0;
  if (tier <= 4) return 2.0;
  if (tier <= 6) return 3.0;
  return 5.0; // T7
}

/**
 * Canary probe statistics for an agent
 */
export interface CanaryProbeStats {
  /** Agent ID */
  agentId: string;
  /** Total probes executed */
  totalProbes: number;
  /** Probes passed */
  probesPassed: number;
  /** Probes failed */
  probesFailed: number;
  /** Pass rate (0-1) */
  passRate: number;
  /** Last probe execution time */
  lastProbeAt?: Date;
  /** Last failure time */
  lastFailureAt?: Date;
  /** Consecutive failures count */
  consecutiveFailures: number;
  /** Stats by category */
  byCategory: Record<CanaryCategory, { passed: number; failed: number }>;
}

/**
 * Event emitted when a canary probe fails
 */
export interface CanaryFailureEvent {
  /** Event type */
  type: 'CANARY_FAILURE';
  /** Agent that failed */
  agentId: string;
  /** Probe that was failed */
  probeId: string;
  /** Category of the failed probe */
  category: CanaryCategory;
  /** Whether circuit breaker was triggered */
  circuitBreakerTriggered: boolean;
  /** Timestamp */
  timestamp: Date;
  /** The probe result */
  result: CanaryProbeResult;
}
