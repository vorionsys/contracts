#!/usr/bin/env node
// Runs the published-package checks against a registry version, from a scratch directory
// OUTSIDE this repository.
//
// WHY OUTSIDE — this is the whole point, do not "simplify" it away:
// This package declares an `exports` map, so Node self-references the specifier
// `@vorionsys/contracts/canonical/trust-bus` to the LOCAL `dist/` for any script living
// inside the repo tree. Bare-specifier resolution walks up from the *importing module's*
// location, so running the checks in-tree — even from a sibling temp directory with the
// package installed — silently verifies the local build instead of the published
// artifact. In CI, where `npm run build` has already run, that is a green check that
// never touched the registry: a false green in the one tool whose job is preventing
// false greens.
//
// Confirmed behaviour: `import.meta.resolve('@vorionsys/contracts/canonical/trust-bus')`
// from the repo root returns `file://<repo>/dist/canonical/trust-bus.js`.
//
// This script therefore copies the check scripts into an OS temp directory, installs the
// published package there, and asserts that resolution actually landed in that
// directory's node_modules before trusting any result.
//
// Usage:
//   node verify/run.mjs              # verify dist-tag `latest`
//   node verify/run.mjs 1.6.1        # verify an exact version
//   node verify/run.mjs latest --keep   # leave the scratch dir for inspection

import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const PKG = '@vorionsys/contracts';
const HERE = dirname(fileURLToPath(import.meta.url));
const target = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'latest';
const keep = process.argv.includes('--keep');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const scratch = mkdtempSync(join(tmpdir(), 'vorion-contracts-verify-'));
let failed = 0;

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });

const step = (name, fn) => {
  process.stdout.write(`\n=== ${name} ===\n`);
  try {
    fn();
    process.stdout.write(`--- PASS: ${name}\n`);
  } catch (e) {
    failed++;
    process.stdout.write(`--- FAIL: ${name}\n${e.message}\n`);
  }
};

process.stdout.write(`Verifying ${PKG}@${target}\nScratch: ${scratch}\n`);

try {
  // --- install the published package in the scratch dir -------------------------------
  writeFileSync(join(scratch, 'package.json'), JSON.stringify({ name: 'verify-scratch', private: true }, null, 2));
  run(npm, ['i', '--no-save', '--no-audit', '--no-fund', `${PKG}@${target}`], scratch);

  // --- prove we are testing the REGISTRY copy, not a self-referenced local dist -------
  step('resolution provenance (guards against self-reference false-green)', () => {
    const probe = join(scratch, '__probe.mjs');
    writeFileSync(
      probe,
      `const u = import.meta.resolve(${JSON.stringify(PKG + '/canonical/trust-bus')});\n` +
        `const v = (await import('node:fs')).readFileSync(${JSON.stringify(join(scratch, 'node_modules', ...PKG.split('/'), 'package.json'))}, 'utf8');\n` +
        `console.log(JSON.stringify({ resolved: u, version: JSON.parse(v).version }));\n`,
    );
    const out = execFileSync(process.execPath, [probe], { encoding: 'utf8' });
    const { resolved, version } = JSON.parse(out.trim().split('\n').pop());
    const expectedPrefix = pathToFileURL(join(scratch, 'node_modules')).href;
    process.stdout.write(`resolved: ${resolved}\ninstalled version: ${version}\n`);
    if (!resolved.startsWith(expectedPrefix)) {
      throw new Error(
        `resolved OUTSIDE the scratch install (${resolved}) — the check would have verified a local build, not the published package`,
      );
    }
    if (target !== 'latest' && version !== target) {
      throw new Error(`installed ${version} but asked for ${target}`);
    }
    rmSync(probe, { force: true });
  });

  // --- check 1: frozen trust-bus surface ----------------------------------------------
  step('frozen trust-bus surface', () => {
    copyFileSync(join(HERE, 'smoke-trust-bus.mjs'), join(scratch, 'smoke-trust-bus.mjs'));
    run(process.execPath, ['smoke-trust-bus.mjs'], scratch);
  });

  // --- check 2: TypeScript 6 consumer typecheck ---------------------------------------
  step('TypeScript 6 consumer typecheck', () => {
    const ts6 = join(scratch, 'ts6-consumer');
    mkdirSync(ts6, { recursive: true });
    for (const f of ['consume.ts', 'tsconfig.json', 'package.json']) {
      copyFileSync(join(HERE, 'ts6-consumer', f), join(ts6, f));
    }
    run(npm, ['i', '--no-save', '--no-audit', '--no-fund', `${PKG}@${target}`, 'typescript@6'], ts6);
    run(npm, ['exec', '--', 'tsc', '-p', 'tsconfig.json'], ts6);
  });
} finally {
  if (keep) {
    process.stdout.write(`\nScratch kept at ${scratch}\n`);
  } else {
    rmSync(scratch, { recursive: true, force: true });
  }
}

process.stdout.write(`\n${failed === 0 ? `OK: ${PKG}@${target} passed all published-package checks` : `${failed} check(s) FAILED`}\n`);
process.exit(failed === 0 ? 0 : 1);
