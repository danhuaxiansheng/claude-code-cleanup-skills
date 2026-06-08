---
name: unused-code-audit
description: |
  Safely determine whether a directory, file, exported symbol, function, component, constant, hook, type, or helper is unused before deleting it. Use for agent-assisted dead-code cleanup, unused code detection, unused export audits, deletion safety checks, consumer searches, and cleanup validation without breaking re-exports, aliases, public APIs, framework entrypoints, generated files, or external consumers.
license: MIT
metadata:
  author: danhuaxiansheng
  version: "0.1.0"
---

# Unused Code Audit

## Principle

Treat every automated result as a candidate, not proof. Delete only when usage, entrypoint, side-effect, and public API risks have been ruled out.

Prefer small, evidence-backed removals. Do not shrink public API surfaces merely because a type or export name has no direct import; generated declarations and inferred consumer types can still depend on it.

This skill answers "is anyone still consuming this?" It does not answer the broader question "is this still necessary?" For used-but-unnecessary code, switch to `necessary-code-audit`.

This skill is part of a three-skill cleanup system:

- Use `unused-code-audit` to prove whether code is still consumed.
- Use `necessary-code-audit` when code is used but may no longer be necessary.
- Use `page-flow-cleanup-audit` when the target includes page state, queries, mutations, permissions, errors, or user-visible behavior.

## Baseline

- Check working-tree state first: `git status --short --untracked-files=all`.
- Check both unstaged and staged changes for the target scope: `git diff --name-status -- <scope>` and `git diff --cached --name-status -- <scope>`.
- Build a current file inventory for the target scope. Prefer `rg --files <scope>` or the fastest available file search tool.
- Inspect imports, exports, manifests, framework entrypoints, generated files, and direct consumers before trusting any automated unused result.

## Candidate Classes

Classify before searching deeply:

- `file`: module, route, style, setup, generated entrypoint, or side-effect file.
- `runtime export`: function, component, hook, class, constant, store, or factory.
- `public type/API`: exported interface/type/config used by package declarations or factory return types.
- `member`: property, method, action, enum member, or config field.
- `local helper`: non-exported helper inside one file.

The class determines the risk. Public APIs, framework entrypoints, side-effect files, and persisted data require stronger proof than local helpers.

## Evidence

Use evidence in this order:

1. Structure:
   - File inventory for the directory or feature scope.
   - Public entrypoints, re-export files, framework conventions, generated files, and type declarations.
   - Language tooling, compiler diagnostics, dependency analyzers, or IDE references when available.

2. Literal search:
   - Search exact symbol names, file stems, import paths, aliases, and alternate casing with `rg`.
   - Search the defining location and every likely consumer root, not only the file or folder being deleted.
   - For members, search direct access, destructuring, indexing, callbacks, config objects, and type-only references.

3. Sweep candidates when useful:
   - Use any bundled or local unused-export script if available.
   - Pass a root for scoped audits when the tool supports it.
   - Treat automated output as leads only.

## False Positives

Keep the code unless these are ruled out:

- Re-exports, aliases, wrapper exports, or same-file aggregate usage.
- Framework conventions such as entrypoint files, layouts, metadata, middleware, loading/error files, and generated files.
- Public module exports, public entrypoint files, generated declarations, or external inferred types.
- Dynamic usage through strings, registries, maps, config arrays, content metadata, or dependency injection.
- Side effects: styles, polyfills, providers, setup modules, storage keys, analytics, subscriptions, and initialization.
- Same-file composition where exported subparts are consumed by an exported aggregate.

## Delete Criteria

Delete only when all are true:

- Structural inspection and text search show no real consumer outside allowed re-export references.
- The candidate is not a framework entrypoint, side-effect module, generated artifact, or public API requirement.
- The requested scope permits deletion.
- The edit is surgical: remove the candidate, direct exports, and newly orphaned imports/types only.

## Verification

- Run residual `rg` for every deleted symbol, file stem, and import path.
- Run the narrowest relevant typecheck.
- For public API changes, verify the defining module first, then build or typecheck affected consumers.
- Run `git diff --check -- <scope>` and, if staged changes exist, `git diff --cached --check -- <scope>`.
- If validation fails, identify whether the failure is caused by the deletion or unrelated working-tree state.

## Report

Report three things:

- Removed: what was deleted and the evidence.
- Kept: important candidates rejected as false positives and why.
- Verified: commands run, results, and any unrelated dirty files or failures.
