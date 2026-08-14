// Smoke test: verify @vorionsys/contracts/canonical/trust-bus surface from an
// installed copy (packed tarball or live registry). Exits non-zero on mismatch.
const m = await import('@vorionsys/contracts/canonical/trust-bus');

const expect = {
  BusSeverity: { LOW: 'low', MEDIUM: 'medium', HIGH: 'high', CRITICAL: 'critical', EMERGENCY: 'emergency' },
  BusSignalType: {
    THREAT_DETECTED: 'threat_detected', ANOMALY: 'anomaly', DRIFT: 'drift',
    PROBE_DETECTED: 'probe_detected', ROTATION_TRIGGERED: 'rotation_triggered',
    POLICY_TIGHTENED: 'policy_tightened', TRUST_UPDATED: 'trust_updated',
    CANARY_PASSED: 'canary_passed', CANARY_FAILED: 'canary_failed',
    DORMANCY_DEDUCTION: 'dormancy_deduction',
    RISK_ACCUMULATOR_WARNING: 'risk_accumulator_warning',
    RISK_ACCUMULATOR_DEGRADED: 'risk_accumulator_degraded',
    CIRCUIT_BREAKER_TRIPPED: 'circuit_breaker_tripped',
    TREND_DETECTED: 'trend_detected', FLEET_ANOMALY: 'fleet_anomaly',
  },
};

let failed = false;
const fail = (msg) => { failed = true; console.error('FAIL:', msg); };

for (const exp of ['GovernanceLayer', 'SignalPriority', 'BusSeverity', 'BusSignalType']) {
  if (!(exp in m)) fail(`missing export ${exp}`);
}

for (const [enumName, members] of Object.entries(expect)) {
  const actual = m[enumName] ?? {};
  // TS string enums have no reverse mappings: keys are exactly the member names.
  const actualKeys = Object.keys(actual).sort();
  const expectedKeys = Object.keys(members).sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    fail(`${enumName} member set mismatch.\n  expected: ${expectedKeys.join(',')}\n  actual:   ${actualKeys.join(',')}`);
  }
  for (const [k, v] of Object.entries(members)) {
    if (actual[k] !== v) fail(`${enumName}.${k} === ${JSON.stringify(actual[k])}, expected ${JSON.stringify(v)}`);
  }
}

console.log('exports:', Object.keys(m).join(', '));
if (failed) process.exit(1);
console.log('OK: trust-bus surface matches frozen spec (BusSeverity 5, BusSignalType 15, wire strings exact)');
