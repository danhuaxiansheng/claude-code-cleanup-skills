---
name: necessary-code-audit
description: |
  Audit whether current code truly needs a directory, file, export, API, wrapper, compatibility layer, defensive branch, fallback, default value, or config before simplifying or deleting it. Use for agent-assisted code cleanup, refactoring, technical-debt reduction, used-but-unnecessary code, legacy cleanup, stale public APIs, meaningless wrappers, defensive-code removal, no-backward-compatibility cleanup, deep review, continued cleanup, or "is this still necessary?" requests.
license: MIT
metadata:
  author: danhuaxiansheng
  version: "0.1.0"
---

# Necessary Code Audit

## Principle

Optimize for current necessity, not only for zero references. A symbol can be used and still be unnecessary when it is only a wrapper, compatibility surface, defensive branch, stale public API, or speculative extension point.

The core trigger is: "this code is used, but does current code really need it?"

Do not delete real runtime constraints. Keep branches that represent actual loading, empty, error, permission, lifecycle, browser, SSR, quota, external input, or domain-nullable states.

## Skill System

This skill is the primary entrypoint for a three-skill cleanup system:

- Use `necessary-code-audit` to decide whether used code is still necessary.
- Use `unused-code-audit` to prove whether deletion candidates are still consumed.
- Use `page-flow-cleanup-audit` when the target includes page state, query/mutation flow, permissions, error states, stores, or user-visible behavior.

Do not require repository-specific graph tools or project-specific agent skills. Use the best local tools available in the environment, such as file listings, language tooling, typecheck/build commands, manifests, import graphs, and text search.

This skill is useful for any AI coding agent or human reviewer that can read Markdown instructions. Do not assume a specific AI product.

## Baseline

Start with:

- `git status --short --untracked-files=all`
- `git diff --name-status -- <scope>`
- `git diff --cached --name-status -- <scope>`
- File inventory for the target scope, preferably with a fast file search tool.
- Current imports, exports, public entrypoints, and direct consumers for the target scope.

Do not assume staged changes are yours. Work with dirty files without reverting unrelated changes.

## Candidate Classes

Classify every meaningful file, export, method, field, option, fallback, and branch in the target scope:

- `current necessity`: required by current product behavior or platform/runtime constraints.
- `direct replacement`: wrapper or facade whose call sites can call the underlying primitive directly.
- `compatibility surface`: old export, optional field, default value, alias, factory, config, or public type kept for external or historical consumers.
- `defensive branch`: try/catch, fallback, optional chaining, null guard, feature detection, or corrupted-data handling.
- `speculative capability`: API surface with no current caller or only hypothetical future value.
- `duplicated source`: second cache, store, query, invalidation path, state source, or derived calculation.
- `dead code`: no real consumer after re-exports, dynamic references, and framework entrypoints are ruled out.
- `real constraint`: SSR, browser storage availability, quota, permissions, loading/error/empty lifecycle, external input, or valid optional domain state.

## Necessity Questions

For each candidate, answer before editing:

1. Does current code truly need this behavior?
2. If it has callers, do those callers need the abstraction, or can they call a simpler existing primitive?
3. Is this protecting a real runtime/domain state, or only historical compatibility/speculation?
4. If backward compatibility is out of scope, can the public type/export/config be removed?
5. Does deleting it change current product behavior? If yes, is that intended by the request?
6. What residual methods, imports, exports, comments, tests, or docs become meaningless after deleting it?

Push back when the user's deletion target is a real constraint, not defensive code.

## Cleanup Order

1. Remove wrapper, facade, and compatibility layers first.
2. Replace call sites with direct primitives.
3. Remove newly orphaned methods, helper functions, imports, exports, and public types.
4. Remove unused config keys, default values, optional fields, feature flags, and old comments.
5. Remove defensive branches that only hide impossible or outdated states.
6. Re-run residual searches after each source-of-truth or public API removal.

Avoid creating new abstractions to justify deleting old ones.

## Evidence

Use the available repository tools for structure:

- File inventory for the target directory or feature.
- Import/export searches for wrappers, methods, and exported symbols.
- Manifests, re-export files, framework conventions, generated files, and type declarations for public API impact.
- Language-aware tooling when available, such as compiler diagnostics, test coverage, dependency analyzers, or IDE references.

Use fast text search for literal residuals:

- Removed file stems and import paths.
- Removed symbol names and member names.
- Compatibility phrases such as `legacy`, `deprecated`, `backward`, `compat`, `fallback`, `debug`, old-format comments, and commented-out code.
- Defensive patterns such as `try`, `catch`, optional fields, optional chaining, `as any`, constant boolean parameters, and default config values.

If an unused-export script or dependency analyzer is available in the current environment, use it as a candidate generator only. Treat automated output as leads, not proof.

## Verification

Run the narrowest checks that cover the edited boundary:

- Defining module or library typecheck/build after public API changes.
- Direct consumer package typecheck or narrow eslint.
- Residual `rg` scans for removed symbols and old import paths.
- `git diff --check -- <scope>` and, when staged changes exist, `git diff --cached --check -- <scope>`.

If a broad typecheck fails, identify whether the failure is related to this cleanup or an existing unrelated dirty state.

## Report

Report:

- Removed: wrappers, compatibility surfaces, defensive branches, stale public APIs, dead code, and direct replacements.
- Kept: real runtime/domain constraints and why they are not meaningless defensive code.
- Verified: commands, results, residual scans, and unrelated dirty files or unrelated failures.

Be explicit when the first-pass unused audit would miss something because it is used but unnecessary.
