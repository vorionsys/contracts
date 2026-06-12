// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 Vorion LLC

/**
 * Published-consumer compatibility surface — @vorionsys/a3i@0.4.2.
 *
 * The published a3i package imports these 38 names AT RUNTIME from
 * '@vorionsys/contracts'. ESM throws `SyntaxError: ... does not provide an
 * export named 'X'` at import time if ANY of them is missing — which is
 * exactly what broke every fresh `npm install` of the SDK ensemble between
 * contracts@1.0.0 (2026-04-21) and this fix.
 *
 * Do not remove names from this list to absorb a surface change; either
 * keep the export or coordinate a republish of every consumer first.
 */

import { describe, expect, it } from 'vitest';
import * as contracts from '../src/index.js';

/** Runtime names imported by a3i@0.4.2 dist (extracted from its .js files). */
const A3I_RUNTIME_IMPORTS = [
  'ActionType',
  'AgentCircuitState',
  'AgentLifecycleState',
  'ApprovalType',
  'BusSeverity',
  'BusSignalType',
  'CanaryCategory',
  'CanarySubcategory',
  'DEFAULT_BAND_THRESHOLDS',
  'DEFAULT_BANDING_CONFIG',
  'DEFAULT_CANARY_CONFIG',
  'DEFAULT_DEGRADATION_CONFIG',
  'DEFAULT_GATE_CONFIG',
  'DEFAULT_TRUST_DYNAMICS',
  'DataSensitivity',
  'DegradationLevel',
  'DenialReason',
  'EVIDENCE_TYPE_MULTIPLIERS',
  'FREEZE_DURATION_BY_LEVEL',
  'GateStatus',
  'GovernanceLayer',
  'LayerHealth',
  'OBSERVATION_CEILINGS',
  'ObservationTier',
  'ProvisioningSubState',
  'RISK_MULTIPLIERS',
  'Reversibility',
  'RiskLevel',
  'SignalPriority',
  'TRUST_THRESHOLDS',
  'TrustBand',
  'VALID_TRANSITIONS',
  'ValidationMode',
  'canOperate',
  'getMinTierForCapability',
  'getTierScaledLambda',
  'isPhysicalCapability',
  'requiresHumanApproval',
] as const;

describe('a3i@0.4.2 published-consumer compatibility surface', () => {
  it.each(A3I_RUNTIME_IMPORTS)('exports %s', (name) => {
    expect(
      contracts[name as keyof typeof contracts],
      `'${name}' must be a defined runtime export of @vorionsys/contracts — ` +
      `published a3i@0.4.2 imports it and ESM fails the whole module graph if absent`,
    ).toBeDefined();
  });

  it('covers all 38 runtime imports', () => {
    expect(A3I_RUNTIME_IMPORTS).toHaveLength(38);
  });
});
