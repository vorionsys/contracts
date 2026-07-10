// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 Vorion LLC

/**
 * BASIS decision-record schema (src/basis/) — shape, invariants, and the
 * chain/keys file envelopes. Crypto checks (signature, hash link) live in
 * @vorionsys/verify; these tests pin the wire format only.
 */
import { describe, expect, it } from 'vitest';
import {
  CREDENTIAL_STATUSES,
  DECISIONS,
  DecisionRecordSchema,
  DottedPath,
  parseChainFile,
  parseKeysFile,
  REASON_CODES,
  Rfc3339UtcMs,
  Sha256Ref,
  toSignable,
  Ulid,
  type DecisionRecord,
} from '../src/basis/index.js';

const SHA = 'sha256:' + 'a'.repeat(64);
const ULID = '01JZ4M9Q7R8S6T5V4W3X2Y1Z0A';

const record: DecisionRecord = {
  v: '1',
  id: ULID,
  ts: '2026-07-02T14:03:22.481Z',
  agent: {
    id: 'agt_qclose_01',
    tier: 2,
    credential: { id: 'cred_9f3a', status: 'active', expiresAt: '2026-07-02T14:05:00.000Z' },
  },
  action: { domain: 'finance.payments', capability: 'payments.execute', paramsHash: SHA },
  policy: { id: 'pol_qclose', version: '1.0.0', hash: SHA },
  verdict: { decision: 'escalate', reason: 'TIER_CAP_EXCEEDED', latencyMs: 4, linksTo: null },
  prev: 'GENESIS',
  sig: { alg: 'ed25519', kid: 'vorion-demo-2026-07', value: 'aGVsbG8=' },
};

describe('primitives', () => {
  it('accepts canonical forms', () => {
    expect(Ulid.safeParse(ULID).success).toBe(true);
    expect(Sha256Ref.safeParse(SHA).success).toBe(true);
    expect(Rfc3339UtcMs.safeParse('2026-07-02T14:03:22.481Z').success).toBe(true);
    expect(DottedPath.safeParse('finance.ledger').success).toBe(true);
  });

  it('rejects near-misses', () => {
    expect(Ulid.safeParse(ULID.toLowerCase()).success).toBe(false);
    expect(Ulid.safeParse(ULID.slice(0, 25)).success).toBe(false);
    expect(Sha256Ref.safeParse('sha256:' + 'A'.repeat(64)).success).toBe(false); // uppercase hex
    expect(Sha256Ref.safeParse('sha512:' + 'a'.repeat(64)).success).toBe(false);
    expect(Rfc3339UtcMs.safeParse('2026-07-02T14:03:22Z').success).toBe(false); // no ms
    expect(Rfc3339UtcMs.safeParse('2026-07-02T14:03:22.481+02:00').success).toBe(false); // not UTC
    expect(DottedPath.safeParse('finance').success).toBe(false); // single segment
    expect(DottedPath.safeParse('Finance.Ledger').success).toBe(false);
  });
});

describe('DecisionRecordSchema', () => {
  it('parses a canonical record', () => {
    expect(DecisionRecordSchema.parse(record)).toEqual(record);
  });

  it('is strict — unknown fields are rejected at every level', () => {
    expect(DecisionRecordSchema.safeParse({ ...record, extra: 1 }).success).toBe(false);
    expect(
      DecisionRecordSchema.safeParse({ ...record, verdict: { ...record.verdict, note: 'hi' } }).success,
    ).toBe(false);
  });

  it('enforces the credential-none invariant (expiresAt must be null)', () => {
    const bad = {
      ...record,
      agent: { ...record.agent, credential: { id: 'c', status: 'none', expiresAt: record.ts } },
    };
    expect(DecisionRecordSchema.safeParse(bad).success).toBe(false);
    const good = {
      ...record,
      agent: { ...record.agent, credential: { id: 'c', status: 'none', expiresAt: null } },
    };
    expect(DecisionRecordSchema.safeParse(good).success).toBe(true);
  });

  it('requires human resolutions to link to the escalation they resolve', () => {
    const noLink = {
      ...record,
      verdict: { decision: 'deny', reason: 'HUMAN_DENIED', latencyMs: 1, linksTo: null },
    };
    expect(DecisionRecordSchema.safeParse(noLink).success).toBe(false);
    const linked = {
      ...record,
      verdict: { decision: 'deny', reason: 'HUMAN_DENIED', latencyMs: 1, linksTo: ULID },
    };
    expect(DecisionRecordSchema.safeParse(linked).success).toBe(true);
  });

  it('accepts prev as GENESIS or a sha256 ref, nothing else', () => {
    expect(DecisionRecordSchema.safeParse({ ...record, prev: SHA }).success).toBe(true);
    expect(DecisionRecordSchema.safeParse({ ...record, prev: 'genesis' }).success).toBe(false);
  });

  it('pins the vocabularies', () => {
    expect(DECISIONS).toEqual(['allow', 'deny', 'escalate']);
    expect(REASON_CODES).toContain('TIER_CAP_EXCEEDED');
    expect(REASON_CODES).toContain('CAPABILITY_NOT_GRANTED');
    expect(REASON_CODES).toContain('PARAM_NOT_ALLOWLISTED');
    expect(REASON_CODES).toContain('RATE_LIMIT_EXCEEDED');
    expect(REASON_CODES).toContain('CIRCUIT_BREAKER_OPEN');
    expect(REASON_CODES).toHaveLength(11);
    expect(CREDENTIAL_STATUSES).toEqual(['active', 'expired', 'revoked', 'none']);
  });
});

describe('toSignable', () => {
  it('strips exactly the sig field', () => {
    const signable = toSignable(record);
    expect('sig' in signable).toBe(false);
    expect(Object.keys(signable).sort()).toEqual(
      Object.keys(record).filter((k) => k !== 'sig').sort(),
    );
    expect(signable.verdict).toEqual(record.verdict); // payload untouched
  });
});

describe('chain and keys files', () => {
  it('parses a chain file and rejects empty/malformed envelopes', () => {
    expect(parseChainFile({ basisVerify: '1', records: [record] }).records).toHaveLength(1);
    expect(() => parseChainFile({ basisVerify: '1', records: [] })).toThrow();
    expect(() => parseChainFile({ basisVerify: '2', records: [record] })).toThrow();
  });

  it('parses a keys file and rejects non-base64 keys', () => {
    expect(parseKeysFile({ 'vorion-demo-2026-07': 'aGVsbG8=' })).toBeTruthy();
    expect(() => parseKeysFile({ kid: 'not base64!!' })).toThrow();
  });
});
