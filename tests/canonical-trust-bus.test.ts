// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 Vorion LLC

/**
 * Frozen-surface guard for the trust-bus wire enums.
 *
 * `BusSeverity` and `BusSignalType` member names AND string values are the
 * cross-layer wire contract shared with `@vorionsys/rainbow` and the
 * rainbow-interop harness. This suite must fail loudly if either drifts —
 * do not loosen these assertions to absorb a surface change; reconcile the
 * surface instead.
 *
 * It also pins the zero-dependency property of the leaf module: enum-only
 * consumers must be able to import `./canonical/trust-bus` without pulling
 * `zod` or `drizzle-orm` into their module graph.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

import {
  GovernanceLayer,
  SignalPriority,
  BusSeverity,
  BusSignalType,
} from '../src/canonical/trust-bus';

describe('canonical trust-bus frozen surface', () => {
  it('BusSeverity has exactly the five wire severities', () => {
    expect({ ...BusSeverity }).toEqual({
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical',
      EMERGENCY: 'emergency',
    });
  });

  it('BusSignalType has exactly the fifteen wire signal types', () => {
    expect({ ...BusSignalType }).toEqual({
      THREAT_DETECTED: 'threat_detected',
      ANOMALY: 'anomaly',
      DRIFT: 'drift',
      PROBE_DETECTED: 'probe_detected',
      ROTATION_TRIGGERED: 'rotation_triggered',
      POLICY_TIGHTENED: 'policy_tightened',
      TRUST_UPDATED: 'trust_updated',
      CANARY_PASSED: 'canary_passed',
      CANARY_FAILED: 'canary_failed',
      DORMANCY_DEDUCTION: 'dormancy_deduction',
      RISK_ACCUMULATOR_WARNING: 'risk_accumulator_warning',
      RISK_ACCUMULATOR_DEGRADED: 'risk_accumulator_degraded',
      CIRCUIT_BREAKER_TRIPPED: 'circuit_breaker_tripped',
      TREND_DETECTED: 'trend_detected',
      FLEET_ANOMALY: 'fleet_anomaly',
    });
  });

  it('retains the routing enums (GovernanceLayer, SignalPriority)', () => {
    expect({ ...GovernanceLayer }).toEqual({
      IDENTITY: 'identity',
      GOVERNANCE: 'governance',
      CONTAINMENT: 'containment',
      ORCHESTRATION: 'orchestration',
      OBSERVATION: 'observation',
    });
    expect({ ...SignalPriority }).toEqual({
      CRITICAL: 'critical',
      HIGH: 'high',
      NORMAL: 'normal',
      LOW: 'low',
    });
  });

  it('trust-bus stays a zero-dependency leaf (no imports in source)', () => {
    const source = readFileSync(
      fileURLToPath(new URL('../src/canonical/trust-bus.ts', import.meta.url)),
      'utf8',
    );
    // Any import/require would drag dependencies into enum-only consumers'
    // module graphs. Doc comments are stripped before matching so prose
    // mentioning the word "import" cannot false-positive.
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    expect(code).not.toMatch(/\bimport\b/);
    expect(code).not.toMatch(/\brequire\s*\(/);
    expect(code).not.toMatch(/\bexport\s+\*?\s*from\b/);
  });
});
