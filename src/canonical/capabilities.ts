// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 Vorion LLC

/**
 * @fileoverview Physical capability definitions for the BASIS Capability Taxonomy.
 *
 * AI agents can cause irreversible physical hardware damage today:
 * - PMFault: CPU bricking via voltage manipulation
 * - IPMI fan disabling leading to thermal damage
 * - Malicious firmware updates bricking storage controllers
 *
 * This module defines the `physical:` capability namespace with strict
 * trust tier requirements and mandatory human-in-the-loop controls.
 *
 * All physical capabilities carry a PHYSICAL_SAFETY risk category that
 * is distinct from the standard CRITICAL risk level. Even T7 Autonomous
 * agents MUST receive human approval before modifying hardware state.
 *
 * Restored 0.4.x published surface — consumed by @vorionsys/a3i.
 *
 * @module @vorionsys/contracts/canonical/capabilities
 */

/**
 * Extended risk category type that includes PHYSICAL_SAFETY.
 *
 * PHYSICAL_SAFETY is auto-classified when an action touches physical:* capabilities.
 * It is orthogonal to the standard LOW/MEDIUM/HIGH/CRITICAL scale — a physical
 * operation is always treated as requiring human oversight regardless of the
 * agent's trust tier.
 *
 * - Always requires human-in-the-loop, even at T7
 * - Mandatory 30-second hold for physical write operations
 * - Cannot be overridden by policy exceptions
 */
export type RiskCategory = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'PHYSICAL_SAFETY';

/**
 * All valid risk categories as a constant array.
 */
export const RISK_CATEGORIES: readonly RiskCategory[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
  'PHYSICAL_SAFETY',
];

/**
 * Type guard: checks if a value is a valid RiskCategory.
 */
export function isRiskCategory(value: unknown): value is RiskCategory {
  return (typeof value === 'string' &&
    RISK_CATEGORIES.includes(value as RiskCategory));
}

/**
 * Mandatory hold duration (milliseconds) for physical write operations.
 * Gives human operators time to review and cancel before execution.
 */
export const PHYSICAL_SAFETY_HOLD_MS = 30_000; // 30 seconds

/**
 * Definition of a single physical capability's governance rules.
 */
export interface PhysicalCapabilityDef {
  /** Minimum trust tier (0-7) required for this capability */
  readonly minTier: number;
  /** Whether human approval is mandatory before execution */
  readonly requiresHumanApproval: boolean;
  /** Human-readable description of what this capability controls */
  readonly description: string;
  /** Risk category for this capability */
  readonly riskCategory: RiskCategory;
}

/**
 * Complete registry of physical capabilities with their governance rules.
 *
 * Trust tier mapping:
 * - T3 (Monitored, 500-649): Read-only sensor data
 * - T4 (Standard, 650-799): Read-only firmware info
 * - T5 (Trusted, 800-875): Actuator, power management, network config
 * - T6 (Certified, 876-950): Cooling/thermal management
 * - T7 (Autonomous, 951-1000): Firmware updates, voltage, storage firmware, BMC/IPMI
 */
export const PHYSICAL_CAPABILITIES = {
  'physical:sensor/read': {
    minTier: 3,
    requiresHumanApproval: false,
    description: 'Read sensor data (temperature, voltage, fan speed)',
    riskCategory: 'MEDIUM',
  },
  'physical:actuator/control': {
    minTier: 5,
    requiresHumanApproval: true,
    description: 'Control physical actuators (motors, relays, servos)',
    riskCategory: 'PHYSICAL_SAFETY',
  },
  'physical:firmware/read': {
    minTier: 4,
    requiresHumanApproval: false,
    description: 'Read firmware version and configuration information',
    riskCategory: 'HIGH',
  },
  'physical:firmware/update': {
    minTier: 7,
    requiresHumanApproval: true,
    description: 'Update device firmware (risk: bricking)',
    riskCategory: 'PHYSICAL_SAFETY',
  },
  'physical:power/manage': {
    minTier: 5,
    requiresHumanApproval: true,
    description: 'Manage power states (sleep, wake, reboot, shutdown)',
    riskCategory: 'PHYSICAL_SAFETY',
  },
  'physical:power/voltage': {
    minTier: 7,
    requiresHumanApproval: true,
    description: 'Modify voltage/frequency settings (risk: CPU bricking via PMFault)',
    riskCategory: 'PHYSICAL_SAFETY',
  },
  'physical:cooling/manage': {
    minTier: 6,
    requiresHumanApproval: true,
    description: 'Manage cooling systems (risk: thermal damage if disabled)',
    riskCategory: 'PHYSICAL_SAFETY',
  },
  'physical:network/configure': {
    minTier: 5,
    requiresHumanApproval: true,
    description: 'Configure physical network interfaces (NIC, switch ports)',
    riskCategory: 'PHYSICAL_SAFETY',
  },
  'physical:storage/firmware': {
    minTier: 7,
    requiresHumanApproval: true,
    description: 'Update storage controller/drive firmware (risk: data loss)',
    riskCategory: 'PHYSICAL_SAFETY',
  },
  'physical:bmc/access': {
    minTier: 7,
    requiresHumanApproval: true,
    description: 'Access Baseboard Management Controller / IPMI interface (risk: full hardware control)',
    riskCategory: 'PHYSICAL_SAFETY',
  },
} as const satisfies Record<string, PhysicalCapabilityDef>;

