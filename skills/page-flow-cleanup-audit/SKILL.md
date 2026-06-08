---
name: page-flow-cleanup-audit
description: |
  Audit and clean a page, feature flow, component, or file by tracing state sources, business invariants, queries, mutations, permissions, errors, duplicated calculations, and defensive code. Use for agent-assisted frontend cleanup, page cleanup, feature-flow cleanup, source-of-truth audits, query/mutation cleanup, permission/error-state review, defensive UI removal, and continued deep cleanup.
license: MIT
metadata:
  author: danhuaxiansheng
  version: "0.1.0"
---

# Page Flow Cleanup Audit

## Principle

Start from first principles: identify the page purpose, the facts it depends on, and the business invariants that must stay true. Do not start by mechanically deduplicating files or deleting optional checks.

Good cleanup removes extra sources of truth and meaningless branches while preserving real loading, empty, error, permission, and lifecycle states.

This skill is useful when cleanup might change user-visible behavior. It separates meaningless defensive code from real lifecycle, permission, error, and empty states.

This skill is part of a three-skill cleanup system:

- Use `page-flow-cleanup-audit` for user-visible flows, state ownership, and business invariants.
- Use `necessary-code-audit` for wrapper, compatibility, fallback, default, and defensive-code necessity decisions.
- Use `unused-code-audit` to prove whether removed helpers, exports, and files still have consumers.

## Workflow

### 1. Define the Flow Boundary

- Name the page/file/feature and its user-visible purpose.
- Identify entrypoints: user-facing entry, main component or handler, hooks, query helpers, mutation helpers, stores, dialogs, and external consumers.
- Separate primary flow from adjacent reusable business surfaces. Do not merge UI just because it looks similar.
- If the request includes "no backward compatibility" or "delete defensive code", apply that only to compatibility or impossible-state guards, not to real nullable business states.

### 2. Find the Source of Truth

Trace state in this order:

1. Server/API contract.
2. Query key and query function.
3. Query cache invalidation after mutations.
4. Local store or component state.
5. Derived calculations.
6. UI adapters and presentation.

Red flags:

- Multiple queries fetching the same business fact.
- A store and React Query both claiming ownership of the same remote state.
- Mutation code invalidating raw keys directly in several components.
- A "lightweight" query that duplicates the same API source and creates a second cache.
- Component-local count/status derived from a stale or separate source.

Preferred shape:

- One query helper owns one remote fact.
- Mutations call one shared invalidation helper.
- Counts and labels derive from the canonical query unless a real backend count endpoint exists.
- Response types express post-boundary guarantees instead of adding UI guards.

### 3. Classify Duplicate Logic

Only extract logic when it is deterministic and business-equivalent across consumers.

Extract:

- Product/category grouping.
- Filtering and sorting.
- Time-series or portfolio derivation.
- Eligibility predicates.
- Query-key projection helpers.
- Type-level response/request boundary helpers.

Do not extract:

- Layout, density, collapse behavior, mobile/desktop interaction, toolbar composition, or route-specific loading decisions.
- Similar-looking UI code whose context or user workflow differs.
- A component wrapper that would only hide two call sites without reducing business complexity.

### 4. Classify Defensive Code

Delete as meaningless when:

- The prop or boundary type already guarantees the value.
- A boolean parameter is always passed as a constant.
- A helper only wraps an empty object or obvious literal.
- A fallback exists only for old data formats that the user explicitly said to stop supporting.
- An `as any` hides a type mismatch that can be fixed by narrowing the boundary.
- Optional chaining contradicts a required prop and only weakens errors.

Keep as meaningful when:

- The domain type is truly optional, such as optional expiration, optional strategy items, absent profile data, or no selected row.
- The branch represents a real loading, empty, error, permission, or access state.
- The fallback is a deliberate user experience degradation, such as screenshot share falling back to link share.
- The value comes from external input whose absence is still valid business behavior.

When a value is optional only before a successful boundary, create a narrower response type rather than adding UI guards.

### 5. Clean in a Safe Order

1. Remove obsolete source-of-truth paths first.
2. Add or reuse shared invalidation helpers.
3. Extract pure calculation helpers.
4. Replace duplicated local derivations with the helpers.
5. Tighten types at request/response boundaries.
6. Remove meaningless guards, `as any`, empty fallback helpers, and constant parameters.
7. Simplify query keys by projecting only the fields that affect the result.
8. Re-run residual searches after each source or helper removal.

Avoid normalizing data "just in case". Keep edits surgical and tied to the flow being audited.

## Evidence Chain

Use the available repository tools for structure:

- File inventory for the page or feature.
- Import/export searches for components, hooks, helpers, stores, queries, mutations, and route entrypoints.
- Manifests, public entrypoints, generated files, type declarations, and framework conventions.
- Language-aware tooling when available, such as compiler diagnostics, test coverage, dependency analyzers, or IDE references.

Then use literal scans for residuals:

- Old store names.
- Old query helpers and keys.
- Removed helper names.
- Constant parameters.
- `as any`.
- Optional chaining on required props.
- Compatibility comments or old-format branches.

Scan the defining location and every likely consumer root, not just the file or folder being edited.

## Verification

Run the narrowest checks that cover the touched boundary:

- Package build when exported query/types changed.
- Package typecheck for local component/helper changes.
- Affected application or consumer typecheck when public imports are touched.
- Residual `rg` scans for deleted symbols and old source paths.
- `git diff --check`.

If generated artifacts or declaration files are read by downstream consumers, rebuild dependencies in order before judging downstream type errors.

## Reporting

Report:

- Source-of-truth changes.
- Pure helpers extracted and duplicated logic removed.
- Defensive code deleted versus meaningful nullable states kept.
- Type boundaries tightened.
- Residual scans and validation commands.
- Dirty unrelated files that were not touched.

When pushing back, be explicit: "this is not defensive code; it is a real business empty/error/permission/lifecycle state."
