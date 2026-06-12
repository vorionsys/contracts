// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 Vorion LLC

/**
 * @vorionsys/contracts
 *
 * Shared schemas, types, and validators for the Vorion Platform.
 *
 * @packageDocumentation
 */

// Re-export all v2 contracts
export * from './v2/index.js';

// Re-export validators
// export * from './validators/index.js';
export * from './canonical/agent.js';

// Re-export canonical validation utilities as namespace to avoid naming conflicts
export * as Canonical from './canonical/index.js';

// Physical capability taxonomy (restored 0.4.x published surface)
export * from './canonical/capabilities.js';

// Trust-bus and live-anchor wire enums — published consumers (@vorionsys/a3i)
// import these flat from the package root; explicit names to avoid collisions
export {
  GovernanceLayer,
  SignalPriority,
  BusSeverity,
  BusSignalType,
} from './canonical/trust-bus.js';
export {
  LayerHealth,
  AgentCircuitState,
} from './canonical/live-agent-anchor.js';

// Re-export database schemas
export * as db from './db/index.js';

// Re-export feature flags
export * from './flags.js';