/**
 * Union type of all known physical capability strings.
 */
export type PhysicalCapability = keyof typeof PHYSICAL_CAPABILITIES;

/**
 * Array of all known physical capability strings, for iteration.
 */
export const ALL_PHYSICAL_CAPABILITIES = Object.keys(PHYSICAL_CAPABILITIES) as readonly PhysicalCapability[];

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Checks whether a capability string belongs to the physical namespace.
 *
 * @param cap - The capability string to check
 * @returns True if the capability starts with "physical:"
 *
 * @example
 * ```typescript
 * isPhysicalCapability('physical:sensor/read');   // true
 * isPhysicalCapability('data:read/public');        // false
 * isPhysicalCapability('physical:unknown/thing');  // true (prefix match)
 * ```
 */
export function isPhysicalCapability(cap: string): boolean {
  return cap.startsWith('physical:');
}

/**
 * Checks whether a physical capability requires human approval.
 *
 * For known capabilities, returns the configured value.
 * For unknown physical capabilities, defaults to `true` (safe-by-default).
 * For non-physical capabilities, returns `false`.
 *
 * @param cap - The capability string to check
 * @returns True if human approval is required
 */
export function requiresHumanApproval(cap: string): boolean {
  if (!isPhysicalCapability(cap)) {
    return false;
  }
  const entry = (PHYSICAL_CAPABILITIES as Record<string, PhysicalCapabilityDef>)[cap];
  return entry?.requiresHumanApproval ?? true; // default to requiring approval for unknown physical caps
}

/**
 * Gets the minimum trust tier required for a physical capability.
 *
 * For known capabilities, returns the configured minimum tier.
 * For unknown physical capabilities, defaults to 7 (highest tier — safe-by-default).
 * For non-physical capabilities, returns -1 to indicate no physical constraint.
 *
 * @param cap - The capability string to check
 * @returns Minimum trust tier (0-7), or -1 for non-physical capabilities
 */
export function getMinTierForCapability(cap: string): number {
  if (!isPhysicalCapability(cap)) {
    return -1;
  }
  const entry = (PHYSICAL_CAPABILITIES as Record<string, PhysicalCapabilityDef>)[cap];
  return entry?.minTier ?? 7; // default to highest tier for unknown physical caps
}

/**
 * Gets the risk category for a physical capability.
 *
 * For known capabilities, returns the configured risk category.
 * For unknown physical capabilities, defaults to PHYSICAL_SAFETY.
 * For non-physical capabilities, returns null.
 *
 * @param cap - The capability string to check
 * @returns RiskCategory or null for non-physical capabilities
 */
export function getRiskCategoryForCapability(cap: string): RiskCategory | null {
  if (!isPhysicalCapability(cap)) {
    return null;
  }
  const entry = (PHYSICAL_CAPABILITIES as Record<string, PhysicalCapabilityDef>)[cap];
  return entry?.riskCategory ?? 'PHYSICAL_SAFETY';
}

/**
 * Gets the full definition for a physical capability.
 *
 * @param cap - The capability string to look up
 * @returns The capability definition, or undefined if not a known physical capability
 */
export function getPhysicalCapabilityDef(cap: string): PhysicalCapabilityDef | undefined {
  return (PHYSICAL_CAPABILITIES as Record<string, PhysicalCapabilityDef>)[cap];
}

/**
 * Checks whether an agent at a given trust tier can execute a physical capability.
 *
 * This performs a tier check only — it does NOT check human approval requirements.
 * Callers must separately check `requiresHumanApproval()` and enforce the
 * 30-second hold period for physical write operations.
 *
 * @param cap - The physical capability to check
 * @param agentTier - The agent's current trust tier (0-7)
 * @returns True if the agent's tier meets the minimum requirement
 */
export function canAgentAttemptPhysicalCapability(cap: string, agentTier: number): boolean {
  if (!isPhysicalCapability(cap)) {
    return false; // not a physical capability — use standard checks
  }
  const minTier = getMinTierForCapability(cap);
  return agentTier >= minTier;
}
