// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // Project-level rule tuning for this hand-authored contracts library.
  // strictTypeChecked surfaces a class of findings that conflict with this
  // package's deliberate, behaviour-correct design. We keep the dangerous
  // strictTypeChecked rules (floating/misused promises, unsafe assignments,
  // await-thenable, etc.) and relax only the stylistic/design-pattern rules
  // below. See the PR notes for the per-rule rationale.
  {
    files: ['src/**/*.ts'],
    rules: {
      // The package intentionally ships and internally re-exports its own
      // @deprecated backward-compat aliases (TrustBand, ControlAction, the CAR
      // parse/validate/update helpers, RuntimeTier) and uses drizzle's current
      // (but upstream-deprecated) pgTable(name, cols, extras) signature.
      // Removing these would break the public API or require an upstream
      // migration, neither of which is a mechanical lint fix.
      '@typescript-eslint/no-deprecated': 'off',
      // Deliberate post-invariant non-null assertions, e.g. regex capture
      // groups in the CAR-string parser that are provably present after a
      // successful match. Rewriting risks changing runtime behaviour.
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Intentional `'literal' | ... | string` API pattern that preserves
      // editor autocomplete hints while still accepting arbitrary strings.
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      // Interpolating numbers / numeric enums into template literals is
      // idiomatic and safe; keep the rule active for genuinely unsafe types.
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true },
      ],
    },
  },
  // Test files live under src/ (so `eslint src` picks them up) but are excluded
  // from the tsconfig project (tsconfig excludes **/*.test.ts), so the
  // typed-linting project service cannot resolve them. Disable type-aware rules
  // for test files to avoid "not found by the project service" parse errors.
  {
    files: ['**/*.test.ts'],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
