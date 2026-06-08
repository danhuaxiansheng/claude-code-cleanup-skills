# Claude Code Cleanup Skills

[Agent Skills](https://agentskills.io) for code cleanup, dead-code audits, necessary-code review, and page-flow simplification.

Most dead-code checks stop at "has zero references." Real cleanup often starts after that: wrappers that only forward calls, compatibility APIs kept for history, defensive branches that hide impossible states, stale defaults, duplicate state sources, and public surfaces nobody should depend on anymore.

This repository provides three small skills that help any AI coding agent and any human reviewer make those calls with evidence.

## Why Use This

Use these skills when you ask questions like:

- "Does this module really need to exist?"
- "This code is still called, but is it still necessary?"
- "Remove defensive code and meaningless wrappers."
- "Ignore backward compatibility for this cleanup."
- "Continue deep cleanup until the flow is simple."
- "Find what a normal unused-code audit would miss."

## The Three-Skill System

`necessary-code-audit` is the main entrypoint.

It decides whether current code truly needs a file, export, wrapper, compatibility layer, fallback, default value, defensive branch, or public API.

`unused-code-audit` proves consumption.

It checks whether a directory, file, export, function, component, hook, type, or helper is still consumed before deletion.

`page-flow-cleanup-audit` handles user-visible behavior.

It audits pages and feature flows by tracing state sources, queries, mutations, permissions, errors, duplicated calculations, and defensive code.

## What Normal Unused Audits Miss

Normal unused-code tools can say:

```text
This function has callers.
Do not delete it.
```

These skills ask the next question:

```text
Do those callers actually need this function,
or can they call a simpler existing primitive directly?
```

That difference catches code like:

- `logoutInvalidator.onLogout()` that only calls `cache.clear()`
- `clearByPrefix()` that only exists because a wrapper exists
- `debug` config fields that no current caller uses
- `CacheStats` APIs that were public once but no longer serve product behavior
- `try/catch` blocks that silently hide corrupted state the team wants surfaced
- page stores and query caches that both claim to own the same remote fact

## What It Preserves

These skills are aggressive about meaningless code, but conservative about real constraints.

They should preserve:

- loading, empty, error, and permission states
- SSR and browser runtime constraints
- storage quota and platform availability checks
- external input boundaries
- valid nullable domain states
- deliberate UX fallbacks

## Repository Layout

```text
skills/
  necessary-code-audit/
    SKILL.md
    agents/openai.yaml
  unused-code-audit/
    SKILL.md
    agents/openai.yaml
    scripts/find-unused-export-candidates.mjs
  page-flow-cleanup-audit/
    SKILL.md
    agents/openai.yaml
examples/
  used-but-unnecessary-cache-wrapper.md
```

## Installation

```bash
# Install all skills
npx add-skill danhuaxiansheng/claude-code-cleanup-skills

# Or install as a plugin collection in Claude Code
/plugin install danhuaxiansheng/claude-code-cleanup-skills
```

You can also copy the folders under `skills/` into any AI tool or coding-agent setup that can read skill-style instruction folders.

The skills are plain Markdown playbooks with optional metadata. They are not tied to one specific AI product.

For Codex-style local installs, copy the specific skill folders you want:

```text
skills/necessary-code-audit/
skills/unused-code-audit/
skills/page-flow-cleanup-audit/
```

## SkillsMP Discovery

This repository follows the common SkillsMP-compatible layout used by public agent-skill collections:

```text
claude-code-cleanup-skills/
├── .claude-plugin/
│   └── marketplace.json
├── skills/
│   ├── necessary-code-audit/
│   │   ├── SKILL.md
│   │   └── agents/openai.yaml
│   ├── unused-code-audit/
│   │   ├── SKILL.md
│   │   ├── agents/openai.yaml
│   │   └── scripts/find-unused-export-candidates.mjs
│   └── page-flow-cleanup-audit/
│       ├── SKILL.md
│       └── agents/openai.yaml
└── README.md
```

The GitHub repository should stay public and include skill-discovery topics such as:

```text
claude-skills
claude-code-skill
agent-skills
ai-skills
code-cleanup
dead-code
refactoring
technical-debt
```

SkillsMP indexes public GitHub repositories that expose `SKILL.md` files with `name` and `description` frontmatter. If a newly published skill does not appear immediately, wait for the next index refresh before changing the repository layout.

## Example Prompts

```text
Use necessary-code-audit on src/cache.
Do not preserve backward compatibility. Remove wrappers, stale public APIs,
unused config, and defensive branches that current code does not need.
```

```text
Use unused-code-audit on this component folder before deleting it.
Check imports, re-exports, public entrypoints, framework conventions, and generated files.
```

```text
Use page-flow-cleanup-audit on this settings page.
Find duplicated state sources, defensive UI guards, stale query invalidation,
and compatibility branches that are no longer needed.
```
