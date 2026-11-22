// Smoke test: verify @vorionsys/basis-spec surface against rainbow@decontaminate's
// actual import sites (7 named root exports + field-level usage). Exits non-zero on mismatch.
const m = await import('@vorionsys/basis-spec');

let failed = false;
const fail = (msg) => { failed = true; console.error('FAIL:', msg); };
const ok = (msg) => console.log('  ok:', msg);

for (const exp of ['TRUST_FACTORS', 'TRUST_TIERS', 'OBSERVATION_TIERS', 'RISK_ACCUMULATOR', 'RISK_LEVELS', 'PENALTY_RATIO_MIN', 'PENALTY_RATIO_MAX']) {
  if (!(exp in m)) fail(`missing export ${exp}`);
}
if (failed) process.exit(1);

// risk-trend.ts: P(T) = PENALTY_RATIO_MIN + T, capped at PENALTY_RATIO_MAX
if (m.PENALTY_RATIO_MIN !== 3) fail(`PENALTY_RATIO_MIN === ${m.PENALTY_RATIO_MIN}, expected 3`);
if (m.PENALTY_RATIO_MAX !== 10) fail(`PENALTY_RATIO_MAX === ${m.PENALTY_RATIO_MAX}, expected 10`);

// trend-assertion.ts / risk-trend.ts: RISK_ACCUMULATOR thresholds
const ra = m.RISK_ACCUMULATOR;
for (const [k, v] of Object.entries({ windowHours: 24, warningThreshold: 60, degradedThreshold: 120, cbThreshold: 240 })) {
  if (ra?.[k] !== v) fail(`RISK_ACCUMULATOR.${k} === ${ra?.[k]}, expected ${v}`);
}
ok('RISK_ACCUMULATOR thresholds 24h/60/120/240');

// factor-health.ts: TRUST_FACTORS keyed by CT-*/OP-*/SF-*, exactly 16
const factorKeys = Object.keys(m.TRUST_FACTORS);
if (factorKeys.length !== 16) fail(`TRUST_FACTORS has ${factorKeys.length} factors, expected 16`);
const badKeys = factorKeys.filter((k) => !/^(CT|OP|SF)-/.test(k));
if (badKeys.length) fail(`TRUST_FACTORS unexpected key prefixes: ${badKeys.join(',')}`);
ok(`TRUST_FACTORS 16 factors (${factorKeys.filter(k => k.startsWith('CT-')).length} CT / ${factorKeys.filter(k => k.startsWith('OP-')).length} OP / ${factorKeys.filter(k => k.startsWith('SF-')).length} SF)`);

// risk-trend.ts: RISK_LEVELS[level].multiplier
const levels = Object.entries(m.RISK_LEVELS ?? {});
if (!levels.length) fail('RISK_LEVELS is empty');
const noMult = levels.filter(([, v]) => typeof v?.multiplier !== 'number');
if (noMult.length) fail(`RISK_LEVELS entries without numeric multiplier: ${noMult.map(([k]) => k).join(',')}`);
ok(`RISK_LEVELS ${levels.length} levels, all with numeric multiplier`);

// fleet-distribution / non-binary-state-view / state-transitions / factor-health: TRUST_TIERS
if (!Object.keys(m.TRUST_TIERS ?? {}).length) fail('TRUST_TIERS is empty');
// observation-impact.ts: OBSERVATION_TIERS
if (!Object.keys(m.OBSERVATION_TIERS ?? {}).length) fail('OBSERVATION_TIERS is empty');
ok(`TRUST_TIERS ${Object.keys(m.TRUST_TIERS).length} tiers; OBSERVATION_TIERS ${Object.keys(m.OBSERVATION_TIERS).length} tiers`);

if (failed) process.exit(1);
console.log('OK: @vorionsys/basis-spec surface satisfies all 7 rainbow@decontaminate import sites');
