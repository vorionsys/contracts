// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 Vorion LLC

/**
 * BASIS decision-record wire format (proof chains).
 *
 * Exported ONLY via the `@vorionsys/contracts/basis` subpath — deliberately not
 * re-exported from the package root, where `Decision`/`DecisionRecord` names
 * would collide with the v2 platform contracts. Consumers:
 * `@vorionsys/verify`, `@vorionsys/gate-core`, the basis-demo app.
 */
export * from './decision-record.js';
