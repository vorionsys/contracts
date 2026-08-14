# Post-publish verification harness

The release path (tag push → GitHub Actions OIDC trusted publishing → npm, with SLSA
provenance) proves **provenance**. It does not prove that the artifact's *public surface*
is what we intended, or that downstream consumers can still consume it.

These checks close that gap. They read the package the way a stranger does: installed
from the registry, no workspace resolution, no source tree, no path mapping.

**Run them against the live registry copy after every publish.** A green local `npm test`
does not substitute — it resolves through the workspace and cannot see a broken `exports`
map, a missing `dist`, or a `files` field that dropped a directory.

Nothing here is wired into CI yet; it is a manual gate. See "Wiring this into CI" below.

---

## 1. Frozen trust-bus surface — `smoke-trust-bus.mjs`

Asserts the published `@vorionsys/contracts/canonical/trust-bus` subpath resolves and its
enums match the frozen spec exactly: `BusSeverity` 5 members, `BusSignalType` 15 members,
exact wire strings, plus `GovernanceLayer` and `SignalPriority` present. Exits non-zero on
any drift.

These are **wire values**. Changing one is a breaking change for every consumer that has
persisted or transmitted them, even though TypeScript will not complain at the producer.
That is the whole reason this check exists.

```sh
mkdir verify-tmp && cd verify-tmp && npm init -y
npm i --no-save @vorionsys/contracts@latest
node ../verify/smoke-trust-bus.mjs
```

Run it against the packed tarball too (`npm pack`, then install the `.tgz`) when you want
to check a release *before* publishing it.

## 2. TypeScript 6 consumer typecheck — `ts6-consumer/`

`peerDependencies.typescript` is `^5.0.0 || ^6.0.0`. The meaning of that widened peer is
not that our source builds under TS6 — it is that our **emitted `dist/*.d.ts` are
consumable by a TS6 project**. This check proves exactly that: enum use at type and value
level, and an exhaustive `switch` over `BusSeverity`.

```sh
cd verify/ts6-consumer
npm i --no-save @vorionsys/contracts@latest typescript@6
npx tsc -p tsconfig.json      # expect: no output, exit 0
```

> **Known and deliberate:** this package's own *source* does **not** build under `tsc` 6 —
> a global `crypto` resolution gap in `src/car/attestation.ts` and `src/car/jwt-claims.ts`
> (TS2304). `devDependencies.typescript` therefore stays on `^5.x`. This is orthogonal to
> the consumer peer: consumers read the prebuilt `dist` `.d.ts` and never recompile our
> source. Making the source build under TS6 is a separate task and is **not** a
> prerequisite for the widened peer being honest.

## 3. Downstream consumers — `downstream/`

The peer-widen in 1.1.2 existed to unblock a downstream consumer, so "did we break
downstream" is part of verifying a contracts release, not a separate concern.

- **`downstream/smoke-basis-spec.mjs`** — asserts `@vorionsys/basis-spec` still satisfies
  all 7 named root exports its consumers import, at field level: `TRUST_FACTORS` (exactly
  16, keys prefixed `CT-`/`OP-`/`SF-`), `RISK_ACCUMULATOR` (24h / 60 / 120 / 240),
  `PENALTY_RATIO_MIN` 3, `PENALTY_RATIO_MAX` 10, `RISK_LEVELS` all carrying a numeric
  `multiplier`, and non-empty `TRUST_TIERS` / `OBSERVATION_TIERS`.

  The package is **`@vorionsys/basis-spec`**, not `@vorionsys/basis` — the latter was
  withdrawn and must not be reintroduced.

  ```sh
  npm i --no-save @vorionsys/basis-spec@latest && node downstream/smoke-basis-spec.mjs
  ```

- **`downstream/rainbow-live/`** — proves `@vorionsys/rainbow` installs from the public
  registry and that its facade plus the enums it **re-exports from this package** resolve
  (`VERSION`, `BusSeverity` 5, `BusSignalType` 15, `Rainbow#ingest` callable). This is the
  check that catches "we changed contracts and silently broke the re-export."

  ```sh
  cd downstream/rainbow-live && npm ci && node smoke.mjs
  ```

  The pinned lockfile is intentional — it makes this a reproducible check rather than a
  moving target. Bump it deliberately when rainbow releases.

---

## Last verified

| Check | Against | Result |
|---|---|---|
| `smoke-trust-bus.mjs` | `@vorionsys/contracts@1.6.1` (registry `latest`) | **pass** — surface unchanged since 1.1.2 |
| `ts6-consumer/` | `@vorionsys/contracts@1.6.1` + `typescript@6.0.3` | **pass** — peer still `^5.0.0 \|\| ^6.0.0` |
| `downstream/rainbow-live/` | `@vorionsys/rainbow@0.3.0` | **pass** |

Verified 2026-08-13. Update this table when you run them; a stale table is worse than no
table, because it reads as a guarantee.

## Wiring this into CI

These are deliberately dependency-free scripts so they can run as a post-publish job
without a build step. The natural home is a workflow that triggers on `release: published`
and runs checks 1 and 2 against `@vorionsys/contracts@${{ github.event.release.tag_name }}`
— failing the job on drift, which surfaces a bad publish immediately rather than when a
consumer hits it.

Until that exists, treat this as a manual release-checklist step.
