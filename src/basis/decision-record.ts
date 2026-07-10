// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 Vorion LLC

/**
 * @vorionsys/contracts — DecisionRecord v1
 * Single source of truth for the BASIS proof-chain record format.
 *
 * Shape only. Canonicalization (RFC 8785), hashing, and Ed25519 signing live in
 * @vorionsys/verify — never re-implement them here. See SPEC-basis-verify §2–§3.
 *
 * Exported via the "@vorionsys/contracts/basis" subpath (see ./index.ts).
 */
import { z } from "zod";

/* ── primitives ─────────────────────────────────────────────────────────── */

export const Ulid = z
  .string()
  .regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, "ULID (Crockford base32, 26 chars)");

export const Sha256Ref = z
  .string()
  .regex(/^sha256:[0-9a-f]{64}$/, 'must be "sha256:" + 64 lowercase hex chars');

/** RFC 3339 UTC with exactly millisecond precision, e.g. 2026-07-02T14:03:22.481Z */
export const Rfc3339UtcMs = z.string().datetime({ precision: 3 });

export const DottedPath = z
  .string()
  .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/, "lowercase.dotted.path");

const Base64 = z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/, "base64");

/* ── vocabularies ───────────────────────────────────────────────────────────
 * NOTE: demo-complete, not BASIS-complete. Reconcile into
 * @vorionsys/shared-constants before v0.2.0, then re-export from there so the
 * enum lives in exactly one place. `verify --strict` enforces membership;
 * default mode only enforces shape.
 * ──────────────────────────────────────────────────────────────────────── */

export const DECISIONS = ["allow", "deny", "escalate"] as const;
export const DecisionSchema = z.enum(DECISIONS);
export type Decision = z.infer<typeof DecisionSchema>;

export const REASON_CODES = [
  "WITHIN_AUTHORITY",
  "TIER_CAP_EXCEEDED",
  "DOMAIN_NOT_ALLOWLISTED",
  "CAPABILITY_NOT_GRANTED",
  "PARAM_NOT_ALLOWLISTED",
  "RATE_LIMIT_EXCEEDED",
  "CIRCUIT_BREAKER_OPEN",
  "CREDENTIAL_EXPIRED",
  "CREDENTIAL_REVOKED",
  "HUMAN_APPROVED",
  "HUMAN_DENIED",
] as const;
export const ReasonCodeSchema = z.enum(REASON_CODES);
export type ReasonCode = z.infer<typeof ReasonCodeSchema>;

export const CREDENTIAL_STATUSES = ["active", "expired", "revoked", "none"] as const;
export const CredentialStatusSchema = z.enum(CREDENTIAL_STATUSES);

/* ── record components ──────────────────────────────────────────────────── */

export const CredentialSchema = z
  .object({
    id: z.string().min(1),
    status: CredentialStatusSchema,
    /** null iff status === "none" (enforced in superRefine below) */
    expiresAt: Rfc3339UtcMs.nullable(),
  })
  .strict();

export const AgentRefSchema = z
  .object({
    id: z.string().min(1),
    /** Tier ceilings/caps are defined in @vorionsys/shared-constants. */
    tier: z.number().int().min(0),
    credential: CredentialSchema,
  })
  .strict();

export const ActionSchema = z
  .object({
    domain: DottedPath,
    capability: DottedPath,
    /** sha256 of the JCS-canonicalized params. Raw params NEVER enter a record. */
    paramsHash: Sha256Ref,
  })
  .strict();

export const PolicyRefSchema = z
  .object({
    id: z.string().min(1),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, "semver"),
    /** Hash of the exact policy document evaluated. */
    hash: Sha256Ref,
  })
  .strict();

export const VerdictSchema = z
  .object({
    decision: DecisionSchema,
    reason: ReasonCodeSchema,
    latencyMs: z.number().int().min(0),
    /** Resolution records (HUMAN_APPROVED / HUMAN_DENIED) point at the
     *  escalation record they resolve; null otherwise. */
    linksTo: Ulid.nullable(),
  })
  .strict();

export const SigSchema = z
  .object({
    alg: z.literal("ed25519"),
    kid: z.string().min(1),
    /** Ed25519 signature over the JCS-canonical record WITHOUT `sig`. */
    value: Base64,
  })
  .strict();

/* ── the record ─────────────────────────────────────────────────────────── */

export const DecisionRecordSchema = z
  .object({
    v: z.literal("1"),
    id: Ulid,
    ts: Rfc3339UtcMs,
    agent: AgentRefSchema,
    action: ActionSchema,
    policy: PolicyRefSchema,
    verdict: VerdictSchema,
    /** Hash of the previous FULL record (incl. sig) — "GENESIS" for record 0. */
    prev: z.union([Sha256Ref, z.literal("GENESIS")]),
    sig: SigSchema,
  })
  .strict()
  .superRefine((r, ctx) => {
    const c = r.agent.credential;
    if (c.status === "none" && c.expiresAt !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["agent", "credential", "expiresAt"],
        message: 'expiresAt must be null when credential status is "none"',
      });
    }
    const humanReason = r.verdict.reason === "HUMAN_APPROVED" || r.verdict.reason === "HUMAN_DENIED";
    if (humanReason && r.verdict.linksTo === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["verdict", "linksTo"],
        message: "human resolution records must link to the escalation record they resolve",
      });
    }
  });

export type DecisionRecord = z.infer<typeof DecisionRecordSchema>;
export type UnsignedDecisionRecord = Omit<DecisionRecord, "sig">;

/** Strip `sig` to produce the signable form. Canonicalization itself lives in
 *  @vorionsys/verify; this helper only guarantees field omission is uniform. */
export function toSignable(record: DecisionRecord): UnsignedDecisionRecord {
  const { sig, ...signable } = record;
  void sig; // strip-only destructure — the read satisfies no-unused-vars
  return signable;
}

/* ── chain + keys files ─────────────────────────────────────────────────── */

export const ChainFileSchema = z
  .object({
    basisVerify: z.literal("1"),
    records: z.array(DecisionRecordSchema).min(1),
  })
  .strict();
export type ChainFile = z.infer<typeof ChainFileSchema>;

/** { <kid>: <base64 raw Ed25519 public key> } */
export const KeysFileSchema = z.record(z.string().min(1), Base64);
export type KeysFile = z.infer<typeof KeysFileSchema>;

/* Structural parse helpers (crypto checks live in @vorionsys/verify). */
export const parseChainFile = (u: unknown): ChainFile => ChainFileSchema.parse(u);
export const parseKeysFile = (u: unknown): KeysFile => KeysFileSchema.parse(u);
