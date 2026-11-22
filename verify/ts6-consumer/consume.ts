// TS6 consumer typecheck: proves @vorionsys/contracts' emitted dist/.d.ts are
// consumable by a TypeScript 6 project (the actual meaning of the widened peer).
import { BusSeverity, BusSignalType, GovernanceLayer, SignalPriority } from '@vorionsys/contracts/canonical/trust-bus';

// Use the enums at the type level and value level the way rainbow does.
const sev: BusSeverity = BusSeverity.CRITICAL;
const sig: BusSignalType = BusSignalType.CIRCUIT_BREAKER_TRIPPED;
const layer: GovernanceLayer = GovernanceLayer.GOVERNANCE;
const prio: SignalPriority = SignalPriority.HIGH;

// Exhaustiveness: a switch over the enum must compile under TS6.
function describe(s: BusSeverity): string {
  switch (s) {
    case BusSeverity.LOW: return 'low';
    case BusSeverity.MEDIUM: return 'medium';
    case BusSeverity.HIGH: return 'high';
    case BusSeverity.CRITICAL: return 'critical';
    case BusSeverity.EMERGENCY: return 'emergency';
  }
}

export const _check = { sev, sig, layer, prio, d: describe(sev) };
